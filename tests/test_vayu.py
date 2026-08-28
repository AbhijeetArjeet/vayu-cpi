"""
tests/test_vayu.py
Comprehensive automated test suite for VAYU-CPI SIH System.
Tests schemas, cleaning pipeline, outlier detection, booking windows (T+1..T+45),
DGCA weighting, Jevons index calculator, 30-day backtester, connectors, and FastAPI endpoints.
"""

import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient

from core.schemas import (
    RawFareRecord,
    RouteJevonsIndex,
    NationalCompositeCPI,
    SurgeAlert,
    BacktestResult,
)
from core.dgca_weights import (
    ROUTE_WEIGHTS,
    HORIZON_ALPHA,
    get_route_weight,
    get_horizon_alpha,
    get_horizon_code,
    parse_horizon_code,
)
from services.ingestion.unbundler import unbundle_fare
from services.engine.seed_base_2024 import get_base_fare
from services.engine.normalizer import (
    deduplicate_by_flight,
    filter_valid_fares,
    strip_outliers,
    clean_observations_with_report,
    normalize,
)
from services.engine.index_calculator import (
    compute_national_composite_cpi,
    compute_route_jevons_index,
    compute_carrier_indices,
    _geometric_mean,
)
from services.engine.backtester import run_30day_backtest, _calculate_pearson_correlation
from services.engine.anomaly_detector import detect_surges
from services.persistence.db import FareObservation, init_db
from services.ingestion.connectors import get_connector, CONNECTOR_REGISTRY
from services.api.main import app


# 1. Schema & Booking Window Tests
def test_core_schemas_and_booking_windows():
    record = RawFareRecord(
        portal="Google Flights",
        source="Google Flights Live Feed",
        carrier="IndiGo",
        carrier_name="IndiGo",
        carrier_code="6E",
        flight_number="6E-205",
        origin="DEL",
        destination="BOM",
        departure_time="2026-09-02 08:30:00",
        scraped_at="2026-08-26T22:30:00",
        horizon_days=7,
        booking_window="T+7",
        fare_class="Economy",
        base_fare=3550.0,
        fuel_surcharge_yq=600.0,
        airport_fee_udf=650.0,
        convenience_fee=300.0,
        total_fare=5100.0,
    )
    assert record.origin == "DEL"
    assert record.destination == "BOM"
    assert record.total_fare == 5100.0
    assert record.booking_window == "T+7"
    assert record.availability_status == "AVAILABLE"


def test_booking_window_helpers():
    assert get_horizon_code(1) == "T+1"
    assert get_horizon_code(7) == "T+7"
    assert get_horizon_code(15) == "T+15"
    assert get_horizon_code(30) == "T+30"
    assert get_horizon_code(45) == "T+45"

    assert parse_horizon_code("T+1") == 1
    assert parse_horizon_code("T+7") == 7
    assert parse_horizon_code("T+15") == 15
    assert parse_horizon_code("T+30") == 30
    assert parse_horizon_code("T+45") == 45


# 2. DGCA Weights & Route Basket
def test_dgca_weights():
    assert get_route_weight("DEL", "BOM") > 0.0
    assert get_route_weight("BOM", "DEL") > 0.0
    assert get_route_weight("BLR", "DEL") > 0.0
    
    # All 5 horizons must have defined alpha weights
    for h in [1, 7, 15, 30, 45]:
        assert get_horizon_alpha(h) > 0.0


# 3. Data Cleaning Pipeline: Deduplication, Invalid Fares & Outliers
def test_cleaning_pipeline_deduplication():
    now_str = datetime.now().isoformat()
    obs1 = FareObservation(
        id=1, flight_number="6E-201", origin="DEL", destination="BOM",
        departure_time="2026-09-05 10:00:00", scraped_at=now_str,
        horizon_days=7, total_fare=4500.0, availability_status="AVAILABLE",
    )
    obs2 = FareObservation(
        id=2, flight_number="6E-201", origin="DEL", destination="BOM",
        departure_time="2026-09-05 10:00:00", scraped_at=now_str,
        horizon_days=7, total_fare=4600.0, availability_status="AVAILABLE",
    )
    deduped = deduplicate_by_flight([obs1, obs2])
    assert len(deduped) == 1


