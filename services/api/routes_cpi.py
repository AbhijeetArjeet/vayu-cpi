"""
services/api/routes_cpi.py
MoSPI-facing endpoints: the national airfare CPI time series and its
route-level components, formatted for direct inflation-basket
integration and CSV export.
"""

from __future__ import annotations

import csv
import io
from datetime import date, timedelta

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from core.dgca_weights import HORIZON_ALPHA, ALL_CORRIDORS
from services.engine.index_calculator import (
    compute_national_composite_cpi,
    compute_route_jevons_index,
)

router = APIRouter(prefix="/api/v1/cpi", tags=["MoSPI Macroeconomic Engine"])


@router.post("/trigger-sweep")
async def trigger_live_sweep():
    """Triggers an immediate live Google Flights scraping sweep across all corridors."""
    try:
        from services.ingestion.live_fetcher import fetch_all_corridors
        from services.persistence.db import save_fare_records

        records = fetch_all_corridors()
        saved_count = 0
        if records:
            try:
                saved_count = save_fare_records(records)
            except Exception:
                pass
        return {
            "status": "success",
            "message": f"Successfully scraped {len(records)} live fares from Google Flights",
            "count": len(records),
            "saved_to_db": saved_count,
            "timestamp": date.today().isoformat()
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "count": 0}


@router.get("/airfare-index")
async def get_airfare_index(target_date: date | None = Query(None)):
    """Returns the national composite airfare CPI (Base 2024 = 100) for
    a single calculation date, defaulting to today."""
    result = compute_national_composite_cpi(target_date)
    return result.model_dump(mode="json")


@router.get("/airfare-index/series")
async def get_airfare_index_series(days_back: int = Query(30, ge=1, le=365)):
    """Returns the composite CPI as a daily time series for the last
    `days_back` days -- what the MoSPI dashboard's line chart consumes.
    """
    today = date.today()
    series = []
    for offset in range(days_back, -1, -1):
        d = today - timedelta(days=offset)
        result = compute_national_composite_cpi(d)
        series.append(result.model_dump(mode="json"))
    return series


@router.get("/route-index")
async def get_route_index(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    horizon_days: int = Query(..., description="30, 7, or 1"),
    target_date: date | None = Query(None),
):
    """Returns the Jevons micro-index for a single route/horizon pair."""
    result = compute_route_jevons_index(
        origin.upper(), destination.upper(), horizon_days, target_date
    )
    if result is None:
        return {
            "error": "no_data",
            "message": (
                f"No computable index yet for {origin.upper()}-"
                f"{destination.upper()} T-{horizon_days} -- base-period "
                "or current-period sample is empty."
            ),
        }
    return result.model_dump(mode="json")


@router.get("/routes/all-current")
async def get_all_routes_current(target_date: date | None = Query(None)):
    """Returns every tracked route x horizon micro-index for one date."""
    results = []
    for origin, destination in ALL_CORRIDORS:
        for horizon in HORIZON_ALPHA.keys():
            idx = compute_route_jevons_index(origin, destination, horizon, target_date)
            if idx is not None:
                results.append(idx.model_dump(mode="json"))
    return {"count": len(results), "routes": results}


@router.get("/export/csv")
async def export_csv(days_back: int = Query(30, ge=1, le=365)):
    """Streams a MoSPI-compatible CSV dump of the composite index time series."""
    today = date.today()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "calculation_date",
            "composite_index",
            "advance_sub_index",
            "spot_sub_index",
            "tracked_corridors",
            "dgca_traffic_coverage_pct",
        ]
    )
    for offset in range(days_back, -1, -1):
        d = today - timedelta(days=offset)
        result = compute_national_composite_cpi(d)
        writer.writerow(
            [
                result.calculation_date,
                result.composite_index,
                result.advance_sub_index,
                result.spot_sub_index,
                result.tracked_corridors,
                result.dgca_traffic_coverage_pct,
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vayu_cpi_export.csv"},
    )
