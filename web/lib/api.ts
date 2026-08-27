import axios from 'axios';

export type DataMode = 'live' | 'historical' | 'combined';

export interface NationalCompositeCPI {
  calculation_date: string;
  composite_index: number;
  advance_sub_index: number;
  spot_sub_index: number;
  tracked_corridors: number;
  dgca_traffic_coverage_pct: number;
  data_mode?: DataMode;
  source_label?: string;
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
  current_geom_mean: number;
  base_geom_mean: number;
  jevons_index: number;
  sample_size: number;
  data_mode?: DataMode;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const fetchAirfareIndex = async (mode: DataMode = 'live'): Promise<NationalCompositeCPI | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/cpi/airfare-index?mode=${mode}`);
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchAirfareIndex failed:", error);
    return null;
  }
};

export const fetchAirfareIndexSeries = async (days_back: number = 30, mode: DataMode = 'live'): Promise<NationalCompositeCPI[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/cpi/airfare-index/series?days_back=${days_back}&mode=${mode}`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error("[API_ERROR] fetchAirfareIndexSeries failed:", err);
    return [];
  }
};

export const fetchSurgeAlerts = async (): Promise<SurgeAlert[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/dgca/surge-alerts`);
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
    const response = await axios.get(`${API_BASE_URL}/api/v1/dgca/decomposition`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  } catch (err) {
    console.error("[API_ERROR] fetchFeeDecomposition failed:", err);
    return [];
  }
};

export const fetchAllRoutesCurrent = async (mode: DataMode = 'live'): Promise<{ count: number; routes: RouteJevonsIndex[] }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/cpi/routes/all-current?mode=${mode}`);
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

export const adminLogin = async (password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/admin/auth/login`, { password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Admin password verification failed.");
  }
};

export const adminVerifyOtp = async (otp: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/admin/auth/verify-otp`, { otp });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "OTP verification failed.");
  }
};

export const validateImportPayload = async (dataset_name: string, source_type: string, records: any[], token?: string): Promise<ImportValidationReport> => {
  try {
    const headers = token ? { 'X-Admin-Token': token } : {};
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/admin/validate-import`,
      { dataset_name, source_type, records },
      { headers }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Validation request failed.");
  }
};

export const confirmImportPayload = async (dataset_id: string, dataset_name: string, source_type: string, dataset_version: string, description: string, records: any[], token?: string) => {
  try {
    const headers = token ? { 'X-Admin-Token': token } : {};
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/admin/confirm-import`,
      { dataset_id, dataset_name, source_type, dataset_version, description, records },
      { headers }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Import confirmation failed.");
  }
};

export const fetchSweepStatus = async (token?: string): Promise<any | null> => {
  try {
    const headers = token ? { 'X-Admin-Token': token } : {};
    const response = await axios.get(`${API_BASE_URL}/api/v1/admin/sweep-status`, { headers });
    return response.data;
  } catch (error) {
    console.error("[API_ERROR] fetchSweepStatus failed:", error);
    return null;
  }
};

export const triggerAdminSweep = async (frequency_minutes?: number, token?: string) => {
  try {
    const headers = token ? { 'X-Admin-Token': token } : {};
    const url = frequency_minutes ? `${API_BASE_URL}/api/v1/admin/trigger-sweep?frequency_minutes=${frequency_minutes}` : `${API_BASE_URL}/api/v1/admin/trigger-sweep`;
    const response = await axios.post(url, {}, { headers });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Sweep execution failed.");
  }
};

export const triggerLiveSweep = triggerAdminSweep;

export const exportCsv = (mode: DataMode = 'live') => {
  window.open(`${API_BASE_URL}/api/v1/cpi/export/csv?mode=${mode}`, '_blank');
};

// Helper for session token stored in localStorage (fallback if cookie blocked)
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vayu_auth_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
};

export const requestRegulatorOtp = async (phone: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/regulator/request-otp`,
      { phone },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Unable to request OTP verification code.");
  }
};

export const verifyRegulatorOtp = async (phone: string, otp: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/regulator/verify-otp`,
      { phone, otp },
      { withCredentials: true }
    );
    if (response.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('vayu_auth_token', response.data.token);
      if (response.data?.user) {
        localStorage.setItem('vayu_user_profile', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "OTP verification failed.");
  }
};

export const logoutAuth = async () => {
  try {
    const headers = getAuthHeaders();
    await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, { headers, withCredentials: true });
  } catch (error) {
    console.error("[API_ERROR] logoutAuth failed:", error);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vayu_auth_token');
      localStorage.removeItem('vayu_user_profile');
    }
  }
};

export const fetchAuthMe = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/me`, { headers, withCredentials: true });
    return response.data;
  } catch (error) {
    return null;
  }
};

export const fetchAdminUsers = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/v1/admin/users`, { headers, withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Failed to fetch user list.");
  }
};

export const createAdminUser = async (data: { name: string; phone: string; email?: string; role: string }) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/api/v1/admin/users`, data, { headers, withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Failed to register new user.");
  }
};

export const updateAdminUser = async (userId: string, data: { name?: string; phone?: string; email?: string; role?: string; is_active?: boolean }) => {
  try {
    const headers = getAuthHeaders();
    const response = await axios.patch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, data, { headers, withCredentials: true });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Failed to update user.");
  }
};


