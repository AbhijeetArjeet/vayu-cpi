"use client";

import React, { useEffect, useState } from "react";
import HeroMarketPulse from "../components/HeroMarketPulse";
import IndiaRouteMap from "../components/IndiaRouteMap";
import StressGauge from "../components/StressGauge";
import WhyIsThisHappening from "../components/WhyIsThisHappening";
import ForecastPanel from "../components/ForecastPanel";
import RouteCards from "../components/RouteCards";
import { HeroPulseSkeleton, MapSkeleton } from "../components/SkeletonLoaders";
import { useVayuTheme } from "../components/ThemeContext";
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

export default function CommandCenterOverview() {
  const { selectedCorridor } = useVayuTheme();
  const [cpiData, setCpiData] = useState<NationalCompositeCPI | null>(null);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [concentration, setConcentration] = useState<RouteConcentration | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      {/* 1. Hero Market Pulse Section */}
      <HeroMarketPulse cpiData={cpiData} alerts={alerts} observationCount={538} />

      {/* 2. Central Command Row: Interactive India Map + Stress Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IndiaRouteMap />
        </div>

        {/* Airfare Stress Score Ring Card */}
        <div className="glass-panel p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              ROUTE STRESS GAUGE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
              {activeRouteCode}
            </span>
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
              <span className="font-bold text-rose-500">{sigmaDev}σ</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tracked Corridors Cards */}
      <RouteCards routes={routes} alerts={alerts} />

      {/* 4. "Why is this happening?" Pressure Breakdown */}
      <WhyIsThisHappening corridor={activeRouteCode} sigmaDeviation={sigmaDev} hhiScore={hhiScore} />

      {/* 5. Forecast Trajectory & Book Now Recommendation */}
      <ForecastPanel corridor={activeRouteCode} currentFare={activeAlert?.current_fare ?? 6074} />
    </div>
  );
}
