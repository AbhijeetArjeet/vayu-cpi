import axios from 'axios';

// Exactly matching Pydantic schemas
export interface NationalCompositeCPI {
  calculation_date: string;
  composite_index: number;
  advance_sub_index: number;
  spot_sub_index: number;
  tracked_corridors: number;
  dgca_traffic_coverage_pct: number;
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
}

export interface RouteConcentration {
  hhi: number;
  concentration_label: string;
  routes: {route: string, weight: number}[];
  note: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const MOCK_CPI_SERIES: NationalCompositeCPI[] = [
  { calculation_date: '2024-01-01', composite_index: 100.0, advance_sub_index: 100.0, spot_sub_index: 100.0, tracked_corridors: 50, dgca_traffic_coverage_pct: 85 },
  { calculation_date: '2024-02-01', composite_index: 102.5, advance_sub_index: 101.5, spot_sub_index: 103.5, tracked_corridors: 50, dgca_traffic_coverage_pct: 85 },
  { calculation_date: '2024-03-01', composite_index: 105.1, advance_sub_index: 103.0, spot_sub_index: 108.0, tracked_corridors: 50, dgca_traffic_coverage_pct: 86 },
  { calculation_date: '2024-04-01', composite_index: 104.2, advance_sub_index: 102.5, spot_sub_index: 106.5, tracked_corridors: 50, dgca_traffic_coverage_pct: 86 },
];

const MOCK_SURGE_ALERTS: SurgeAlert[] = [
  { corridor: 'DEL-BOM', origin: 'DEL', destination: 'BOM', current_fare: 15500, baseline_30d_fare: 8000, sigma_deviation: 3.5, severity: 'CRITICAL', carrier_dominance: 'IndiGo (65%)', flagged_at: new Date().toISOString() },
  { corridor: 'BLR-DEL', origin: 'BLR', destination: 'DEL', current_fare: 12000, baseline_30d_fare: 7500, sigma_deviation: 2.8, severity: 'HIGH', carrier_dominance: 'Air India (50%)', flagged_at: new Date().toISOString() },
  { corridor: 'CCU-MAA', origin: 'CCU', destination: 'MAA', current_fare: 9500, baseline_30d_fare: 6800, sigma_deviation: 1.9, severity: 'MODERATE', carrier_dominance: 'Vistara (40%)', flagged_at: new Date().toISOString() }
];

export interface FeeDecomposition {
  route: string;
  base_fare: number;
  fuel_surcharge_yq: number;
  airport_fee_udf: number;
  convenience_fee: number;
}

const MOCK_FEE_DECOMPOSITION: FeeDecomposition[] = [
  { route: 'DEL-BOM', base_fare: 4500, fuel_surcharge_yq: 1500, airport_fee_udf: 1200, convenience_fee: 300 },
  { route: 'BLR-DEL', base_fare: 5000, fuel_surcharge_yq: 1600, airport_fee_udf: 1300, convenience_fee: 300 },
  { route: 'CCU-MAA', base_fare: 3500, fuel_surcharge_yq: 1200, airport_fee_udf: 900, convenience_fee: 300 },
];

const MOCK_ROUTES_CURRENT: RouteJevonsIndex[] = [
  { origin: 'DEL', destination: 'BOM', horizon_days: 30, current_geom_mean: 4500, base_geom_mean: 4200, jevons_index: 107.14, sample_size: 15 },
  { origin: 'BOM', destination: 'DEL', horizon_days: 7, current_geom_mean: 5000, base_geom_mean: 4800, jevons_index: 104.17, sample_size: 10 },
  { origin: 'BLR', destination: 'DEL', horizon_days: 1, current_geom_mean: 8500, base_geom_mean: 7000, jevons_index: 121.43, sample_size: 5 },
];

const MOCK_ROUTE_CONCENTRATION: RouteConcentration = {
  hhi: 1850,
  concentration_label: "MODERATE_CONCENTRATION",
  routes: [
    { route: 'DEL-BOM', weight: 0.26 },
    { route: 'BOM-DEL', weight: 0.24 },
    { route: 'BLR-DEL', weight: 0.20 },
    { route: 'DEL-CCU', weight: 0.14 },
    { route: 'DEL-PAT', weight: 0.09 },
    { route: 'BOM-GOI', weight: 0.07 }
  ],
  note: "Estimated HHI based on historical passenger volumes."
};

export const fetchAirfareIndex = async (): Promise<NationalCompositeCPI> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/cpi/airfare-index`);
    return response.data;
  } catch (error) {
    console.warn('Backend unreachable, using mock data for fetchAirfareIndex');
    return MOCK_CPI_SERIES[MOCK_CPI_SERIES.length - 1];
  }
};

export const fetchAirfareIndexSeries = async (): Promise<NationalCompositeCPI[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/cpi/airfare-index/series`);
    return response.data;
  } catch (err) {
    console.warn('Backend unreachable, using mock data for fetchAirfareIndexSeries');
    return MOCK_CPI_SERIES;
  }
};

export const fetchSurgeAlerts = async (): Promise<SurgeAlert[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/dgca/surge-alerts`);
    return response.data;
  } catch (err) {
    console.warn('Backend unreachable, using mock data for fetchSurgeAlerts');
    return MOCK_SURGE_ALERTS;
  }
};

export const fetchFeeDecomposition = async (): Promise<FeeDecomposition[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/dgca/decomposition`);
    return response.data;
  } catch (err) {
    console.warn('Backend unreachable, using mock data for fetchFeeDecomposition');
    return MOCK_FEE_DECOMPOSITION;
  }
};

export const exportCsv = () => {
  window.open(`${API_BASE_URL}/api/v1/cpi/export/csv`, '_blank');
};

export const fetchAllRoutesCurrent = async (): Promise<{count: number, routes: RouteJevonsIndex[]}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/cpi/routes/all-current`);
    return response.data;
  } catch (error) {
    console.warn('Backend unreachable, using mock data for fetchAllRoutesCurrent');
    return { count: MOCK_ROUTES_CURRENT.length, routes: MOCK_ROUTES_CURRENT };
  }
};

export const fetchRouteConcentration = async (): Promise<RouteConcentration> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/dgca/route-concentration`);
    return response.data;
  } catch (error) {
    console.warn('Backend unreachable, using mock data for fetchRouteConcentration');
    return MOCK_ROUTE_CONCENTRATION;
  }
};
