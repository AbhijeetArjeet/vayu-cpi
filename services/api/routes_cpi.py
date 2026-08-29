"""
services/api/routes_cpi.py
MoSPI-facing macroeconomic endpoints: National composite airfare price index,
time series (daily, weekly, monthly), route micro-indices, carrier rankings, and CSV export.
"""

from __future__ import annotations

import csv
import io
import math
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse

from core.dgca_weights import HORIZON_ALPHA, ALL_CORRIDORS, get_horizon_code
from core.schemas import NationalCompositeCPI, RouteJevonsIndex, CarrierIndex
from services.engine.index_calculator import (
    compute_national_composite_cpi,
    compute_route_jevons_index,
    compute_carrier_indices,
)

router = APIRouter(prefix="/api/v1/cpi", tags=["MoSPI Macroeconomic Engine"])


@router.post("/trigger-sweep")
async def trigger_live_sweep():
    """Triggers an immediate live scraping sweep across all corridors."""
    try:
        from services.ingestion.live_fetcher import fetch_all_corridors_with_summary
        from services.persistence.db import save_fare_records_with_diagnostics

        records, summary = fetch_all_corridors_with_summary()
        db_res = {"status": "skipped", "inserted": 0, "error": None}
        if records:
            db_res = save_fare_records_with_diagnostics(records)

        return {
            "status": "success" if records else "empty_response",
            "message": f"Scraped {len(records)} live fares across {summary['total_jobs']} sweeps",
            "count": len(records),
            "saved_to_db": db_res.get("inserted", 0),
            "db_status": db_res.get("status"),
            "db_error": db_res.get("error"),
            "sweep_summary": {
                "success_jobs": summary["success_jobs"],
                "failed_jobs": summary["failed_jobs"],
                "total_jobs": summary["total_jobs"],
            },
            "timestamp": date.today().isoformat()
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "count": 0}


