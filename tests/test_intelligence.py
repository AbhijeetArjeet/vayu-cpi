"""
tests/test_intelligence.py
Automated Test Suite for VAYU-CPI Statistical Intelligence Platform.

Tests:
1. Inflation Explainer Factor Decomposition & Attribution
2. Automated 3-Sigma Shock Detector & Severity Classification
3. Fair Fare Expected Price & Percentile Valuation
4. What-If CPI Scenario Simulator Elasticity Bounds
5. Data Confidence Score Multi-Factor Math
6. Hierarchical Index Audit Trace (National down to Observation)
7. VAYU Fare DNA Fingerprint Generation
8. Multi-Source Consensus & Outlier Flagging
9. Airfare Weather & Regional Pressure
10. Event / Festival Comparative Analysis
11. Index Lab Formula Experimentation & Upward Substitution Bias
12. FastAPI Intelligence Route Endpoints (HTTP 200)
"""

import pytest
from fastapi.testclient import TestClient

from services.api.main import app
from core.schemas import FairFareRequest, SimulationRequest, IndexLabRequest
from services.engine.intelligence import (
    compute_inflation_explainer,
    detect_airfare_shocks,
    compute_shock_summary,
    compute_fair_fare_estimate,
    run_what_if_cpi_simulation,
    compute_data_confidence_report,
    build_index_trace_tree,
    generate_fare_dna_profile,
    compute_source_consensus_report,
    compute_airfare_weather_report,
    compute_event_impact_report,
    execute_index_lab_experiment,
)

client = TestClient(app)


def test_inflation_explainer_decomposition():
    res = compute_inflation_explainer(mode="live", period_days=30)
    assert res.status == "SUCCESS"
    assert res.headline_cpi > 0
    assert len(res.primary_drivers) == 5
    
    # Factor percentages should sum close to 100%
    total_pct = sum(f.contribution_pct for f in res.primary_drivers)
    assert 99.0 <= total_pct <= 101.0
    assert len(res.corridor_contributions) > 0


def test_airfare_shock_detector_and_summary():
    shocks = detect_airfare_shocks(mode="combined", min_severity="NORMAL")
    assert isinstance(shocks, list)
    
    summary = compute_shock_summary(mode="combined")
    assert summary.total_active_shocks >= 0
    assert isinstance(summary.most_volatile_corridor, str)


def test_fair_fare_percentile_calculation():
    req = FairFareRequest(
        origin="DEL",
        destination="BOM",
        horizon_days=7,
        current_fare=7500.0,
    )
    res = compute_fair_fare_estimate(req)
    assert res.origin == "DEL"
    assert res.destination == "BOM"
    assert res.expected_fare > 0
    assert res.distribution.p10 <= res.distribution.median <= res.distribution.p90
    assert res.fare_status in ("UNUSUALLY_CHEAP", "FAIR_NORMAL", "ELEVATED", "UNUSUALLY_EXPENSIVE", "INSUFFICIENT_DATA")


def test_fair_fare_insufficient_data_handling():
    req = FairFareRequest(
        origin="XYZ",
        destination="ABC",
        horizon_days=7,
        current_fare=5000.0,
    )
    res = compute_fair_fare_estimate(req)
    assert res.fare_status == "INSUFFICIENT_DATA"
    assert "Insufficient" in res.assessment_notes


def test_what_if_cpi_simulation():
    req = SimulationRequest(
        demand_shock_pct=15.0,
        capacity_shock_pct=-8.0,
        fuel_surcharge_shock_pct=20.0,
        seasonality_multiplier=1.1,
    )
    res = run_what_if_cpi_simulation(req)
    assert res.is_simulation is True
    assert res.simulated_national_cpi > 0
    assert "North" in res.regional_impacts
    assert "West" in res.regional_impacts
    assert len(res.corridor_impacts) > 0


def test_data_confidence_score():
    report = compute_data_confidence_report(mode="live")
    assert 0.0 <= report.overall_confidence_score <= 100.0
    assert report.confidence_tier in ("HIGH_CONFIDENCE", "MODERATE_CONFIDENCE", "LOW_OBSERVATION")
    assert len(report.factors) == 5


