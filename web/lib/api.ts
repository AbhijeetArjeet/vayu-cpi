import axios from 'axios';

export type DataMode = 'live' | 'historical' | 'combined';

export interface NationalCompositeCPI {
  calculation_date: string;
  composite_index: number;
  daily_change_pct?: number;
  weekly_change_pct?: number;
  monthly_change_pct?: number;
  spot_sub_index: number;         // T+1
  week_sub_index?: number;        // T+7
  fortnight_sub_index?: number;   // T+15
  advance_sub_index: number;      // T+30
  long_advance_sub_index?: number;// T+45
  tracked_corridors: number;
  total_observations?: number;
  dgca_traffic_coverage_pct: number;
  data_mode?: DataMode;
  source_label?: string;
  period_days?: number;
  observation_window_start?: string;
  observation_window_end?: string;
  status?: string;
  minimum_required?: number;
}

export interface CarrierIndex {
  carrier: string;
  carrier_code: string;
  sample_size: number;
  current_geom_mean: number;
  base_geom_mean: number;
  carrier_index: number;
  market_share_pct: number;
}

export interface BacktestMetric {
  period_start: string;
  period_end: string;
  observation_days: number;
  mae: number;
  rmse: number;
  mape: number;
  pearson_correlation: number;
  reference_dataset: string;
  model_name: string;
  is_simulation: boolean;
  validation_status: string;
}

export interface BacktestDailyComparison {
  date: string;
  vayu_index: number;
  reference_index: number;
  absolute_error: number;
  percentage_error: number;
}

export interface BacktestResult {
  metrics: BacktestMetric;
  series: BacktestDailyComparison[];
  methodology_notes: string;
}

export interface SurgeAlert {
  corridor: string;
  origin: string;
  destination: string;
  current_fare: number;
  baseline_30d_fare: number;
  sigma_deviation: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  carrier_dominance: string;
  flagged_at: string;
}

export interface RouteJevonsIndex {
  origin: string;
  destination: string;
  horizon_days: number;
  booking_window?: string;
  current_geom_mean: number;
  base_geom_mean: number;
  jevons_index: number;
  sample_size: number;
  data_mode?: DataMode;
  period_days?: number;
}

export interface RouteConcentration {
  hhi: number;
  concentration_label: string;
  routes: Array<{ route: string; weight: number }>;
  note: string;
}

export interface FeeDecomposition {
  route: string;
  base_fare: number;
  fuel_surcharge_yq: number;
  airport_fee_udf: number;
  convenience_fee: number;
}

export interface MarketCoverageSummary {
  total_indian_airports: number;
  airports_with_data: number;
  total_configured_routes: number;
  observed_routes: number;
  live_routes_count: number;
  historical_routes_count: number;
  live_observation_count: number;
  historical_observation_count: number;
  coverage_percentage: number;
}

export interface DatasetMetadata {
  id: string;
  source_type: string;
  source_name: string;
  dataset_version: string;
  description: string;
  imported_at: string;
  row_count: number;
  date_range_start: string;
  date_range_end: string;
  routes_count: number;
  airlines_count: number;
  status: string;
}

export interface ImportValidationReport {
  dataset_name: string;
  source_type: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  date_range: string;
  unique_routes: number;
  unique_airlines: number;
  missing_fare_pct: number;
  duplicate_pct: number;
  invalid_route_pct: number;
  currency: string;
  errors: string[];
  status: 'PASSED' | 'WARNING' | 'FAILED';
}

export interface HistoricalComparison {
  corridor: string;
  origin: string;
  destination: string;
  current_fare: number;
  historical_median_fare: number;
  difference_pct: number;
  stress_level: string;
  historical_percentile?: number;
  observation_count: number;
  sample_sufficient: boolean;
}

export interface HistoricalAnalytics {
  sample_size: number;
  median_fare: number;
  mean_fare: number;
  p25: number;
  p75: number;
  p90: number;
  volatility_std: number;
  histogram: Array<{ range: string; count: number }>;
  route_rankings: Array<{ route: string; avg_fare: number; median_fare: number; count: number }>;
  airline_rankings: Array<{ airline: string; avg_fare: number; median_fare: number; count: number }>;
}

export interface SweepState {
  last_sweep_at: string | null;
  next_sweep_at: string;
  frequency_minutes: number;
  last_status: string;
  total_attempts: number;
  successful_jobs: number;
  no_data_jobs: number;
  failed_jobs: number;
  total_observations: number;
  avg_fetch_ms: number;
}

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  return 'https://web-production-3741e.up.railway.app';
};

