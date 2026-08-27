"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Scale, AlertTriangle, ShieldCheck } from "lucide-react";
import { HistoricalComparison, fetchHistoricalComparison } from "../lib/api";

interface CurrentVsHistoricalCardProps {
  origin?: string;
  destination?: string;
  currentFare?: number;
}

export default function CurrentVsHistoricalCard({
  origin = "DEL",
  destination = "BOM",
  currentFare = 6074,
}: CurrentVsHistoricalCardProps) {
  const [data, setData] = useState<HistoricalComparison | null>(null);

  useEffect(() => {
    fetchHistoricalComparison(origin, destination, currentFare).then(setData);
  }, [origin, destination, currentFare]);

  if (!data) return null;

  const isHigher = data.difference_pct > 0;

  return (
    <div className="glass-panel p-4 bg-slate-900/80 border-slate-800 text-white font-mono my-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-blue-400" />
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-200">
            MARKET BENCHMARK: CURRENT VS HISTORICAL BASELINE
          </h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
          {data.corridor} CORRIDOR
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Current Fare */}
        <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400">Current Live GeoMean</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">₹{data.current_fare.toLocaleString()}</div>
        </div>

        {/* Historical Median */}
        <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400">Historical Median Fare</div>
          <div className="text-xl font-bold text-blue-400 mt-1">₹{data.historical_median_fare.toLocaleString()}</div>
        </div>

        {/* Variance % */}
        <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400">Deviation from Baseline</div>
          <div className={`text-xl font-bold flex items-center gap-1 mt-1 ${isHigher ? "text-rose-400" : "text-emerald-400"}`}>
            {isHigher ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            {isHigher ? `+${data.difference_pct}%` : `${data.difference_pct}%`}
          </div>
        </div>

        {/* Historical Percentile & Stress */}
        <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
          <div className="text-[10px] text-slate-400">Historical Percentile</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-lg font-bold text-amber-400">
              {data.historical_percentile ? `${data.historical_percentile}th` : "N/A"}
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                data.stress_level === "CRITICAL"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : data.stress_level === "HIGH"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              {data.stress_level} STRESS
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Based on {data.observation_count} verified historical observations for {data.corridor}.</span>
        <span className="text-slate-500">Methodology: Geometric mean micro-index vs 2024-2025 tariff baseline</span>
      </div>
    </div>
  );
}
