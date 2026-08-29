"use client";

import React, { useState, useEffect } from "react";
import {
  fetchInflationExplainer,
  InflationExplainerResponse,
  AttributionFactor,
  CorridorAttribution,
} from "../../lib/api";
import {
  HelpCircle,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  Compass,
} from "lucide-react";

export default function ExplainerWaterfall() {
  const [data, setData] = useState<InflationExplainerResponse | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCorridor, setSelectedCorridor] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchInflationExplainer("live", periodDays, selectedCorridor || undefined).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [periodDays, selectedCorridor]);

  const categoryColors: Record<string, string> = {
    ROUTE_WEIGHT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    HORIZON_SPREAD: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    CARRIER_YIELD: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    SEASONALITY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    ABNORMAL_OUTLIER: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">WHY DID AIRFARE CHANGE?</h2>
              <p className="text-xs text-slate-400">
                Statistical Inflation Attribution & Contribution Waterfall Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[1, 7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setPeriodDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  periodDays === d
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                }`}
              >
                {d === 1 ? "24h" : d === 365 ? "1y" : `${d}d`}
              </button>
            ))}
          </div>
        </div>

        {/* Top KPI row */}
        {loading || !data ? (
          <div className="h-32 flex items-center justify-center text-slate-500 font-mono text-sm animate-pulse">
            Computing macroeconomic attribution waterfall...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Current Airfare CPI</span>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {data.headline_cpi.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500">Base 2024 = 100.0</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Movement vs Baseline</span>
              <div
                className={`text-3xl font-black font-mono mt-1 ${
                  data.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {data.change_pct >= 0 ? `+${data.change_pct}%` : `${data.change_pct}%`}
              </div>
              <span className="text-[10px] text-slate-500">
                {data.headline_cpi - data.previous_cpi >= 0 ? "+" : ""}
                {(data.headline_cpi - data.previous_cpi).toFixed(2)} Index Points
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Primary Driver</span>
              <div className="text-base font-bold text-blue-400 mt-1 truncate">
                {data.primary_drivers[0]?.factor_name || "Trunk Corridor Pressure"}
              </div>
              <span className="text-[10px] text-slate-500">
                Accounts for {data.primary_drivers[0]?.contribution_pct}% of shift
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Analysis Period</span>
              <div className="text-base font-bold text-emerald-400 mt-1">
                {data.period_label.toUpperCase()}
              </div>
              <span className="text-[10px] text-slate-500">{data.calculation_date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Attribution Factor Waterfall Bars */}
      {data && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              FACTOR DECOMPOSITION WATERFALL (% CONTRIBUTION)
            </h3>
            <span className="text-xs font-mono text-slate-500">Sum = 100.0%</span>
          </div>

          <div className="space-y-3">
            {data.primary_drivers.map((factor, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${categoryColors[factor.category] || "text-slate-400"}`}>
                      {factor.category}
                    </span>
                    <strong className="text-sm text-slate-800 dark:text-slate-200">
                      {factor.factor_name}
                    </strong>
                    {factor.is_estimated && (
                      <span className="text-[10px] text-slate-400 font-mono italic">
                        (Potential Contributor)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                      {factor.contribution_pct}%
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({factor.magnitude_pts > 0 ? "+" : ""}{factor.magnitude_pts} pts)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${factor.contribution_pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corridor-Level Drill-Down Attribution Table */}
      {data && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-500" />
                CORRIDOR-LEVEL INFLATION ATTRIBUTION
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                High-volume corridors driving national composite index movements
              </p>
            </div>
            {selectedCorridor && (
              <button
                onClick={() => setSelectedCorridor("")}
                className="text-xs text-blue-500 underline font-mono"
              >
                Clear Corridor Filter ({selectedCorridor})
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Corridor</th>
                  <th className="py-2.5 px-3">DGCA Weight</th>
                  <th className="py-2.5 px-3">Route CPI</th>
                  <th className="py-2.5 px-3">Contribution to National %</th>
                  <th className="py-2.5 px-3">Primary Driver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.corridor_contributions.map((c, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedCorridor(c.corridor)}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{c.origin}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span>{c.destination}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{c.dgca_weight}%</td>
                    <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">{c.route_cpi}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {c.contribution_to_national_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{c.primary_driver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
