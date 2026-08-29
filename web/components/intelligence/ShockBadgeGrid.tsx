"use client";

import React, { useState, useEffect } from "react";
import {
  fetchAirfareShocks,
  fetchShockSummary,
  AirfareShockItem,
  AirfareShockSummary,
} from "../../lib/api";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function ShockBadgeGrid() {
  const [shocks, setShocks] = useState<AirfareShockItem[]>([]);
  const [summary, setSummary] = useState<AirfareShockSummary | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetchAirfareShocks("combined", "NORMAL", 50),
      fetchShockSummary("combined"),
    ]).then(([shocksRes, sumRes]) => {
      if (isMounted) {
        setShocks(shocksRes);
        setSummary(sumRes);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const severityBadge = (sev: string) => {
    switch (sev) {
      case "SHOCK":
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 animate-pulse" />
            🔴 CRITICAL SHOCK
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            🟠 HIGH SURGE
          </span>
        );
      case "ELEVATED":
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" />
            🟡 ELEVATED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            🟢 NORMAL
          </span>
        );
    }
  };

  const filteredShocks = shocks.filter((s) => {
    if (filterSeverity === "ALL") return true;
    return s.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Summary KPI Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/30 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">NATIONAL AIRFARE SHOCK DETECTOR</h2>
              <p className="text-xs text-slate-400">
                Automated 3-Sigma Anomaly Scanner & Anti-Surge Surveillance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {["ALL", "SHOCK", "HIGH", "ELEVATED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  filterSeverity === s
                    ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Active Shock Events</span>
              <div className="text-3xl font-black font-mono text-rose-400 mt-1">
                {summary.total_active_shocks}
              </div>
              <span className="text-[10px] text-slate-500">Across domestic network</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Critical Shocks (z ≥ 4.0)</span>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {summary.critical_shocks_count}
              </div>
              <span className="text-[10px] text-rose-500">Urgent regulatory review</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Affected Corridors</span>
              <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                {summary.affected_corridors_count}
              </div>
              <span className="text-[10px] text-slate-500">City-pairs impacted</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Most Volatile Corridor</span>
              <div className="text-xl font-bold font-mono text-blue-400 mt-2 truncate">
                {summary.most_volatile_corridor}
              </div>
              <span className="text-[10px] text-slate-500">Peak deviation cluster</span>
            </div>
          </div>
        )}
      </div>

      {/* Shocks Grid */}
      {loading ? (
        <div className="h-40 flex items-center justify-center text-slate-500 font-mono text-sm animate-pulse">
          Scanning 3-sigma airfare deviations across domestic corridors...
        </div>
      ) : filteredShocks.length === 0 ? (
        <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No Anomalies Matching Filter</h3>
          <p className="text-xs text-slate-500">Airfares across monitored corridors are trading within normal empirical boundaries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShocks.map((s) => (
            <div
              key={s.id}
              className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all space-y-3 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono font-bold text-base text-slate-900 dark:text-white">
                  <span>{s.origin}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span>{s.destination}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                    {s.booking_window}
                  </span>
                </div>
                {severityBadge(s.severity)}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Observed Fare:</span>
                  <span className="font-black text-rose-500 text-sm">₹{s.current_fare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Normal Band:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    ₹{s.expected_range_low.toLocaleString()} – ₹{s.expected_range_high.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Deviation & Sigma:</span>
                  <span className="font-bold text-amber-500">
                    {s.deviation_pct >= 0 ? `+${s.deviation_pct}%` : `${s.deviation_pct}%`} (z = {s.z_score})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  Active {s.duration_hours}h
                </span>
                <span className="font-mono text-emerald-500 font-semibold">
                  {s.confidence_pct}% Confidence
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {s.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
