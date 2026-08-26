"""
tests/test_vayu.py
Automated test suite for VAYU-CPI econometric engine, ingestion unbundler, anomaly detector, and API routes.
"""

import pytest
from datetime import date, datetime
from core.schemas import RawFareRecord, RouteJevonsIndex, NationalCompositeCPI, SurgeAlert
from core.dgca_weights import ROUTE_WEIGHTS, HORIZON_ALPHA, get_route_weight, get_horizon_alpha
from services.ingestion.unbundler import unbundle_fare
from services.engine.seed_base_2024 import get_base_fare, BASE_FARES
from services.engine.index_calculator import compute_national_composite_cpi, compute_route_jevons_index
from services.engine.anomaly_detector import detect_surges
from services.persistence.db import FareObservation


def test_core_schemas():
    record = RawFareRecord(
        portal="Google Flights Live Feed",
        carrier_name="IndiGo",
        carrier_code="6E",
        flight_number="6E-205",
        origin="DEL",
        destination="BOM",
        departure_time="2026-09-02 08:30",
        scraped_at="2026-08-26T22:30:00",
        horizon_days=7,
        base_fare=3550.0,
        fuel_surcharge_yq=600.0,
        airport_fee_udf=650.0,
        convenience_fee=300.0,
        total_fare=5100.0,
    )
    assert record.origin == "DEL"
    assert record.destination == "BOM"
    assert record.total_fare == 5100.0


def test_dgca_weights():
    assert get_route_weight("DEL", "BOM") == 0.26
    assert get_route_weight("BOM", "DEL") == 0.24
    assert get_route_weight("BLR", "DEL") == 0.20
    assert get_horizon_alpha(30) == 0.35
    assert get_horizon_alpha(7) == 0.45
    assert get_horizon_alpha(1) == 0.20


def test_unbundler():
    res = unbundle_fare(6500.0, "DEL", "BOM")
    assert res["airport_fee_udf"] == 650.0
    assert res["convenience_fee"] == 300.0
    assert res["fuel_surcharge_yq"] == 600.0
    assert res["base_fare"] == 6500.0 - (650.0 + 300.0 + 600.0)
    assert res["total_fare"] == 6500.0


def test_unbundler_low_fare_fallback():
    # Low fare fallback test
    res = unbundle_fare(1000.0, "DEL", "BOM")
    assert res["base_fare"] == 600.0
    assert res["total_fare"] == 1000.0


def test_seed_base_2024():
    base_del_bom_7 = get_base_fare("DEL", "BOM", 7)
    assert base_del_bom_7 == 4200.0
    base_del_bom_30 = get_base_fare("DEL", "BOM", 30)
    assert base_del_bom_30 == round(4200.0 * 0.85, 2)


def test_anomaly_detector():
    now_str = datetime.now().isoformat()
    past_str = (datetime.now() - pytest.importorskip("datetime").timedelta(days=10)).isoformat()
    
    # 5 baseline records with slight variation around 5000 and 1 recent record at 15000
    baseline_fares = [4900.0, 5100.0, 5000.0, 4950.0, 5050.0]
    records = []
    for i, fare in enumerate(baseline_fares):
        records.append(RawFareRecord(
            portal="Test",
            carrier_name="IndiGo",
            carrier_code="6E",
            flight_number=f"6E-{100+i}",
            origin="DEL",
            destination="PAT",
            departure_time="2026-09-02 08:30",
            scraped_at=past_str,
            horizon_days=1,
            base_fare=fare * 0.8,
            total_fare=fare
        ))
    records.append(RawFareRecord(
        portal="Test",
        carrier_name="IndiGo",
        carrier_code="6E",
        flight_number="6E-999",
        origin="DEL",
        destination="PAT",
        departure_time="2026-09-02 08:30",
        scraped_at=now_str,
        horizon_days=1,
        base_fare=14000.0,
        total_fare=15000.0
    ))
    
    alerts = detect_surges(records, rolling_window_days=30)
    assert len(alerts) >= 1
    assert alerts[0].corridor == "DEL-PAT"
    assert alerts[0].severity in ["CRITICAL", "HIGH", "MODERATE"]


def test_fastapi_endpoints():
    from fastapi.testclient import TestClient
    from services.api.main import app
    from services.persistence.db import init_db

    init_db()
    client = TestClient(app)
    
    # Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # CPI endpoint
    res = client.get("/api/v1/cpi/airfare-index")
    assert res.status_code == 200
    data = res.json()
    assert "composite_index" in data
    assert "tracked_corridors" in data

    # CPI Series endpoint (returns list directly)
    res = client.get("/api/v1/cpi/airfare-index/series?days_back=5")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # DGCA Surge alerts endpoint (returns list directly)
    res = client.get("/api/v1/dgca/surge-alerts")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # DGCA Fee decomposition endpoint
    res = client.get("/api/v1/dgca/decomposition")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # DGCA Concentration endpoint
    res = client.get("/api/v1/dgca/route-concentration")
    assert res.status_code == 200
    assert "hhi" in res.json()
