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

from core.dgca_weights import TRACKED_HORIZONS, TRACKED_ROUTES
from services.engine.index_calculator import (
    compute_national_composite_cpi,
    compute_route_jevons_index,
)

router = APIRouter(prefix="/api/v1/cpi", tags=["MoSPI Macroeconomic Engine"])


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

    Note: days before the pipeline has actually collected data will
    return the neutral 100.0 placeholder (see index_calculator's
    no-data fallback) rather than being omitted, so the frontend gets a
    continuous series to plot without needing to handle gaps itself.
    """
    today = date.today()
    series = []
    for offset in range(days_back, -1, -1):
        d = today - timedelta(days=offset)
        result = compute_national_composite_cpi(d)
        series.append(result.model_dump(mode="json"))
    return {"days": len(series), "series": series}


@router.get("/route-index")
async def get_route_index(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    horizon_days: int = Query(..., description="30, 7, or 1"),
    target_date: date | None = Query(None),
):
    """Returns the Jevons micro-index for a single route/horizon pair --
    used by the horizon comparison selector (T-30 vs T-1) on the
    frontend."""
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
    """Returns every tracked route x horizon micro-index for one date --
    the raw grid behind the MoSPI dashboard's corridor breakdown."""
    results = []
    for route in TRACKED_ROUTES:
        origin, destination = route.split("-")
        for horizon in TRACKED_HORIZONS:
            idx = compute_route_jevons_index(origin, destination, horizon, target_date)
            if idx is not None:
                results.append(idx.model_dump(mode="json"))
    return {"count": len(results), "routes": results}


@router.get("/export/csv")
async def export_csv(days_back: int = Query(30, ge=1, le=365)):
    """Streams a MoSPI-compatible CSV dump of the composite index time
    series -- the "one-click official CSV exporter" from the spec."""
    today = date.today()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "calculation_date",
            "composite_index",
            "advance_sub_index",
            "spot_sub_index",
            "routes_tracked",
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
                result.routes_tracked,
                result.dgca_traffic_coverage_pct,
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vayu_cpi_export.csv"},
    )