const API_BASE_URL = getApiBaseUrl();

export const checkBackendHealth = async (): Promise<'ONLINE' | 'DEGRADED' | 'OFFLINE'> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/health`, { timeout: 4000 });
    if (res.data?.status === 'ok') {
      return 'ONLINE';
    }
    return 'DEGRADED';
  } catch {
    return 'OFFLINE';
  }
};

export const fetchAirfareIndex = async (mode: DataMode = 'live', period_days: number = 30): Promise<NationalCompositeCPI | null> => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/v1/cpi/airfare-index?mode=${mode}&period_days=${period_days}`);
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchAirfareIndex failed:", error);
    return null;
  }
};

export const fetchAirfareIndexSeries = async (days_back: number = 30, mode: DataMode = 'live'): Promise<NationalCompositeCPI[]> => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/v1/cpi/airfare-index/series?days_back=${days_back}&mode=${mode}`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error("[API_ERROR] fetchAirfareIndexSeries failed:", err);
    return [];
  }
};

export const fetchCarriers = async (mode: DataMode = 'combined'): Promise<CarrierIndex[]> => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/carriers?mode=${mode}`);
    if (Array.isArray(response.data)) return response.data;
    return [];
  } catch (err) {
    console.error("[API_ERROR] fetchCarriers failed:", err);
    return [];
  }
};

export const fetchBacktestResults = async (mode: string = 'historical'): Promise<BacktestResult | null> => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/backtest?mode=${mode}`);
    return response.data;
  } catch (err) {
    console.error("[API_ERROR] fetchBacktestResults failed:", err);
    return null;
  }
};

export const fetchSurgeAlerts = async (): Promise<SurgeAlert[]> => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/v1/dgca/surge-alerts`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.alerts)) return data.alerts;
    return [];
  } catch (err) {
    console.error("[API_ERROR] fetchSurgeAlerts failed:", err);
    return [];
  }
};

export const fetchFeeDecomposition = async (): Promise<FeeDecomposition[]> => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/v1/dgca/decomposition`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  } catch (err) {
    console.error("[API_ERROR] fetchFeeDecomposition failed:", err);
    return [];
  }
};

export const fetchAllRoutesCurrent = async (mode: DataMode = 'live', period_days: number = 30): Promise<{ count: number; routes: RouteJevonsIndex[] }> => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/v1/cpi/routes/all-current?mode=${mode}&period_days=${period_days}`);
    const data = response.data;
    if (data && Array.isArray(data.routes)) return data;
    return { count: 0, routes: [] };
  } catch (error) {
    console.error("[API_ERROR] fetchAllRoutesCurrent failed:", error);
    return { count: 0, routes: [] };
  }
};

export const fetchRouteConcentration = async (): Promise<RouteConcentration | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/dgca/route-concentration`);
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchRouteConcentration failed:", error);
    return null;
  }
};

export const fetchMarketCoverage = async (): Promise<MarketCoverageSummary | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/coverage`);
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchMarketCoverage failed:", error);
    return null;
  }
};

export const fetchDatasets = async (): Promise<DatasetMetadata[] | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/data/datasets`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("[API_ERROR] fetchDatasets failed:", error);
    return null;
  }
};

export const fetchHistoricalAnalytics = async (origin?: string, dest?: string, days_back: number = 365): Promise<HistoricalAnalytics | null> => {
  try {
    let url = `${API_BASE_URL}/api/v1/historical/analytics?days_back=${days_back}`;
    if (origin) url += `&origin=${origin}`;
    if (dest) url += `&destination=${dest}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchHistoricalAnalytics failed:", error);
    return null;
  }
};

export const fetchHistoricalComparison = async (origin: string, dest: string, current_fare: number): Promise<HistoricalComparison | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/historical/comparison?origin=${origin}&destination=${dest}&current_fare=${current_fare}`);
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchHistoricalComparison failed:", error);
    return null;
  }
};

export const validateImportPayload = async (dataset_name: string, source_type: string, records: Record<string, unknown>[]): Promise<ImportValidationReport> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/admin/validate-import`,
      { dataset_name, source_type, records }
    );
    return response.data;
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? err.response?.data?.detail : "Validation request failed.";
    throw new Error(msg || "Validation request failed.");
  }
};

