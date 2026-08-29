"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useVayuTheme } from "../components/ThemeContext";
import DataModeSelector from "../components/DataModeSelector";
import DateRangeSelector, { DateRangeDays } from "../components/DateRangeSelector";
import HeroMarketPulse from "../components/HeroMarketPulse";
import IndiaRouteMap from "../components/IndiaRouteMap";
import RouteCards from "../components/RouteCards";
import StressGauge from "../components/StressGauge";
import TopMovers from "../components/TopMovers";
import RouteContributionGrid from "../components/RouteContributionGrid";
import CoverageMetrics from "../components/CoverageMetrics";
import CurrentVsHistoricalCard from "../components/CurrentVsHistoricalCard";
import FarePressureMatrix from "../components/FarePressureMatrix";
import RouteComparison from "../components/RouteComparison";
import WhyIsThisHappening from "../components/WhyIsThisHappening";
import ForecastPanel from "../components/ForecastPanel";
import RouteDrawer from "../components/RouteDrawer";
import { HeroPulseSkeleton } from "../components/SkeletonLoaders";
import AirfareWeatherMap from "../components/intelligence/AirfareWeatherMap";
import {
  fetchAirfareIndex,
  fetchSurgeAlerts,
  fetchAllRoutesCurrent,
  fetchMarketCoverage,
  DataMode,
  NationalCompositeCPI,
  SurgeAlert,
  RouteJevonsIndex,
  MarketCoverageSummary,
} from "../lib/api";
import { Activity, Layers, AlertCircle, Plane, Sparkles, Map, BarChart3, ShieldAlert, Cpu } from "lucide-react";

function CommandCenterContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get("mode") as DataMode) || "live";

  const { selectedCorridor, setSelectedCorridor } = useVayuTheme();
  const [dataMode, setDataMode] = useState<DataMode>(initialMode);
  const [dateRangeDays, setDateRangeDays] = useState<DateRangeDays>(30);
  const [cpiData, setCpiData] = useState<NationalCompositeCPI | null>(null);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [coverage, setCoverage] = useState<MarketCoverageSummary | null>(null);
  const [drawerRoute, setDrawerRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDashboardTab, setActiveDashboardTab] = useState<"map_pulse" | "cpi_analytics" | "forensics">("map_pulse");

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [cpiRes, alertsRes, routesRes, coverageRes] = await Promise.all([
          fetchAirfareIndex(dataMode, dateRangeDays),
          fetchSurgeAlerts(),
          fetchAllRoutesCurrent(dataMode, dateRangeDays),
          fetchMarketCoverage(),
        ]);

        if (cpiRes) setCpiData(cpiRes);
        if (alertsRes) setAlerts(alertsRes);
        if (routesRes && routesRes.routes) setRoutes(routesRes.routes);
        if (coverageRes) setCoverage(coverageRes);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [dataMode, dateRangeDays]);

  const activeRouteCode = selectedCorridor || "DEL-BOM";
  const activeAlert = alerts.find((a) => a.corridor === activeRouteCode);
  const sigmaDev = activeAlert ? activeAlert.sigma_deviation : 0.0;
  const hhiScore = 0.42;

  // Market status calculation
  const getMarketStatus = () => {
    if (!cpiData) return { status: "BACKEND UNAVAILABLE", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
    const surgeCount = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH").length;
    if (surgeCount >= 3) {
      return { status: "HIGH SURGE PRESSURE", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
    }
    if (surgeCount > 0) {
      return { status: "ELEVATED DEMAND", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    }
    return { status: "NORMAL OPERATIONS", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
  };

  const marketStatus = getMarketStatus();

  const obsCount = coverage
    ? dataMode === "live"
      ? coverage.live_observation_count
      : dataMode === "historical"
      ? coverage.historical_observation_count
      : coverage.live_observation_count + coverage.historical_observation_count
    : 0;

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {/* Citizen / Passenger Mode Switcher Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-cyan-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block font-mono">
              Looking for Consumer Flight Advice?
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Visit the simplified <strong>Passenger & Citizen Hub</strong> for instant fair-fare verification, when-to-buy tips, and fee breakdowns.
            </p>
          </div>
        </div>
        <a
          href="/passenger"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-2 shadow-md transition-all hover:scale-105"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Open Passenger Hub</span>
          <span className="text-xs">➔</span>
        </a>
      </div>

      {/* 1. Global Data Mode & Date Range Selector */}
      <div className="space-y-4">
        <DataModeSelector
          currentMode={dataMode}
          onModeChange={setDataMode}
          observationCount={obsCount}
          lastUpdated={cpiData?.calculation_date ? `Calculated ${cpiData.calculation_date}` : "No live backend timestamp"}
          sourceLabel={cpiData?.source_label || "LIVE OBSERVATIONS"}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs ${marketStatus.color}`}>
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-bold">GOVERNANCE STATUS: {marketStatus.status}</span>
          </div>

          <DateRangeSelector selectedDays={dateRangeDays} onRangeChange={setDateRangeDays} />
        </div>
      </div>

      {/* 2. Hero Market KPI Summary */}
      <HeroMarketPulse cpiData={cpiData} alerts={alerts} observationCount={obsCount} dateRangeDays={dateRangeDays} />

      {/* 3. Executive Intelligence Capabilities Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              INTELLIGENCE SUITE
            </span>
            <span className="font-bold text-xs text-slate-300 font-mono hidden sm:inline">
              Multi-Pillar Econometric & Surveillance Architecture
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 font-mono text-xs">
          <a
            href="/explainer"
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-blue-400 font-bold">
              <span>1. EXPLAINER</span>
              <span className="text-slate-500 group-hover:text-blue-400">→</span>
            </div>
            <p className="text-[11px] text-slate-400">Attribution waterfall</p>
          </a>

          <a
            href="/shocks"
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>2. SHOCKS</span>
              <span className="text-slate-500 group-hover:text-rose-400">→</span>
            </div>
            <p className="text-[11px] text-slate-400">3-Sigma anomaly scanner</p>
          </a>

          <a
            href="/fair-fare"
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-indigo-400 font-bold">
              <span>3. FAIR FARE</span>
              <span className="text-slate-500 group-hover:text-indigo-400">→</span>
            </div>
            <p className="text-[11px] text-slate-400">Percentile benchmarks</p>
          </a>

          <a
            href="/policy"
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-purple-400 font-bold">
              <span>4. POLICY LAB</span>
              <span className="text-slate-500 group-hover:text-purple-400">→</span>
            </div>
            <p className="text-[11px] text-slate-400">What-If CPI simulator</p>
          </a>

          <a
            href="/provenance"
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 transition-all text-left space-y-1 block group"
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>5. AUDIT TREE</span>
              <span className="text-slate-500 group-hover:text-emerald-400">→</span>
            </div>
            <p className="text-[11px] text-slate-400">100% Provenance trace</p>
          </a>
        </div>
      </div>

      {/* 4. Structured Dashboard Tabs for Clean Exploration */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        <button
          onClick={() => setActiveDashboardTab("map_pulse")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeDashboardTab === "map_pulse"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Map className="h-4 w-4" />
          <span>India Corridor Map & Route Pulse</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab("cpi_analytics")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeDashboardTab === "cpi_analytics"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Route Weights & MoSPI Index</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab("forensics")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeDashboardTab === "forensics"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>DGCA Surveillance & Risk Matrix</span>
        </button>
      </div>

      {/* TAB 1: CORRIDOR MAP & ROUTE PULSE */}
      {activeDashboardTab === "map_pulse" && (
        <div className="space-y-8">
          <AirfareWeatherMap />

          <TopMovers
            routes={routes}
            onSelectCorridor={(c) => {
              setSelectedCorridor(c);
              setDrawerRoute(c);
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IndiaRouteMap routes={routes} alerts={alerts} mode={dataMode} />
            </div>

            <div className="glass-panel p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                  ROUTE STRESS GAUGE
                </span>
                <button
                  onClick={() => setDrawerRoute(activeRouteCode)}
                  className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20"
                >
                  Inspect Drawer
                </button>
              </div>

              <StressGauge score={activeAlert ? 82 : 42} label={`STRESS: ${activeRouteCode}`} />

              <div className="w-full text-xs font-mono text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span>30D Baseline Fare:</span>
                  <span className="font-bold text-slate-200">
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

          <RouteCards routes={routes} alerts={alerts} />
        </div>
      )}

      {/* TAB 2: CPI & WEIGHTING ANALYTICS */}
      {activeDashboardTab === "cpi_analytics" && (
        <div className="space-y-8">
          <RouteContributionGrid
            routes={routes}
            compositeIndex={cpiData?.composite_index || 180.03}
            dataMode={cpiData?.data_mode?.toUpperCase() || "LIVE"}
            onSelectCorridor={(c) => {
              setSelectedCorridor(c);
              setDrawerRoute(c);
            }}
          />

          <RouteComparison routes={routes} />
        </div>
      )}

      {/* TAB 3: FORENSICS & REGULATORY RISK */}
      {activeDashboardTab === "forensics" && (
        <div className="space-y-8">
          <CurrentVsHistoricalCard
            origin={activeRouteCode.split("-")[0]}
            destination={activeRouteCode.split("-")[1]}
            currentFare={activeAlert?.current_fare ?? 0}
          />

          <FarePressureMatrix
            routes={routes}
            onSelectCorridor={(c) => {
              setSelectedCorridor(c);
              setDrawerRoute(c);
            }}
          />

          <WhyIsThisHappening corridor={activeRouteCode} sigmaDeviation={sigmaDev} hhiScore={hhiScore} />

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
        </div>
      )}

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
