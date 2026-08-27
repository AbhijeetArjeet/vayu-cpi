"use client";

import React, { useState } from "react";
import ForecastPanel from "../../components/ForecastPanel";
import RouteCards from "../../components/RouteCards";
import { TrendingUp, ShoppingBag, Clock, ArrowRight } from "lucide-react";
import { useVayuTheme } from "../../components/ThemeContext";

export default function ForecastPage() {
  const { selectedCorridor } = useVayuTheme();
  const activeCorridor = selectedCorridor || "DEL-BOM";

  const mockRoutes = [
    { origin: "DEL", destination: "BOM", horizon_days: 7, current_geom_mean: 6074, base_geom_mean: 4200, jevons_index: 144.6, sample_size: 57 },
    { origin: "BOM", destination: "DEL", horizon_days: 7, current_geom_mean: 6425, base_geom_mean: 4500, jevons_index: 142.7, sample_size: 58 },
    { origin: "BLR", destination: "DEL", horizon_days: 7, current_geom_mean: 7200, base_geom_mean: 5000, jevons_index: 144.0, sample_size: 35 },
    { origin: "DEL", destination: "CCU", horizon_days: 7, current_geom_mean: 4800, base_geom_mean: 3800, jevons_index: 126.3, sample_size: 26 },
    { origin: "DEL", destination: "PAT", horizon_days: 7, current_geom_mean: 8500, base_geom_mean: 5200, jevons_index: 163.4, sample_size: 20 },
    { origin: "BOM", destination: "GOI", horizon_days: 7, current_geom_mean: 3600, base_geom_mean: 3100, jevons_index: 116.1, sample_size: 11 },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            TRAVELLER FORECAST & "BOOK NOW OR WAIT" ENGINE
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
          Predictive Airfare Trajectory & Optimal Passenger Booking Window Recommendation
        </p>
      </div>

      {/* Main Forecast Panel */}
      <ForecastPanel corridor={activeCorridor} currentFare={6074} />

      {/* Select Corridor Cards */}
      <RouteCards routes={mockRoutes} alerts={[]} />
    </div>
  );
}
