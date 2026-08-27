"""
services/api/routes_data.py
Endpoints for dataset registry, full India market coverage summary, and historical distribution analytics.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import func

from core.schemas import MarketCoverageSummary, DatasetMetadata, HistoricalComparison
from core.dgca_weights import INDIAN_AIRPORTS, ALL_CORRIDORS
from services.persistence.db import SessionLocal, FareObservation, DatasetRegistry
from services.engine.historical_engine import get_historical_analytics, compute_historical_comparison

router = APIRouter(prefix="/api/v1", tags=["VAYU Dataset Registry & Market Coverage"])


@router.get("/coverage", response_model=MarketCoverageSummary)
async def get_market_coverage():
    """Returns dynamic full India aviation coverage metrics across live and historical datasets."""
    session = SessionLocal()
    try:
        # Live and historical observation counts
        live_obs_cnt = session.query(func.count(FareObservation.id)).filter(FareObservation.is_live == True).scalar() or 0
        hist_obs_cnt = session.query(func.count(FareObservation.id)).filter(FareObservation.is_historical == True).scalar() or 0

        # Unique airports with data
        live_origins = session.query(FareObservation.origin).distinct().all()
        live_dests = session.query(FareObservation.destination).distinct().all()
        airports_with_data = set(r[0] for r in live_origins + live_dests if r[0] in INDIAN_AIRPORTS)

        # Unique observed routes
        live_routes = session.query(FareObservation.origin, FareObservation.destination).filter(FareObservation.is_live == True).distinct().all()
        hist_routes = session.query(FareObservation.origin, FareObservation.destination).filter(FareObservation.is_historical == True).distinct().all()

        live_routes_set = set(f"{r[0]}-{r[1]}" for r in live_routes)
        hist_routes_set = set(f"{r[0]}-{r[1]}" for r in hist_routes)
        all_observed_set = live_routes_set.union(hist_routes_set)

        total_indian_airports = len(INDIAN_AIRPORTS)
        total_configured_routes = len(ALL_CORRIDORS)

        coverage_pct = round((len(all_observed_set) / max(1, total_configured_routes)) * 100, 1)

        return MarketCoverageSummary(
            total_indian_airports=total_indian_airports,
            airports_with_data=len(airports_with_data),
            total_configured_routes=total_configured_routes,
            observed_routes=len(all_observed_set),
            live_routes_count=len(live_routes_set),
            historical_routes_count=len(hist_routes_set),
            live_observation_count=live_obs_cnt,
            historical_observation_count=hist_obs_cnt,
            coverage_percentage=coverage_pct,
        )
    finally:
        session.close()


@router.get("/data/datasets", response_model=List[DatasetMetadata])
async def list_datasets():
    """Lists all registered datasets (Live feeds, historical datasets, DGCA benchmarks)."""
    session = SessionLocal()
    try:
        datasets = session.query(DatasetRegistry).all()
        result_list = [
            DatasetMetadata(
                id=d.id,
                source_type=d.source_type,
                source_name=d.source_name,
                dataset_version=d.dataset_version,
                description=d.description,
                imported_at=d.imported_at,
                row_count=d.row_count,
                date_range_start=d.date_range_start,
                date_range_end=d.date_range_end,
                routes_count=d.routes_count,
                airlines_count=d.airlines_count,
                status=d.status,
            )
            for d in datasets
        ]

        # If no explicit registry entries, check if live observations exist in the database
        if not result_list:
            live_count = session.query(func.count(FareObservation.id)).filter(FareObservation.is_live == True).scalar() or 0
            if live_count > 0:
                live_routes = session.query(FareObservation.origin, FareObservation.destination).filter(FareObservation.is_live == True).distinct().count()
                live_airlines = session.query(FareObservation.carrier_code).filter(FareObservation.is_live == True).distinct().count()
                min_date = session.query(func.min(FareObservation.scraped_at)).filter(FareObservation.is_live == True).scalar()
                max_date = session.query(func.max(FareObservation.scraped_at)).filter(FareObservation.is_live == True).scalar()

                result_list.append(
                    DatasetMetadata(
                        id="ds_live_vayu",
                        source_type="LIVE_FLIGHT",
                        source_name="VAYU Production Google Flights Ingestion Pipeline",
                        dataset_version="1.0.0",
                        description="Real-time multi-horizon live flight price observations.",
                        imported_at="Continuous",
                        row_count=live_count,
                        date_range_start=str(min_date)[:10] if min_date else "2026-08-01",
                        date_range_end=str(max_date)[:10] if max_date else "2026-08-27",
                        routes_count=live_routes,
                        airlines_count=live_airlines,
                        status="ACTIVE",
                    )
                )

        return result_list
    finally:
        session.close()



@router.get("/historical/analytics")
async def historical_analytics(
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    days_back: int = Query(365),
):
    """Returns fare distributions, percentiles (p25, median, p75, p90), route & airline rankings."""
    return get_historical_analytics(origin, destination, days_back)


@router.get("/historical/comparison", response_model=HistoricalComparison)
async def route_historical_comparison(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    current_fare: float = Query(...),
):
    """Returns current market fare vs historical baseline median & percentile rank."""
    return compute_historical_comparison(origin, destination, current_fare)
