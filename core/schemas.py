from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RawFareRecord(BaseModel):
    """
    Standard Raw Fare Record matching MoSPI / SIH requirements.
    Preserves observed market prices with nullable fee components when not explicitly exposed.
    """
    portal: str = Field(default="Google Flights")
    source: str = Field(default="Google Flights Live Feed")
    source_url: Optional[str] = None
    
    carrier: str = Field(default="IndiGo")
    carrier_name: Optional[str] = None
    carrier_code: str = Field(default="6E")
    flight_number: str = Field(..., description="e.g. 6E-205")
    
    origin: str = Field(..., min_length=3, max_length=3, description="IATA code e.g. DEL")
    destination: str = Field(..., min_length=3, max_length=3, description="IATA code e.g. BOM")
    departure_time: str = Field(..., description="e.g. 2026-09-02 08:30:00")
    departure_date: Optional[str] = None
    scraped_at: str = Field(..., description="ISO collection timestamp")
    collection_timestamp: Optional[str] = None
    
    horizon_days: int = Field(..., description="1, 7, 15, 30, or 45")
    booking_window: str = Field(default="T+7", description="T+1, T+7, T+15, T+30, T+45")
    fare_class: str = Field(default="Economy", description="Economy, Premium Economy, Business")
    
    base_fare: Optional[float] = None
    taxes: Optional[float] = None
    fuel_surcharge_yq: Optional[float] = 0.0
    udf: Optional[float] = None
    airport_fee_udf: Optional[float] = 0.0
    convenience_fee: Optional[float] = None
    total_fare: float = Field(..., description="Observed all-inclusive passenger tariff")
    currency: str = Field(default="INR")
    
    availability_status: str = Field(default="AVAILABLE", description="AVAILABLE, SOLD_OUT, CANCELLED")
    is_modeled: bool = Field(default=False, description="True if fee breakdown is estimated/unbundled")
    is_ota_direct: bool = Field(default=True, description="True only when fare was directly scraped from OTA website; False when OTA adapter fell back to Google Flights")

    # Provenance and Dataset Registry fields
    source_type: str = "LIVE_FLIGHT"  # LIVE_FLIGHT, HISTORICAL_DATASET, DGCA_REFERENCE, EXTERNAL_API
    source_name: str = "Google Flights Production Pipeline"
    dataset_version: str = "1.0.0"
    is_live: bool = True
    is_historical: bool = False
    ingestion_timestamp: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.carrier_name:
            self.carrier_name = self.carrier
        if not self.carrier:
            self.carrier = self.carrier_name or "Unknown Airline"
        if not self.collection_timestamp:
            self.collection_timestamp = self.scraped_at
        if not self.departure_date and self.departure_time:
            self.departure_date = self.departure_time[:10]
        if not self.booking_window:
            self.booking_window = f"T+{self.horizon_days}"
        if self.udf is not None and (self.airport_fee_udf == 0.0 or self.airport_fee_udf is None):
            self.airport_fee_udf = self.udf
        elif self.airport_fee_udf is not None and self.udf is None:
            self.udf = self.airport_fee_udf


class RouteJevonsIndex(BaseModel):
    """Route-level geometric mean micro-index (Jevons elementary aggregate)."""
    origin: str
    destination: str
    horizon_days: int
    booking_window: str = "T+7"
    current_geom_mean: float
    base_geom_mean: float
    jevons_index: float  # (current / base) * 100
    sample_size: int
    data_mode: str = "live"  # live, historical, combined


class CarrierIndex(BaseModel):
    """Carrier-level airfare price sub-index."""
    carrier: str
    carrier_code: str
    sample_size: int
    current_geom_mean: float
    base_geom_mean: float
    carrier_index: float
    market_share_pct: float


class NationalCompositeCPI(BaseModel):
    """Payload served to MoSPI Macroeconomic View."""
    calculation_date: str
    composite_index: float  # Base 2024 = 100
    daily_change_pct: Optional[float] = 0.0
    weekly_change_pct: Optional[float] = 0.0
    monthly_change_pct: Optional[float] = 0.0
    
    # Sub-indices by booking horizon
    spot_sub_index: float = 100.0        # T+1
    week_sub_index: float = 100.0        # T+7
    fortnight_sub_index: float = 100.0   # T+15
    advance_sub_index: float = 100.0     # T+30
    long_advance_sub_index: float = 100.0 # T+45
    
    tracked_corridors: int
    total_observations: int = 0
    dgca_traffic_coverage_pct: float
    data_mode: str = "live"  # live, historical, combined
    source_label: str = "LIVE OBSERVATIONS"


class BacktestMetric(BaseModel):
    """Econometric error and validation metrics for 30-day backtesting."""
    period_start: str
    period_end: str
    observation_days: int
    mae: float                # Mean Absolute Error
    rmse: float               # Root Mean Squared Error
    mape: float               # Mean Absolute Percentage Error (%)
    pearson_correlation: float # Pearson r (-1 to +1)
    reference_dataset: str
    model_name: str = "VAYU-CPI Laspeyres-Jevons Hybrid"
    is_simulation: bool = False
    validation_status: str = "PASSED"


class BacktestDailyComparison(BaseModel):
    date: str
    vayu_index: float
    reference_index: float
    absolute_error: float
    percentage_error: float


class BacktestResult(BaseModel):
    metrics: BacktestMetric
    series: List[BacktestDailyComparison]
    methodology_notes: str


class SurgeAlert(BaseModel):
    """Payload served to DGCA Governance Portal."""
    corridor: str
    origin: str
    destination: str
    current_fare: float
    baseline_30d_fare: float
    sigma_deviation: float
    severity: str  # CRITICAL, HIGH, MODERATE
    carrier_dominance: str
    flagged_at: str


class DatasetMetadata(BaseModel):
    id: str
    source_type: str
    source_name: str
    dataset_version: str
    description: str
    imported_at: str
    row_count: int
    date_range_start: str
    date_range_end: str
    routes_count: int
    airlines_count: int
    status: str = "ACTIVE"


class ImportValidationReport(BaseModel):
    dataset_name: str
    source_type: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    date_range: str
    unique_routes: int
    unique_airlines: int
    missing_fare_pct: float
    duplicate_pct: float
    invalid_route_pct: float
    currency: str
    errors: List[str]
    status: str  # PASSED, WARNING, FAILED


class MarketCoverageSummary(BaseModel):
    total_indian_airports: int
    airports_with_data: int
    total_configured_routes: int
    observed_routes: int
    live_routes_count: int
    historical_routes_count: int
    live_observation_count: int
    historical_observation_count: int
    coverage_percentage: float


class HistoricalComparison(BaseModel):
    corridor: str
    origin: str
    destination: str
    current_fare: float
    historical_median_fare: float
    difference_pct: float
    stress_level: str
    historical_percentile: Optional[float] = None
    observation_count: int
    sample_sufficient: bool = True
