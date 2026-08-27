"use client";

import React from "react";
import { Plane, MapPin, Database, Activity, CheckCircle2 } from "lucide-react";
import { MarketCoverageSummary } from "../lib/api";

interface CoverageMetricsProps {
  coverage?: MarketCoverageSummary;
}

export default function CoverageMetrics({ coverage }: CoverageMetricsProps) {
  const data = coverage || {
    total_indian_airports: 30,
    airports_with_data: 24,
    total_configured_routes: 22,
    observed_routes: 18,
    live_routes_count: 14,
    historical_routes_count: 18,
    live_observation_count: 538,
    historical_observation_count: 360,
    coverage_percentage: 81.8,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 font-mono">
      {/* Indian Airports Covered */}
      <div className="glass-panel p-3 bg-slate-900/70 border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span>Airports</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-white">{data.airports_with_data}</span>
          <span className="text-xs text-slate-500">/ {data.total_indian_airports}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">Full India Coverage</div>
      </div>

      {/* Corridors Observed */}
      <div className="glass-panel p-3 bg-slate-900/70 border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <Plane className="h-3.5 w-3.5 text-emerald-400" />
          <span>Routes</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-emerald-400">{data.observed_routes}</span>
          <span className="text-xs text-slate-500">/ {data.total_configured_routes}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">Tracked Corridors</div>
      </div>

      {/* Live Routes */}
      <div className="glass-panel p-3 bg-slate-900/70 border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Corridors</span>
        </div>
        <div className="text-xl font-bold text-emerald-400">{data.live_routes_count}</div>
        <div className="text-[10px] text-slate-400 mt-1">Google Flights Live</div>
      </div>

      {/* Historical Routes */}
      <div className="glass-panel p-3 bg-slate-900/70 border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          <span>Historical Routes</span>
        </div>
        <div className="text-xl font-bold text-blue-400">{data.historical_routes_count}</div>
        <div className="text-[10px] text-slate-400 mt-1">DGCA Datasets</div>
      </div>

      {/* Total Observations */}
      <div className="glass-panel p-3 bg-slate-900/70 border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <Activity className="h-3.5 w-3.5 text-purple-400" />
          <span>Observations</span>
        </div>
        <div className="text-xl font-bold text-purple-400">
          {(data.live_observation_count + data.historical_observation_count).toLocaleString()}
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          {data.live_observation_count} Live + {data.historical_observation_count} Hist
        </div>
      </div>

      {/* Network Coverage % */}
      <div className="glass-panel p-3 bg-slate-900/70 border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
          <span>Coverage</span>
        </div>
        <div className="text-xl font-bold text-amber-400">{data.coverage_percentage}%</div>
        <div className="text-[10px] text-slate-400 mt-1">Domestic Flight Vol</div>
      </div>
    </div>
  );
}