def test_cleaning_pipeline_invalid_and_sold_out():
    now_str = datetime.now().isoformat()
    valid_obs = FareObservation(
        id=1, flight_number="AI-101", origin="DEL", destination="BOM",
        departure_time="2026-09-05 10:00:00", scraped_at=now_str,
        horizon_days=7, total_fare=5000.0, availability_status="AVAILABLE",
    )
    negative_fare = FareObservation(
        id=2, flight_number="AI-102", origin="DEL", destination="BOM",
        departure_time="2026-09-05 10:00:00", scraped_at=now_str,
        horizon_days=7, total_fare=-500.0, availability_status="AVAILABLE",
    )
    sold_out = FareObservation(
        id=3, flight_number="AI-103", origin="DEL", destination="BOM",
        departure_time="2026-09-05 10:00:00", scraped_at=now_str,
        horizon_days=7, total_fare=6000.0, availability_status="SOLD_OUT",
    )
    filtered = filter_valid_fares([valid_obs, negative_fare, sold_out])
    assert len(filtered) == 1
    assert filtered[0].id == 1


def test_cleaning_pipeline_outlier_detection():
    now_str = datetime.now().isoformat()
    # 5 standard fares around 5000 and 1 massive outlier at 80000 (e.g. accidental luxury class)
    observations = [
        FareObservation(
            id=i, flight_number=f"6E-{100+i}", origin="DEL", destination="BOM",
            departure_time="2026-09-05 10:00:00", scraped_at=now_str,
            horizon_days=7, total_fare=fare, availability_status="AVAILABLE",
        )
        for i, fare in enumerate([4800.0, 5000.0, 5200.0, 4900.0, 5100.0, 80000.0])
    ]
    cleaned, report = clean_observations_with_report(observations)
    assert len(cleaned) == 5
    assert report.outliers_removed == 1


# 4. Geometric Mean & Index Calculator
def test_geometric_mean():
    values = [2000.0, 4000.0, 8000.0]
    gm = _geometric_mean(values)
    assert round(gm, 2) == 4000.0


def test_route_and_carrier_indices():
    init_db()
    idx = compute_route_jevons_index("DEL", "BOM", 7, mode="combined")
    assert idx is not None
    assert idx.jevons_index > 0.0
    assert idx.booking_window == "T+7"

    carriers = compute_carrier_indices(mode="combined")
    assert len(carriers) > 0
    assert carriers[0].carrier_index > 0.0


def test_national_composite_cpi():
    init_db()
    cpi = compute_national_composite_cpi(mode="combined")
    assert cpi.composite_index > 0.0
    assert cpi.spot_sub_index > 0.0
    assert cpi.week_sub_index > 0.0
    assert cpi.tracked_corridors > 0


# 5. 30-Day Backtesting & Error Metrics
def test_30day_backtesting_engine():
    res = run_30day_backtest(mode="historical")
    assert isinstance(res, BacktestResult)
    assert len(res.series) == 30
    assert res.metrics.observation_days == 30
    assert res.metrics.mae >= 0.0
    assert res.metrics.rmse >= 0.0
    assert res.metrics.mape >= 0.0
    assert -1.0 <= res.metrics.pearson_correlation <= 1.0
    assert res.metrics.validation_status in ("PASSED", "WARNING")


def test_pearson_correlation_metric():
    x = [100.0, 102.0, 105.0, 108.0, 110.0]
    y = [100.5, 102.3, 104.8, 108.2, 109.9]
    r = _calculate_pearson_correlation(x, y)
    assert r > 0.98


# 6. Modular Connectors & Ethical Policy
def test_modular_connectors_registry():
    indigo = get_connector("6E")
    assert indigo.carrier_code == "6E"
    assert indigo.respect_robots_txt is True

    ai = get_connector("AI")
    assert ai.carrier_code == "AI"

    sim = get_connector("SIMULATED")
    quotes = sim.fetch_quotes("DEL", "BOM", 7)
    assert len(quotes) > 0
    assert quotes[0].source_type == "SIMULATED"
    assert quotes[0].is_modeled is True


