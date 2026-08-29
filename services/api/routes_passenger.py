"""
services/api/routes_passenger.py
Passenger intelligence endpoints for calendar fare heatmap, 0-100 fare score, and booking recommendations.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Query, Body
from pydantic import BaseModel

from core.schemas import (
    FareCalendarResponse,
    FareScoreResponse,
    BookingRecommendationResponse,
)
from services.engine.passenger_engine import (
    generate_fare_calendar,
    calculate_passenger_fare_score,
    generate_booking_recommendation,
)

router = APIRouter(prefix="/api/v1/passenger", tags=["Passenger Intelligence & Fare Calendar"])


class FareScoreRequest(BaseModel):
    origin: str
    destination: str
    current_fare: float
    horizon_days: int = 7


class BookingRecRequest(BaseModel):
    origin: str
    destination: str
    departure_date: str
    current_fare: float
    horizon_days: int = 7


@router.get("/calendar", response_model=FareCalendarResponse)
def get_fare_calendar(
    origin: str = Query("DEL", min_length=3, max_length=3, description="Origin IATA code e.g. DEL"),
    destination: str = Query("BOM", min_length=3, max_length=3, description="Destination IATA code e.g. BOM"),
    year: Optional[int] = Query(None, description="Year (e.g. 2026)"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12)"),
    preferred_carrier: Optional[str] = Query(None, description="Optional carrier filter e.g. IndiGo"),
    cabin_class: str = Query("Economy", description="Economy, Business"),
) -> FareCalendarResponse:
    """
    Returns full month calendar fare heatmap with LOW/NORMAL/HIGH classification and best days to fly.
    """
    return generate_fare_calendar(
        origin=origin,
        destination=destination,
        year=year,
        month=month,
        preferred_carrier=preferred_carrier,
        cabin_class=cabin_class,
    )


@router.post("/fare-score", response_model=FareScoreResponse)
def get_passenger_fare_score(payload: FareScoreRequest) -> FareScoreResponse:
    """
    Computes a 0-100 calibrated Fare Score with verbal rating and percentile.
    """
    return calculate_passenger_fare_score(
        origin=payload.origin,
        destination=payload.destination,
        current_fare=payload.current_fare,
        horizon_days=payload.horizon_days,
    )


@router.post("/recommendation", response_model=BookingRecommendationResponse)
def get_booking_recommendation(payload: BookingRecRequest) -> BookingRecommendationResponse:
    """
    Returns 'Should I Book Now?' decision (BOOK NOW, WAIT & WATCH, CONSIDER ALTERNATIVE DATE) with ML factor explainability.
    """
    return generate_booking_recommendation(
        origin=payload.origin,
        destination=payload.destination,
        departure_date=payload.departure_date,
        current_fare=payload.current_fare,
        horizon_days=payload.horizon_days,
    )
