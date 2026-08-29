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
    period_days: int = 30


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

    # Analysis window & provenance metadata
    period_days: int = 30
    observation_window_start: Optional[str] = None
    observation_window_end: Optional[str] = None
    status: str = "SUCCESS"  # SUCCESS, INSUFFICIENT_DATA
    minimum_required: Optional[int] = 1


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


# ============================================================================
# STATISTICAL INTELLIGENCE PLATFORM SCHEMAS
# ============================================================================

class AttributionFactor(BaseModel):
    factor_name: str
    category: str  # ROUTE_WEIGHT, HORIZON_SPREAD, CARRIER_YIELD, SEASONALITY, ABNORMAL_OUTLIER
    contribution_pct: float
    magnitude_pts: float
    description: str
    is_estimated: bool = True


class CorridorAttribution(BaseModel):
    corridor: str
    origin: str
    destination: str
    dgca_weight: float
    route_cpi: float
    contribution_to_national_pct: float
    primary_driver: str


class InflationExplainerResponse(BaseModel):
    headline_cpi: float
    previous_cpi: float
    change_pct: float
    period_label: str
    calculation_date: str
    primary_drivers: List[AttributionFactor]
    corridor_contributions: List[CorridorAttribution]
    methodology_notes: str
    status: str = "SUCCESS"


class AirfareShockItem(BaseModel):
    id: str
    corridor: str
    origin: str
    destination: str
    horizon_days: int
    booking_window: str
    carrier: str
    current_fare: float
    expected_range_low: float
    expected_range_high: float
    baseline_mean: float
    baseline_std: float
    z_score: float
    deviation_pct: float
    severity: str  # NORMAL, ELEVATED, HIGH, SHOCK
    confidence_pct: float
    detected_at: str
    duration_hours: int = 6
    summary: str


class AirfareShockSummary(BaseModel):
    total_active_shocks: int
    critical_shocks_count: int
    high_shocks_count: int
    elevated_count: int
    affected_corridors_count: int
    most_volatile_corridor: str
    shocks: List[AirfareShockItem]


class FairFareDistribution(BaseModel):
    p10: float
    p25: float
    median: float
    p75: float
    p90: float


class FairFareRequest(BaseModel):
    origin: str
    destination: str
    horizon_days: int = 7
    carrier: Optional[str] = None
    current_fare: Optional[float] = None
    departure_date: Optional[str] = None


class FairFareResponse(BaseModel):
    origin: str
    destination: str
    corridor: str
    horizon_days: int
    booking_window: str
    carrier_filter: Optional[str] = None
    current_fare: Optional[float] = None
    expected_fare: float
    expected_range_low: float
    expected_range_high: float
    difference_pct: Optional[float] = None
    percentile_rank: Optional[float] = None
    fare_status: str  # UNUSUALLY_CHEAP, FAIR_NORMAL, ELEVATED, UNUSUALLY_EXPENSIVE, INSUFFICIENT_DATA
    confidence_pct: float
    distribution: FairFareDistribution
    observations_analyzed: int
    assessment_notes: str


class SimulationRequest(BaseModel):
    demand_shock_pct: float = 0.0      # -50% to +50%
    capacity_shock_pct: float = 0.0    # -50% to +50%
    fuel_surcharge_shock_pct: float = 0.0 # -50% to +100%
    seasonality_multiplier: float = 1.0 # 0.8 to 1.5
    custom_corridor_weights: Optional[Dict[str, float]] = None


class SimulationCorridorImpact(BaseModel):
    corridor: str
    baseline_index: float
    simulated_index: float
    difference_pct: float
    key_transmission_channel: str


class SimulationResponse(BaseModel):
    is_simulation: bool = True
    baseline_national_cpi: float
    simulated_national_cpi: float
    absolute_change_pts: float
    percentage_change_pct: float
    macro_interpretation: str
    demand_elasticity_assumed: float = 0.65
    capacity_elasticity_assumed: float = 0.85
    regional_impacts: Dict[str, float]
    corridor_impacts: List[SimulationCorridorImpact]
    disclaimer: str = "Hypothetical economic scenario simulation. Not an official government forecast."