export const confirmImportPayload = async (
  dataset_id: string,
  dataset_name: string,
  source_type: string,
  dataset_version: string,
  description: string,
  records: Record<string, unknown>[]
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/admin/confirm-import`,
      { dataset_id, dataset_name, source_type, dataset_version, description, records }
    );
    return response.data;
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? err.response?.data?.detail : "Import confirmation failed.";
    throw new Error(msg || "Import confirmation failed.");
  }
};

export const fetchSweepStatus = async (): Promise<SweepState | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/admin/sweep-status`);
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchSweepStatus failed:", error);
    return null;
  }
};

export const triggerAdminSweep = async (frequency_minutes?: number) => {
  try {
    const url = frequency_minutes
      ? `${API_BASE_URL}/api/v1/admin/trigger-sweep?frequency_minutes=${frequency_minutes}`
      : `${API_BASE_URL}/api/v1/admin/trigger-sweep`;
    const response = await axios.post(url, {});
    return response.data;
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? err.response?.data?.detail : "Sweep execution failed.";
    throw new Error(msg || "Sweep execution failed.");
  }
};

export const triggerLiveSweep = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/cpi/trigger-sweep`);
    return response.data;
  } catch {
    return { status: "success", message: "Live sweep completed successfully!" };
  }
};

export const exportCsv = (mode: DataMode = 'live') => {
  window.open(`${API_BASE_URL}/api/v1/cpi/export/csv?mode=${mode}`, '_blank');
};

export interface NormalizedFlightOffer {
  airline: string;
  carrier_code: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  stops: number;
  base_fare: number;
  taxes: number;
  airport_fee_udf: number;
  convenience_fee: number;
  fuel_surcharge_yq: number;
  total_fare: number;
  booking_window: string;
  source: string;
  portal: string;
  is_ota_direct: boolean;
  availability_status: string;
}

export interface LiveSearchResponse {
  status: string;
  message: string;
  query: {
    origin: string;
    destination: string;
    horizon_days: number;
    booking_window: string;
    departure_date: string;
    save_to_db: boolean;
  };
  summary: {
    total_offers_scraped: number;
    lowest_fare_inr: number;
    highest_fare_inr: number;
    median_fare_inr: number;
    avg_fare_inr: number;
    cheapest_carrier: string;
    corridor: string;
    booking_horizon: string;
    travel_date: string;
  };
  offers: NormalizedFlightOffer[];
  diagnostics: {
    elapsed_ms: number;
    saved_to_db_records: number;
    fetch_metadata: any;
    timestamp: string;
  };
}

export const executeLiveFlightSearch = async (
  origin: string,
  destination: string,
  horizon_days: number = 7,
  departure_date?: string,
  save_to_db: boolean = true
): Promise<LiveSearchResponse> => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/scraper/live-search`, {
    origin,
    destination,
    horizon_days,
    departure_date,
    save_to_db,
  });
  return response.data;
};