def test_index_trace_tree_hierarchy():
    tree = build_index_trace_tree(mode="live")
    assert tree.root.level == "NATIONAL"
    assert tree.root.children is not None
    assert len(tree.root.children) > 0
    
    # Verify regional child node
    reg_node = tree.root.children[0]
    assert reg_node.level == "REGIONAL"


def test_fare_dna_profile():
    dna = generate_fare_dna_profile("DEL", "BOM")
    assert dna.corridor == "DEL-BOM"
    assert 1.0 <= dna.volatility_score <= 10.0
    assert 1.0 <= dna.demand_pressure_score <= 10.0
    assert "Base Fare" in dna.fare_breakdown_percentages


def test_source_consensus_engine():
    consensus = compute_source_consensus_report("DEL", "BOM", 7)
    assert consensus.corridor == "DEL-BOM"
    assert consensus.market_consensus_fare > 0
    assert 0.0 <= consensus.agreement_score_pct <= 100.0
    assert len(consensus.source_prices) > 0


def test_airfare_weather_report():
    weather = compute_airfare_weather_report()
    assert len(weather.regions) == 5
    assert weather.national_pressure_level in ("STABLE", "MODERATE", "HIGH", "SHOCK")


def test_event_impact_report():
    events = compute_event_impact_report()
    assert len(events.comparisons) >= 4
    assert any("Diwali" in c.event_name for c in events.comparisons)


def test_index_lab_arithmetic_bias():
    # Test Jevons standard
    req_j = IndexLabRequest(methodology="JEVONS", weighting_scheme="DGCA_TRAFFIC", booking_horizon="T+7")
    res_j = execute_index_lab_experiment(req_j)
    assert res_j.computed_index > 0
    assert "JEVONS" in res_j.methodology_used.upper()

    # Test Carli/Dutot Arithmetic bias demonstration
    req_c = IndexLabRequest(methodology="CARLI_DUTOT_ARITHMETIC", weighting_scheme="DGCA_TRAFFIC", booking_horizon="T+7")
    res_c = execute_index_lab_experiment(req_c)
    assert res_c.upward_bias_demonstration_pct is not None
    assert res_c.upward_bias_demonstration_pct > 0
    assert res_c.computed_index >= res_j.computed_index


def test_intelligence_api_endpoints_http():
    # 1. Explainer endpoint
    r1 = client.get("/api/v1/intelligence/explainer?mode=live&period_days=30")
    assert r1.status_code == 200
    assert "headline_cpi" in r1.json()

    # 2. Shocks endpoint
    r2 = client.get("/api/v1/intelligence/shocks")
    assert r2.status_code == 200
    assert isinstance(r2.json(), list)

    # 3. Shocks summary
    r3 = client.get("/api/v1/intelligence/shocks/summary")
    assert r3.status_code == 200

    # 4. Fair fare POST
    r4 = client.post("/api/v1/intelligence/fair-fare", json={"origin": "DEL", "destination": "BOM", "horizon_days": 7, "current_fare": 7000})
    assert r4.status_code == 200

    # 5. Simulate POST
    r5 = client.post("/api/v1/intelligence/simulate", json={"demand_shock_pct": 10, "capacity_shock_pct": -5})
    assert r5.status_code == 200
    assert r5.json()["is_simulation"] is True

    # 6. Confidence endpoint
    r6 = client.get("/api/v1/intelligence/confidence")
    assert r6.status_code == 200

    # 7. Index trace endpoint
    r7 = client.get("/api/v1/intelligence/index-trace")
    assert r7.status_code == 200

    # 8. Fare DNA endpoint
    r8 = client.get("/api/v1/intelligence/fare-dna/DEL/BOM")
    assert r8.status_code == 200

    # 9. Source consensus endpoint
    r9 = client.get("/api/v1/intelligence/source-consensus?origin=DEL&destination=BOM")
    assert r9.status_code == 200

    # 10. Airfare weather endpoint
    r10 = client.get("/api/v1/intelligence/airfare-weather")
    assert r10.status_code == 200

    # 11. Event impact endpoint
    r11 = client.get("/api/v1/intelligence/event-impact")
    assert r11.status_code == 200

    # 12. Index Lab POST
    r12 = client.post("/api/v1/intelligence/index-lab", json={"methodology": "JEVONS", "weighting_scheme": "DGCA_TRAFFIC", "booking_horizon": "T+7"})
    assert r12.status_code == 200
