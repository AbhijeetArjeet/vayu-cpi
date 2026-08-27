"use client";

import React, { useEffect, useState } from "react";
import HeroMarketPulse from "../components/HeroMarketPulse";
import IndiaRouteMap from "../components/IndiaRouteMap";
import StressGauge from "../components/StressGauge";
import WhyIsThisHappening from "../components/WhyIsThisHappening";
import ForecastPanel from "../components/ForecastPanel";
import RouteCards from "../components/RouteCards";
import TopMovers from "../components/TopMovers";
import FarePressureMatrix from "../components/FarePressureMatrix";
import RouteComparison from "../components/RouteComparison";
import RouteDrawer from "../components/RouteDrawer";
import { HeroPulseSkeleton, MapSkeleton } from "../components/SkeletonLoaders";
import { useVayuTheme } from "../components/ThemeContext";
import { calculateMarketStatus, calculateCpiContributions } from "../lib/analytics";
import {
  fetchAirfareIndex,
  fetchSurgeAlerts,
  fetchAllRoutesCurrent,
  fetchRouteConcentration,
  NationalCompositeCPI,
  SurgeAlert,
  RouteJevonsIndex,
  RouteConcentration,
} from "../lib/api";
import { Activity, ShieldAlert, Layers, ArrowUpRight } from "lucide-react";

export default function CommandCenterOverview() {
  const { selectedCorridor, setSelectedCorridor } = useVayuTheme();
  const [cpiData, setCpiData] = useState<NationalCompositeCPI | null>(null);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [concentration, setConcentration] = useState<RouteConcentration | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerRoute, setDrawerRoute] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [cpi, alertList, routeData, conc] = await Promise.all([
          fetchAirfareIndex(),
          fetchSurgeAlerts(),
          fetchAllRoutesCurrent(),
          fetchRouteConcentration(),
        ]);
        setCpiData(cpi);
        setAlerts(alertList);
        setRoutes(routeData.routes);
        setConcentration(conc);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

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
  const sigmaDev = activeAlert?.sigma_deviation ?? 3.5;
  const hhiScore = concentration?.hhi ?? 1850;

  const marketStatus = calculateMarketStatus(cpiData?.composite_index ?? 161.78, alerts.length);

  const contributors = calculateCpiContributions([
    { corridor: "DEL-BOM", weight: 0.26, jevonsIndex: 144.6 },
    { corridor: "BOM-DEL", weight: 0.24, jevonsIndex: 142.7 },
    { corridor: "BLR-DEL", weight: 0.20, jevonsIndex: 144.0 },
    { corridor: "DEL-CCU", weight: 0.14, jevonsIndex: 126.3 },
    { corridor: "DEL-PAT", weight: 0.09, jevonsIndex: 163.4 },
    { corridor: "BOM-GOI", weight: 0.07, jevonsIndex: 116.1 },
  ]);

  return (
    <div className="space-y-8 font-sans">
      {/* Market Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${marketStatus.color}`}>
        <div className="flex items-center gap-2 font-bold">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>MARKET STATUS: {marketStatus.status}</span>
        </div>
        <span className="hidden sm:inline opacity-80">{marketStatus.description}</span>
      </div>

      {/* 1. Hero Market Pulse Section */}
      <HeroMarketPulse cpiData={cpiData} alerts={alerts} observationCount={538} />

      {/* 2. Top Movers (Rising & Falling) */}
      <TopMovers routes={routes} onSelectCorridor={(c) => { setSelectedCorridor(c); setDrawerRoute(c); }} />

      {/* 3. Central Command Row: Interactive India Map + Stress Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IndiaRouteMap routes={routes} alerts={alerts} />
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
                ₹{(activeAlert?.baseline_30d_fare ?? 8000).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sigma Deviation:</span>
              <span className="font-bold text-rose-500">+{sigmaDev}σ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tracked Corridors Cards */}
      <RouteCards routes={routes} alerts={alerts} />

      {/* 5. Contribution to National CPI Panel */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Layers className="h-4 w-4 text-blue-500" />
            <span>ROUTE CONTRIBUTION TO NATIONAL AIRFARE INFLATION</span>
          </div>
          <span className="text-slate-400">Total CPI Impact: +61.78 Pts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono text-xs">
          {contributors.map((c, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1 text-center">
              <span className="font-bold text-slate-900 dark:text-white block">{c.corridor}</span>
              <span className="text-[10px] text-slate-400 block">Weight: {(c.weight * 100).toFixed(0)}%</span>
              <span className="font-bold text-blue-500 block">+{c.contributionPoints} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Regulatory Risk Matrix (2x2) */}
      <FarePressureMatrix routes={routes} onSelectCorridor={(c) => { setSelectedCorridor(c); setDrawerRoute(c); }} />

      {/* 7. Multi-Corridor Side-by-Side Comparison */}
      <RouteComparison routes={routes} />

      {/* 8. "Why is this happening?" Pressure Breakdown */}
      <WhyIsThisHappening corridor={activeRouteCode} sigmaDeviation={sigmaDev} hhiScore={hhiScore} />

      {/* 9. Forecast Trajectory & Book Now Recommendation */}
      <ForecastPanel corridor={activeRouteCode} currentFare={activeAlert?.current_fare ?? 6074} />

      {/* Reusable Route Intelligence Drawer */}
      <RouteDrawer corridor={drawerRoute} onClose={() => setDrawerRoute(null)} />
    </div>
  );
}
