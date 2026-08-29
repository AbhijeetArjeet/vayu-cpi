"""
services/api/routes_weekly.py
Week-wise airfare macroeconomic intelligence endpoints for MoSPI & DGCA.
"""

from __future__ import annotations

from datetime import date
from typing import Optional
from fastapi import APIRouter, Query

from core.schemas import WeeklyAirfareResponse
from services.engine.weekly_engine import compute_weekly_airfare_intelligence

router = APIRouter(tags=["Weekly Airfare Intelligence"])


@router.get("/api/v1/index/weekly", response_model=WeeklyAirfareResponse)
@router.get("/api/v1/cpi/weekly", response_model=WeeklyAirfareResponse)
def get_weekly_airfare_intelligence(
    target_date: Optional[date] = Query(None, description="Reference date for week calculation (default: today)"),
    mode: str = Query("live", description="live, historical, combined"),
    num_weeks: int = Query(8, ge=4, le=52, description="Number of historical weeks in trend series"),
) -> WeeklyAirfareResponse:
    """
    Returns complete weekly airfare intelligence:
    - Weekly National Index
    - Previous week index & WoW % change
    - Corridor-level weekly status (RISING / STABLE / FALLING)
    - Carrier & booking horizon sub-indices
    - Multi-week trend series (4 to 52 weeks)
    - Data quality score (HIGH / MODERATE / LOW)
    """
    t_date = target_date if isinstance(target_date, date) else None
    return compute_weekly_airfare_intelligence(
        target_date=t_date,
        mode=mode,
        num_weeks=num_weeks,
    )