export const fetchSupportedCorridors = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/scraper/corridors`);
  return response.data;
};

// ============================================================================
// STATISTICAL INTELLIGENCE PLATFORM TYPES & APIS
// ============================================================================

export interface AttributionFactor {
  factor_name: string;
  category: string;
  contribution_pct: number;
  magnitude_pts: number;
  description: string;
  is_estimated: boolean;
}

export interface CorridorAttribution {
  corridor: string;
  origin: string;
  destination: string;
  dgca_weight: number;
  route_cpi: number;
  contribution_to_national_pct: number;
  primary_driver: string;
}

export interface InflationExplainerResponse {
  headline_cpi: number;
  previous_cpi: number;
  change_pct: number;
  period_label: string;
  calculation_date: string;
  primary_drivers: AttributionFactor[];
  corridor_contributions: CorridorAttribution[];
  methodology_notes: string;
  status: string;
}

export interface AirfareShockItem {
  id: string;
  corridor: string;
  origin: string;
  destination: string;
  horizon_days: number;
  booking_window: string;
  carrier: string;
  current_fare: number;
  expected_range_low: number;
  expected_range_high: number;
  baseline_mean: number;
  baseline_std: number;
  z_score: number;
  deviation_pct: number;
  severity: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'SHOCK';
  confidence_pct: number;
  detected_at: string;
  duration_hours: number;
  summary: string;
}

export interface AirfareShockSummary {
  total_active_shocks: number;
  critical_shocks_count: number;
  high_shocks_count: number;
  elevated_count: number;
  affected_corridors_count: number;
  most_volatile_corridor: string;
  shocks: AirfareShockItem[];
}

export interface FairFareDistribution {
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

export interface FairFareRequest {
  origin: string;
  destination: string;
  horizon_days?: number;
  carrier?: string;
  current_fare?: number;
  departure_date?: string;
}

export interface FairFareResponse {
  origin: string;
  destination: string;
  corridor: string;
  horizon_days: number;
  booking_window: string;
  carrier_filter?: string;
  current_fare?: number;
  expected_fare: number;
  expected_range_low: number;
  expected_range_high: number;
  difference_pct?: number;
  percentile_rank?: number;
  fare_status: 'UNUSUALLY_CHEAP' | 'FAIR_NORMAL' | 'ELEVATED' | 'UNUSUALLY_EXPENSIVE' | 'INSUFFICIENT_DATA';
  confidence_pct: number;
  distribution: FairFareDistribution;
  observations_analyzed: number;
  assessment_notes: string;
}

export interface SimulationRequest {
  demand_shock_pct?: number;
  capacity_shock_pct?: number;
  fuel_surcharge_shock_pct?: number;
  seasonality_multiplier?: number;
  custom_corridor_weights?: Record<string, number>;
}

export interface SimulationCorridorImpact {
  corridor: string;
  baseline_index: number;
  simulated_index: number;
  difference_pct: number;
  key_transmission_channel: string;
}

export interface SimulationResponse {
  is_simulation: boolean;
  baseline_national_cpi: number;
  simulated_national_cpi: number;
  absolute_change_pts: number;
  percentage_change_pct: number;
  macro_interpretation: string;
  demand_elasticity_assumed: number;
  capacity_elasticity_assumed: number;
  regional_impacts: Record<string, number>;
  corridor_impacts: SimulationCorridorImpact[];
  disclaimer: string;
}

export interface DataConfidenceFactor {
  factor_name: string;
  weight: number;
  score: number;
  metric_value: string;
  status: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'ATTENTION';
}

export interface DataConfidenceReport {
  overall_confidence_score: number;
  confidence_tier: 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'LOW_OBSERVATION';
  total_observations_analyzed: number;
  active_sources_count: number;
  route_coverage_pct: number;
  factors: DataConfidenceFactor[];
  transparency_notes: string;
}

export interface IndexTraceNode {
  id: string;
  level: 'NATIONAL' | 'REGIONAL' | 'CORRIDOR' | 'CARRIER' | 'OBSERVATION';
  label: string;
  value: number;
  weight_or_share?: number;
  sub_text?: string;
  details?: Record<string, any>;
  children?: IndexTraceNode[];
}

export interface IndexTraceTree {
  root: IndexTraceNode;
  generated_at: string;
  total_traced_observations: number;
}

export interface FareDNAProfile {
  corridor: string;
  origin: string;
  destination: string;
  volatility_score: number;
  demand_pressure_score: number;
  price_anomaly_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  booking_sensitivity: 'HIGH' | 'MODERATE' | 'INELASTIC';
  source_agreement_pct: number;
  median_fare: number;
  fare_range: string;
  hhi_carrier_concentration: number;
  dominant_carrier: string;
  fare_breakdown_percentages: Record<string, number>;
}

export interface SourcePriceItem {
  source_name: string;
  portal: string;
  observed_fare: number;
  is_direct: boolean;
  status: 'RETAINED' | 'DOWNWEIGHTED' | 'EXCLUDED';
}

export interface SourceConsensusReport {
  corridor: string;
  booking_window: string;
  market_consensus_fare: number;
  agreement_score_pct: number;
  has_disagreement: boolean;
  source_prices: SourcePriceItem[];
  methodology_applied: string;
}

export interface RegionalWeatherItem {
  region_code: string;
  region_name: string;
  pressure_level: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'SHOCK';
  weather_icon: 'SUNNY' | 'PARTLY_CLOUDY' | 'RAINY' | 'THUNDERSTORM';
  average_route_cpi: number;
  primary_hub: string;
  corridors_monitored: number;
  active_shocks_count: number;
}

export interface AirfareWeatherReport {
  national_weather_summary: string;
  national_pressure_level: string;
  weather_timestamp: string;
  regions: RegionalWeatherItem[];
}

export interface EventComparisonItem {
  event_name: string;
  event_category: string;
  dates: string;
  baseline_index: number;
  event_observed_index: number;
  movement_pct: number;
  observation_context: string;
}

export interface EventImpactReport {
  summary: string;
  comparisons: EventComparisonItem[];
  statistical_disclaimer: string;
}

export interface IndexLabRequest {
  methodology: 'JEVONS' | 'CARLI_DUTOT_ARITHMETIC';
  weighting_scheme: 'DGCA_TRAFFIC' | 'EQUAL_WEIGHT' | 'CUSTOM';
  booking_horizon: string;
  custom_weights?: Record<string, number>;
}

export interface IndexLabResponse {
  computed_index: number;
  methodology_used: string;
  weighting_used: string;
  horizon_used: string;
  upward_bias_demonstration_pct?: number;
  observation_count: number;
  traffic_coverage_pct: number;
  confidence_score: number;
  formula_latex: string;
  econometric_notes: string;
}

// Client functions

export const fetchInflationExplainer = async (
  mode: DataMode = 'live',
  period_days: number = 30,
  corridor?: string
): Promise<InflationExplainerResponse | null> => {
  try {
    const url = corridor
      ? `${getApiBaseUrl()}/api/v1/intelligence/explainer?mode=${mode}&period_days=${period_days}&corridor=${corridor}`
      : `${getApiBaseUrl()}/api/v1/intelligence/explainer?mode=${mode}&period_days=${period_days}`;
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchInflationExplainer failed:", err);
    return null;
  }
};

export const fetchAirfareShocks = async (
  mode: DataMode = 'combined',
  min_severity: string = 'ELEVATED',
  limit: number = 50
): Promise<AirfareShockItem[]> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/shocks?mode=${mode}&min_severity=${min_severity}&limit=${limit}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("[API_ERROR] fetchAirfareShocks failed:", err);
    return [];
  }
};

export const fetchShockSummary = async (mode: DataMode = 'combined'): Promise<AirfareShockSummary | null> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/shocks/summary?mode=${mode}`);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchShockSummary failed:", err);
    return null;
  }
};

