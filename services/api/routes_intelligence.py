"""
services/api/routes_intelligence.py
FastAPI Router for VAYU-CPI Statistical Intelligence Platform.

Endpoints:
- /explainer: "Why Did Airfare Change?" Attribution & Decomposition
- /shocks: Automated 3-Sigma Anomaly & Surge Detector
- /fair-fare: "Is This Fare Normal?" Expected Fare & Percentile Engine
- /simulate: What-If CPI Scenario Simulator
- /confidence: Data Confidence Score & Quality Metrics
- /index-trace: Full Provenance Drill-Down Tree
- /fare-dna/{origin}/{destination}: Route Microstructure Profile
- /source-consensus: Multi-Portal Price Convergence & Consensus
- /airfare-weather: Regional Macro Pressure Indicators
- /event-impact: Festival & Event Comparison Analysis
- /index-lab: Econometric Research & Methodology Sandbox
"""

from __future__ import annotations

from typing import Optional, List
from fastapi import APIRouter, Query, Body, HTTPException

from core.schemas import (
    InflationExplainerResponse,
    AirfareShockItem,
    AirfareShockSummary,
    FairFareRequest,
    FairFareResponse,
    SimulationRequest,
    SimulationResponse,
    DataConfidenceReport,
    IndexTraceTree,
    FareDNAProfile,
    SourceConsensusReport,
    AirfareWeatherReport,
    EventImpactReport,
    IndexLabRequest,
    IndexLabResponse,
)

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

router = APIRouter(prefix="/api/v1/intelligence", tags=["Statistical Intelligence"])


@router.get("/explainer", response_model=InflationExplainerResponse)
def get_inflation_explainer(
    mode: str = Query("live", description="live, historical, combined"),
    period_days: int = Query(30, description="1, 7, 30, 90, 365"),
    corridor: Optional[str] = Query(None, description="Optional corridor filter e.g. DEL-BOM"),
):
    """
    Returns why the airfare price index changed, decomposing movement into route pressure,
    booking horizon spread, carrier yield, seasonality, and outlier factors.
    """
    return compute_inflation_explainer(mode=mode, period_days=period_days, corridor_filter=corridor)


@router.get("/shocks", response_model=List[AirfareShockItem])
def get_airfare_shocks(
    mode: str = Query("combined", description="live, historical, combined"),
    min_severity: str = Query("ELEVATED", description="NORMAL, ELEVATED, HIGH, SHOCK"),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Detects unusual price movements and surges exceeding statistical variance thresholds.
    """
    return detect_airfare_shocks(mode=mode, min_severity=min_severity, limit=limit)


@router.get("/shocks/summary", response_model=AirfareShockSummary)
def get_shock_summary(
    mode: str = Query("combined", description="live, historical, combined"),
):
    """
    Returns national summary of active airfare shocks and affected corridors.
    """
    return compute_shock_summary(mode=mode)


@router.post("/fair-fare", response_model=FairFareResponse)
def post_fair_fare_estimate(request: FairFareRequest):
    """
    Calculates expected/fair fare, distribution percentiles, and assessment status.
    """
    return compute_fair_fare_estimate(request)


@router.get("/fair-fare", response_model=FairFareResponse)
def get_fair_fare_estimate(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    horizon_days: int = Query(7),
    carrier: Optional[str] = Query(None),
    current_fare: Optional[float] = Query(None),
):
    """
    GET query endpoint for Fair Fare calculation.
    """
    req = FairFareRequest(
        origin=origin,
        destination=destination,
        horizon_days=horizon_days,
        carrier=carrier,
        current_fare=current_fare,
    )
    return compute_fair_fare_estimate(req)


@router.post("/simulate", response_model=SimulationResponse)
def post_cpi_simulation(request: SimulationRequest):
    """
    Simulates hypothetical macroeconomic shocks on the National CPI.
    """
    return run_what_if_cpi_simulation(request)


@router.get("/confidence", response_model=DataConfidenceReport)
def get_data_confidence(
    mode: str = Query("live", description="live, historical, combined"),
):
    """
    Returns mathematical Data Confidence Score (0-100%) and factor breakdown.
    """
    return compute_data_confidence_report(mode=mode)


@router.get("/index-trace", response_model=IndexTraceTree)
def get_index_trace(
    mode: str = Query("live", description="live, historical, combined"),
):
    """
    Returns hierarchical audit trace tree from National CPI down to raw scraped timestamps.
    """
    return build_index_trace_tree(mode=mode)


@router.get("/fare-dna/{origin}/{destination}", response_model=FareDNAProfile)
def get_fare_dna(
    origin: str,
    destination: str,
):
    """
    Returns multidimensional analytical profile (Volatility, Demand, HHI, Breakdown) for a route.
    """
    return generate_fare_dna_profile(origin, destination)


@router.get("/source-consensus", response_model=SourceConsensusReport)
def get_source_consensus(
    origin: str = Query("DEL"),
    destination: str = Query("BOM"),
    horizon_days: int = Query(7),
):
    """
    Compares multi-source price convergence and flags source disagreements.
    """
    return compute_source_consensus_report(origin, destination, horizon_days)


@router.get("/airfare-weather", response_model=AirfareWeatherReport)
def get_airfare_weather():
    """
    Returns simplified regional airfare weather indicators for public view.
    """
    return compute_airfare_weather_report()


@router.get("/event-impact", response_model=EventImpactReport)
def get_event_impact():
    """
    Returns comparative analysis of airfare indices during major Indian festivals & holidays.
    """
    return compute_event_impact_report()


@router.post("/index-lab", response_model=IndexLabResponse)
def post_index_lab_experiment(request: IndexLabRequest):
    """
    Executes customizable econometric research experiments and formula bias proofs.
    """
    return execute_index_lab_experiment(request)
