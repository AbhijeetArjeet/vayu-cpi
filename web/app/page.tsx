"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import HeroMarketPulse from "../components/HeroMarketPulse";
import IndiaRouteMap from "../components/IndiaRouteMap";
import StressGauge from "../components/StressGauge";
import WhyIsThisHappening from "../components/WhyIsThisHappening";
import ForecastPanel from "../components/ForecastPanel";
import RouteCards from "../components/RouteCards";
import TopMovers from "../components/TopMovers";
import FarePressureMatrix from "../components/FarePressureMatrix";
import RouteComparison from "../components/RouteComparison";
import RouteContributionGrid from "../components/RouteContributionGrid";
import RouteDrawer from "../components/RouteDrawer";
import DataModeSelector from "../components/DataModeSelector";
import DateRangeSelector, { DateRangeDays } from "../components/DateRangeSelector";
import CoverageMetrics from "../components/CoverageMetrics";
import CurrentVsHistoricalCard from "../components/CurrentVsHistoricalCard";
import AirfareWeatherMap from "../components/intelligence/AirfareWeatherMap";
import { HeroPulseSkeleton, MapSkeleton } from "../components/SkeletonLoaders";
import { useVayuTheme } from "../components/ThemeContext";
import { calculateMarketStatus, calculateCpiContributions } from "../lib/analytics";
import {
  fetchAirfareIndex,
  fetchSurgeAlerts,
  fetchAllRoutesCurrent,
  fetchRouteConcentration,
  fetchMarketCoverage,
  DataMode,
  NationalCompositeCPI,
  SurgeAlert,
  RouteJevonsIndex,
  RouteConcentration,
  MarketCoverageSummary,
} from "../lib/api";
import { Activity, Layers, AlertCircle } from "lucide-react";

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get("mode") as DataMode) || "live";

  const { selectedCorridor, setSelectedCorridor } = useVayuTheme();
  const [dataMode, setDataMode] = useState<DataMode>(initialMode);
  const [dateRangeDays, setDateRangeDays] = useState<DateRangeDays>(30);

  const [cpiData, setCpiData] = useState<NationalCompositeCPI | null>(null);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [concentration, setConcentration] = useState<RouteConcentration | null>(null);
  const [coverage, setCoverage] = useState<MarketCoverageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drawerRoute, setDrawerRoute] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(false);
      try {
        const [cpi, alertList, routeData, conc, cov] = await Promise.all([
          fetchAirfareIndex(dataMode, dateRangeDays),
          fetchSurgeAlerts(),
          fetchAllRoutesCurrent(dataMode, dateRangeDays),
          fetchRouteConcentration(),
          fetchMarketCoverage(),
        ]);
        setCpiData(cpi);
        setAlerts(alertList || []);
        setRoutes(routeData?.routes || []);
        setConcentration(conc);
        setCoverage(cov);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [dataMode, dateRangeDays]);

  if (loading) {
    return (
      <div className="space-y-8">
        <HeroPulseSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MapSkeleton />
          </div>
          <div className="glass-panel p-6 animate-pulse bg-slate-900/60" />
        </div>
      </div>
    );
  }

  const activeRouteCode = selectedCorridor || "DEL-BOM";
  const activeAlert = alerts.find((a) => a.corridor === activeRouteCode);
  const sigmaDev = activeAlert?.sigma_deviation ?? 0.0;
  const hhiScore = concentration?.hhi ?? 0;

  const marketStatus = cpiData
    ? calculateMarketStatus(cpiData.composite_index, alerts.length)
    : { status: "BACKEND UNAVAILABLE", color: "bg-rose-500/10 text-rose-400 border-rose-500/30", description: "Could not connect to production API." };

  const contributors = routes && routes.length > 0
    ? calculateCpiContributions(
        routes.map((r, i) => ({
          corridor: `${r.origin}-${r.destination}`,
          weight: 1 / Math.max(1, routes.length),
          jevonsIndex: r.jevons_index,
        }))
      )
    : [];

  const obsCount = coverage
    ? dataMode === "live"
      ? coverage.live_observation_count
      : dataMode === "historical"
      ? coverage.historical_observation_count
      : coverage.live_observation_count + coverage.historical_observation_count
    : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Backend Error Notification Banner if backend is offline */}
      {(!cpiData && !loading) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <strong className="block font-bold">BACKEND SERVICE UNAVAILABLE</strong>
            <span>Unable to connect to the production VAYU-CPI API server. Showing empty state.</span>
          </div>
        </div>
      )}

      {/* 1. Global Data Mode Selector */}
      <DataModeSelector
        currentMode={dataMode}
        onModeChange={setDataMode}
        observationCount={obsCount}
        lastUpdated={cpiData?.calculation_date ? `Calculated ${cpiData.calculation_date}` : "No live backend timestamp"}
        sourceLabel={cpiData?.source_label || "LIVE OBSERVATIONS"}
      />

      {/* 2. Global Date Range Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs w-full sm:w-auto ${marketStatus.color}`}>
          <div className="flex items-center gap-2 font-bold">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>MARKET STATUS: {marketStatus.status}</span>
          </div>
        </div>

        <DateRangeSelector selectedDays={dateRangeDays} onRangeChange={setDateRangeDays} />
      </div>

      {/* 3. Full India Market Coverage Counters */}
      {coverage ? (
        <CoverageMetrics coverage={coverage} />
      ) : (
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs text-slate-500 text-center">
          Coverage metrics unavailable from backend service.
        </div>
      )}

      {/* 3b. VAYU Airfare Weather Regional Pulse */}
      <AirfareWeatherMap />

      {/* 4. Hero Market Pulse Section */}
      <HeroMarketPulse cpiData={cpiData} alerts={alerts} observationCount={obsCount} dateRangeDays={dateRangeDays} />

      {/* 4b. VAYU Statistical Intelligence Capabilities Strip */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-950/20 via-slate-900/40 to-indigo-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              CORE POSITIONING
            </span>
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 tracking-wide font-mono">
              OTHERS COLLECT FARES. VAYU TURNS FARES INTO EVIDENCE.
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Collect → Clean → Normalize → Measure → Explain → Detect → Predict → Simulate → Audit
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 font-mono text-xs">
          <a
            href="/explainer"
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-blue-400 font-bold">
              <span>1. EXPLAIN</span>
              <span className="text-[10px] text-slate-500 group-hover:text-blue-400 transition-colors">→</span>
            </div>
            <p className="text-[11px] text-slate-400">Why did airfare change? Attribution waterfall</p>
          </a>

          <a
            href="/shocks"
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-rose-900/30 border border-slate-800 hover:border-rose-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>2. DETECT</span>
              <span className="text-[10px] text-slate-500 group-hover:text-rose-400 transition-colors">→</span>
            </div>
            <p className="text-[11px] text-slate-400">Automated 3-sigma anomaly & shock scanner</p>
          </a>

          <a
            href="/fair-fare"
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-900/30 border border-slate-800 hover:border-indigo-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-indigo-400 font-bold">
              <span>3. EVALUATE</span>
              <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 transition-colors">→</span>
            </div>
            <p className="text-[11px] text-slate-400">Is this fare normal? Percentile calculator</p>
          </a>

          <a
            href="/policy"
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-purple-900/30 border border-slate-800 hover:border-purple-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-purple-400 font-bold">
              <span>4. SIMULATE</span>
              <span className="text-[10px] text-slate-500 group-hover:text-purple-400 transition-colors">→</span>
            </div>
            <p className="text-[11px] text-slate-400">What-if CPI simulator & Index Lab sandbox</p>
          </a>

          <a
            href="/provenance"
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-emerald-900/30 border border-slate-800 hover:border-emerald-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>5. AUDIT</span>
              <span className="text-[10px] text-slate-500 group-hover:text-emerald-400 transition-colors">→</span>
            </div>
            <p className="text-[11px] text-slate-400">100% Provenance trace & data confidence</p>
          </a>
        </div>
      </div>

      {/* 5. Top Movers (Rising & Falling) */}
      <TopMovers routes={routes} onSelectCorridor={(c) => { setSelectedCorridor(c); setDrawerRoute(c); }} />

      {/* 6. Central Command Row: Interactive India Map + Stress Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IndiaRouteMap routes={routes} alerts={alerts} mode={dataMode} />
        </div>

        {/* Airfare Stress Score Ring Card */}
        <div className="glass-panel p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              ROUTE STRESS GAUGE
            </span>
            <button
              onClick={() => setDrawerRoute(activeRouteCode)}
              className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20"
            >
              Open Drawer
            </button>
          </div>

          <StressGauge score={activeAlert ? 82 : 42} label={`STRESS INDEX: ${activeRouteCode}`} />

          <div className="w-full text-xs font-mono text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span>30D Baseline Fare:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {activeAlert ? `₹${activeAlert.baseline_30d_fare.toLocaleString()}` : "Baseline unavailable"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sigma Deviation:</span>
              <span className="font-bold text-rose-500">{sigmaDev > 0 ? `+${sigmaDev}σ` : "0σ"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Current Market vs Historical Baseline Comparison View */}
      <CurrentVsHistoricalCard
        origin={activeRouteCode.split("-")[0]}
        destination={activeRouteCode.split("-")[1]}
        currentFare={activeAlert?.current_fare ?? 0}
      />

      {/* 8. Tracked Corridors Cards */}
      <RouteCards routes={routes} alerts={alerts} />

      {/* 9. Contribution to National CPI Panel with Live Search & Horizon Filter */}
      <RouteContributionGrid
        routes={routes}
        compositeIndex={cpiData?.composite_index || 180.03}
        dataMode={cpiData?.data_mode?.toUpperCase() || "LIVE"}
        onSelectCorridor={(c) => {
          setSelectedCorridor(c);
          setDrawerRoute(c);
        }}
      />

      {/* 10. Regulatory Risk Matrix */}
      <FarePressureMatrix routes={routes} onSelectCorridor={(c) => { setSelectedCorridor(c); setDrawerRoute(c); }} />

      {/* 11. Multi-Corridor Side-by-Side Comparison */}
      <RouteComparison routes={routes} />

      {/* 12. "Why is this happening?" Pressure Breakdown */}
      <WhyIsThisHappening corridor={activeRouteCode} sigmaDeviation={sigmaDev} hhiScore={hhiScore} />

      {/* 13. Forecast Trajectory & Book Now Recommendation */}
      <ForecastPanel
        corridor={activeRouteCode}
        currentFare={
          routes.find((r) => `${r.origin}-${r.destination}` === activeRouteCode)?.current_geom_mean ||
          activeAlert?.current_fare ||
          6200
        }
        jevonsIndex={
          routes.find((r) => `${r.origin}-${r.destination}` === activeRouteCode)?.jevons_index || 138.5
        }
        routes={routes}
        onSelectCorridor={(c) => setSelectedCorridor(c)}
      />

      {/* Reusable Route Intelligence Drawer */}
      <RouteDrawer corridor={drawerRoute} onClose={() => setDrawerRoute(null)} />
    </div>
  );
}

export default function CommandCenterOverview() {
  return (
    <Suspense fallback={<HeroPulseSkeleton />}>
      <CommandCenterContent />
    </Suspense>
  );
}