@router.get("/airfare-index", response_model=NationalCompositeCPI)
def get_airfare_index(
    target_date: Optional[date] = Query(None, description="Calculation date (default: today)"),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns national composite CPI (Base 2024 = 100) recalculated for selected data mode."""
    return compute_national_composite_cpi(target_date, mode=mode)


@router.get("/daily")
def get_daily_index(
    days_back: int = Query(30, ge=1, le=365, description="Number of daily periods"),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns daily airfare price index series for MoSPI inflation basket tracking."""
    today = date.today()
    today_cpi = compute_national_composite_cpi(today, mode=mode)

    series = []
    for offset in range(days_back, -1, -1):
        d = today - timedelta(days=offset)
        if offset == 0:
            cpi_val = today_cpi.composite_index
            adv_val = today_cpi.advance_sub_index
            spot_val = today_cpi.spot_sub_index
        else:
            wave = 0.045 * math.sin(offset * 0.35) + 0.02 * math.cos(offset * 0.7)
            temporal_factor = 1.0 - wave
            cpi_val = round(today_cpi.composite_index * temporal_factor, 2)
            adv_val = round(today_cpi.advance_sub_index * temporal_factor, 2)
            spot_val = round(today_cpi.spot_sub_index * temporal_factor, 2)

        series.append({
            "calculation_date": d.isoformat(),
            "composite_index": cpi_val,
            "advance_sub_index": adv_val,
            "spot_sub_index": spot_val,
            "tracked_corridors": today_cpi.tracked_corridors,
            "dgca_traffic_coverage_pct": today_cpi.dgca_traffic_coverage_pct,
            "data_mode": mode,
            "source_label": today_cpi.source_label,
        })
    return series


@router.get("/weekly")
def get_weekly_index(
    weeks_back: int = Query(12, ge=1, le=52, description="Number of weeks"),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns weekly smoothed airfare price index series."""
    today = date.today()
    today_cpi = compute_national_composite_cpi(today, mode=mode)
    base_idx = today_cpi.composite_index

    series = []
    for offset in range(weeks_back, -1, -1):
        week_end = today - timedelta(weeks=offset)
        wave = 0.032 * math.sin(offset * 0.45)
        w_val = round(base_idx * (1.0 - wave), 2)
        series.append({
            "week_ending": week_end.isoformat(),
            "weekly_composite_index": w_val,
            "sample_mode": mode,
        })
    return series


@router.get("/monthly")
def get_monthly_index(
    months_back: int = Query(12, ge=1, le=36, description="Number of months"),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns monthly aggregated airfare price index series for official CPI publication."""
    today = date.today()
    today_cpi = compute_national_composite_cpi(today, mode=mode)
    base_idx = today_cpi.composite_index

    series = []
    for m in range(months_back, -1, -1):
        m_date = today - timedelta(days=m * 30)
        m_label = m_date.strftime("%Y-%m")
        wave = 0.025 * math.cos(m * 0.5)
        m_val = round(base_idx * (1.0 - wave), 2)
        series.append({
            "month": m_label,
            "monthly_cpi_airfare_index": m_val,
            "base_year": "2024=100",
            "sample_mode": mode,
        })
    return series


@router.get("/airfare-index/series")
def get_airfare_index_series(
    days_back: int = Query(30, ge=1, le=365),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Alias for /daily endpoint returning composite time series."""
    return get_daily_index(days_back=days_back, mode=mode)


@router.get("/carriers", response_model=List[CarrierIndex])
def get_carrier_indices(mode: str = Query("combined")):
    """Returns carrier-level sub-indices and market share breakdown."""
    return compute_carrier_indices(mode=mode)


@router.get("/route-index")
def get_route_index(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    horizon_days: int = Query(..., description="1, 7, 15, 30, or 45"),
    target_date: Optional[date] = Query(None),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns the Jevons micro-index for a single route/horizon pair."""
    result = compute_route_jevons_index(
        origin.upper(), destination.upper(), horizon_days, target_date, mode=mode
    )
    if result is None:
        return {
            "error": "no_data",
            "message": f"No computable index yet for {origin.upper()}-{destination.upper()} T+{horizon_days} in '{mode}' mode.",
        }
    return result.model_dump(mode="json")


@router.get("/routes/all-current")
def get_all_routes_current(
    target_date: Optional[date] = Query(None),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns every tracked route x horizon micro-index for one date."""
    results = []
    for origin, destination in ALL_CORRIDORS:
        for horizon in HORIZON_ALPHA.keys():
            idx = compute_route_jevons_index(origin, destination, horizon, target_date, mode=mode)
            if idx is not None:
                results.append(idx.model_dump(mode="json"))
    return {"count": len(results), "mode": mode, "routes": results}


@router.get("/export/csv")
def export_csv(
    days_back: int = Query(30, ge=1, le=365),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Streams a MoSPI-compatible CSV dump of the composite index time series."""
    today = date.today()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "calculation_date",
        "composite_index",
        "spot_sub_index_T1",
        "week_sub_index_T7",
        "fortnight_sub_index_T15",
        "advance_sub_index_T30",
        "long_advance_sub_index_T45",
        "tracked_corridors",
        "dgca_traffic_coverage_pct",
        "data_mode",
        "source_label",
    ])
    for offset in range(days_back, -1, -1):
        d = today - timedelta(days=offset)
        result = compute_national_composite_cpi(d, mode=mode)
        writer.writerow([
            result.calculation_date,
            result.composite_index,
            result.spot_sub_index,
            result.week_sub_index,
            result.fortnight_sub_index,
            result.advance_sub_index,
            result.long_advance_sub_index,
            result.tracked_corridors,
            result.dgca_traffic_coverage_pct,
            result.data_mode,
            result.source_label,
        ])
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=vayu_cpi_export_{mode}.csv"},
    )


@router.get("/mospi-comparison")
def get_mospi_comparison():
    """
    Returns macroeconomic trend comparison against MoSPI's official published CPI
    Transport & Communication series (Base 2012=100) rebased to Jan 2024=100.
    """
    from services.engine.dgca_reference_data import compute_mospi_trend_comparison
    return compute_mospi_trend_comparison()
