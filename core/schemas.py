from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RawFareRecord(BaseModel):
    """Shared schema: Emitted by Track 1, ingested and stored by Track 2."""

    portal: str = Field(default="Google Flights Live Feed")
    carrier_name: str = Field(default="IndiGo", example="IndiGo")
    carrier_code: str = Field(..., example="6E")
    flight_number: str = Field(..., example="6E-205")
    origin: str = Field(..., min_length=3, max_length=3, example="DEL")
    destination: str = Field(..., min_length=3, max_length=3, example="BOM")
    departure_time: str = Field(..., example="2026-09-02 08:30")
    scraped_at: str = Field(..., example="2026-08-26T22:30:00")
    horizon_days: int = Field(..., example=7)  # 30 (Advance), 7 (Mid), 1 (Tatkal)
    base_fare: float
    fuel_surcharge_yq: float = 0.0
    airport_fee_udf: float = 0.0
    convenience_fee: float = 0.0
    total_fare: float


class RouteJevonsIndex(BaseModel):
    """Route-level geometric mean micro-index computed by Track 2."""

    origin: str
    destination: str
    horizon_days: int
    current_geom_mean: float
    base_geom_mean: float
    jevons_index: float  # (current / base) * 100
    sample_size: int


class NationalCompositeCPI(BaseModel):
    """Payload served to Track 3 (MoSPI Macro View)."""

    calculation_date: str
    composite_index: float  # Base 2024 = 100
    advance_sub_index: float  # T-30
    spot_sub_index: float  # T-1
    tracked_corridors: int
    dgca_traffic_coverage_pct: float


class SurgeAlert(BaseModel):
    """Payload served to Track 3 (DGCA Governance Portal)."""

    corridor: str
    origin: str
    destination: str
    current_fare: float
    baseline_30d_fare: float
    sigma_deviation: float
    severity: str  # CRITICAL, HIGH, MODERATE
    carrier_dominance: str
    flagged_at: str