class DataConfidenceFactor(BaseModel):
    factor_name: str
    weight: float
    score: float  # 0 to 100
    metric_value: str
    status: str   # EXCELLENT, GOOD, MODERATE, ATTENTION


class DataConfidenceReport(BaseModel):
    overall_confidence_score: float  # 0 to 100
    confidence_tier: str            # HIGH_CONFIDENCE, MODERATE_CONFIDENCE, LOW_OBSERVATION
    total_observations_analyzed: int
    active_sources_count: int
    route_coverage_pct: float
    factors: List[DataConfidenceFactor]
    transparency_notes: str


class IndexTraceNode(BaseModel):
    id: str
    level: str  # NATIONAL, REGIONAL, CORRIDOR, CARRIER, OBSERVATION
    label: str
    value: float
    weight_or_share: Optional[float] = None
    sub_text: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    children: Optional[List['IndexTraceNode']] = None


class IndexTraceTree(BaseModel):
    root: IndexTraceNode
    generated_at: str
    total_traced_observations: int


class FareDNAProfile(BaseModel):
    corridor: str
    origin: str
    destination: str
    volatility_score: float      # 1.0 to 10.0
    demand_pressure_score: float # 1.0 to 10.0
    price_anomaly_level: str     # LOW, MODERATE, HIGH, CRITICAL
    booking_sensitivity: str     # HIGH, MODERATE, INELASTIC
    source_agreement_pct: float  # 0 to 100
    median_fare: float
    fare_range: str
    hhi_carrier_concentration: float
    dominant_carrier: str
    fare_breakdown_percentages: Dict[str, float]  # Base, UDF, Fuel, Taxes


class SourcePriceItem(BaseModel):
    source_name: str
    portal: str
    observed_fare: float
    is_direct: bool
    status: str  # RETAINED, DOWNWEIGHTED, EXCLUDED


class SourceConsensusReport(BaseModel):
    corridor: str
    booking_window: str
    market_consensus_fare: float
    agreement_score_pct: float
    has_disagreement: bool
    source_prices: List[SourcePriceItem]
    methodology_applied: str


class RegionalWeatherItem(BaseModel):
    region_code: str
    region_name: str
    pressure_level: str  # NORMAL, ELEVATED, HIGH, SHOCK
    weather_icon: str    # SUNNY, PARTLY_CLOUDY, RAINY, THUNDERSTORM
    average_route_cpi: float
    primary_hub: str
    corridors_monitored: int
    active_shocks_count: int


class AirfareWeatherReport(BaseModel):
    national_weather_summary: str
    national_pressure_level: str
    weather_timestamp: str
    regions: List[RegionalWeatherItem]


class EventComparisonItem(BaseModel):
    event_name: str
    event_category: str  # FESTIVAL, HOLIDAY, ELECTION, DISASTER
    dates: str
    baseline_index: float
    event_observed_index: float
    movement_pct: float
    observation_context: str


class EventImpactReport(BaseModel):
    summary: str
    comparisons: List[EventComparisonItem]
    statistical_disclaimer: str = "Comparisons represent observed index differences during event periods, not verified causal claims."


class IndexLabRequest(BaseModel):
    methodology: str = "JEVONS"  # JEVONS, CARLI_DUTOT_ARITHMETIC
    weighting_scheme: str = "DGCA_TRAFFIC"  # DGCA_TRAFFIC, EQUAL_WEIGHT, CUSTOM
    booking_horizon: str = "ALL_BLENDED"    # T+1, T+7, T+15, T+30, T+45, ALL_BLENDED
    custom_weights: Optional[Dict[str, float]] = None


class IndexLabResponse(BaseModel):
    computed_index: float
    methodology_used: str
    weighting_used: str
    horizon_used: str
    upward_bias_demonstration_pct: Optional[float] = None
    observation_count: int
    traffic_coverage_pct: float
    confidence_score: float
    formula_latex: str
    econometric_notes: str