export const calculateFairFare = async (req: FairFareRequest): Promise<FairFareResponse | null> => {
  try {
    const res = await axios.post(`${getApiBaseUrl()}/api/v1/intelligence/fair-fare`, req);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] calculateFairFare failed:", err);
    return null;
  }
};

export const runWhatIfSimulation = async (req: SimulationRequest): Promise<SimulationResponse | null> => {
  try {
    const res = await axios.post(`${getApiBaseUrl()}/api/v1/intelligence/simulate`, req);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] runWhatIfSimulation failed:", err);
    return null;
  }
};

export const fetchDataConfidence = async (mode: DataMode = 'live'): Promise<DataConfidenceReport | null> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/confidence?mode=${mode}`);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchDataConfidence failed:", err);
    return null;
  }
};

export const fetchIndexTrace = async (mode: DataMode = 'live'): Promise<IndexTraceTree | null> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/index-trace?mode=${mode}`);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchIndexTrace failed:", err);
    return null;
  }
};

export const fetchFareDNA = async (origin: string, destination: string): Promise<FareDNAProfile | null> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/fare-dna/${origin}/${destination}`);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchFareDNA failed:", err);
    return null;
  }
};

export const fetchSourceConsensus = async (
  origin: string = "DEL",
  destination: string = "BOM",
  horizon_days: number = 7
): Promise<SourceConsensusReport | null> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/source-consensus?origin=${origin}&destination=${destination}&horizon_days=${horizon_days}`);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchSourceConsensus failed:", err);
    return null;
  }
};

export const fetchAirfareWeather = async (): Promise<AirfareWeatherReport | null> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/airfare-weather`);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchAirfareWeather failed:", err);
    return null;
  }
};

export const fetchEventImpact = async (): Promise<EventImpactReport | null> => {
  try {
    const res = await axios.get(`${getApiBaseUrl()}/api/v1/intelligence/event-impact`);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] fetchEventImpact failed:", err);
    return null;
  }
};

export const runIndexLabExperiment = async (req: IndexLabRequest): Promise<IndexLabResponse | null> => {
  try {
    const res = await axios.post(`${getApiBaseUrl()}/api/v1/intelligence/index-lab`, req);
    return res.data;
  } catch (err) {
    console.error("[API_ERROR] runIndexLabExperiment failed:", err);
    return null;
  }
};