# 7. Anomaly & Surge Detector
def test_anomaly_detector():
    now_str = datetime.now().isoformat()
    past_str = (datetime.now() - timedelta(days=10)).isoformat()
    
    baseline_fares = [4900.0, 5100.0, 5000.0, 4950.0, 5050.0]
    records = []
    for i, fare in enumerate(baseline_fares):
        records.append(RawFareRecord(
            portal="Test",
            carrier="IndiGo",
            carrier_name="IndiGo",
            carrier_code="6E",
            flight_number=f"6E-{100+i}",
            origin="DEL",
            destination="PAT",
            departure_time="2026-09-02 08:30:00",
            scraped_at=past_str,
            horizon_days=1,
            base_fare=fare * 0.8,
            total_fare=fare
        ))
    records.append(RawFareRecord(
        portal="Test",
        carrier="IndiGo",
        carrier_name="IndiGo",
        carrier_code="6E",
        flight_number="6E-999",
        origin="DEL",
        destination="PAT",
        departure_time="2026-09-02 08:30:00",
        scraped_at=now_str,
        horizon_days=1,
        base_fare=14000.0,
        total_fare=15000.0
    ))
    
    alerts = detect_surges(records, rolling_window_days=30)
    assert len(alerts) >= 1
    assert alerts[0].corridor == "DEL-PAT"
    assert alerts[0].severity in ["CRITICAL", "HIGH", "MODERATE"]


# 8. Unbundler
def test_unbundler():
    res = unbundle_fare(6500.0, "DEL", "BOM")
    assert res["airport_fee_udf"] == 650.0
    assert res["convenience_fee"] == 300.0
    assert res["fuel_surcharge_yq"] == 600.0
    assert res["base_fare"] == 6500.0 - (650.0 + 300.0 + 600.0)
    assert res["total_fare"] == 6500.0


# 9. FastAPI Endpoints (Standard & SIH Specified)
def test_fastapi_all_sih_endpoints():
    init_db()
    client = TestClient(app)

    # 1. /health
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # 2. /routes
    res = client.get("/routes")
    assert res.status_code == 200
    assert "routes" in res.json()

    # 3. /carriers
    res = client.get("/carriers")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 4. /fares
    res = client.get("/fares?limit=10")
    assert res.status_code == 200
    assert "fares" in res.json()

    # 5. /index
    res = client.get("/index")
    assert res.status_code == 200
    assert "composite_index" in res.json()

    # 6. /index/daily
    res = client.get("/index/daily?days_back=5")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 7. /index/weekly
    res = client.get("/index/weekly?weeks_back=4")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 8. /index/monthly
    res = client.get("/index/monthly?months_back=3")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 9. /backtest
    res = client.get("/backtest")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "series" in data
    assert len(data["series"]) == 30

    # 10. /api/v1/cpi/airfare-index
    res = client.get("/api/v1/cpi/airfare-index")
    assert res.status_code == 200


# 10. Sweep Continuation Fail-soft
def test_scheduler_continuation(monkeypatch):
    import services.ingestion.live_fetcher as lf

    call_count = 0

    def mock_fetch_route_horizon_with_diagnostics(origin, destination, horizon_days):
        nonlocal call_count
        call_count += 1
        # Intentionally raise exception on 1st call to verify sweep continues
        if origin == "DEL" and destination == "BOM" and horizon_days == 45:
            raise RuntimeError("Mock connection error for DEL-BOM T+45")
        return {
            "records": [],
            "fetch_stage": {"status": "success", "flight_groups": 10, "elapsed_ms": 100},
            "parse_stage": {"status": "success", "records_generated": 5, "skipped_offers": 0},
            "departure_date": "2026-09-03"
        }

    monkeypatch.setattr(lf, "fetch_route_horizon_with_diagnostics", mock_fetch_route_horizon_with_diagnostics)

    records, summary = lf.fetch_all_corridors_with_summary()

    expected_total = len(lf.TRACKED_CORRIDORS) * len(lf.TRACKED_HORIZONS)
    assert summary["total_jobs"] == expected_total
    assert summary["failed_jobs"] == 1
    assert summary["success_jobs"] == expected_total - 1
    assert call_count == expected_total
