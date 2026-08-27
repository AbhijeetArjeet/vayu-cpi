"use client";

import React from "react";
import AnimatedNumber from "./AnimatedNumber";
import { useVayuTheme } from "./ThemeContext";
import { ShieldAlert, Database, Activity, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { NationalCompositeCPI, SurgeAlert } from "../lib/api";

interface HeroMarketPulseProps {
  cpiData: NationalCompositeCPI | null;
  alerts: SurgeAlert[];
  observationCount?: number;
}

export default function HeroMarketPulse({
  cpiData,
  alerts,
  observationCount = 0,
}: HeroMarketPulseProps) {
  const { selectedCorridor, setSelectedCorridor, demoMode } = useVayuTheme();

  // Production Values derived from backend API / CPI calculation engine
  const hasLiveObs = Boolean(cpiData && cpiData.tracked_corridors > 0);
  const compositeVal = demoMode ? 161.78 : (cpiData?.composite_index ?? 100.0);
  const advanceVal = demoMode ? 145.20 : (cpiData?.advance_sub_index ?? 100.0);
  const spotVal = demoMode ? 182.40 : (cpiData?.spot_sub_index ?? 100.0);
  const coveragePct = demoMode ? 91.0 : (cpiData?.dgca_traffic_coverage_pct ?? 0.0);
  const activeAlertsCnt = alerts.length;
  const trackedCorridorsCnt = cpiData?.tracked_corridors ?? 0;

  // Calculate 30D Change from Base (100)
  const cpiDeltaPct = Number((((compositeVal - 100) / 100) * 100).toFixed(1));


  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 p-6 md:p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

      <div className="relative z-10 space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🇮🇳</span>
            <div>
              <h2 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
                INDIAN AIRFARE MARKET PULSE
                {demoMode && (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                    DEMO SIMULATION
                  </span>
                )}
                {selectedCorridor && (
                  <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                    FILTERED: {selectedCorridor}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Official MoSPI Macroeconomic Inflation Engine & DGCA Anomaly Matrix (Base 2024 = 100)
              </p>
            </div>
          </div>

          {selectedCorridor && (
            <button
              onClick={() => setSelectedCorridor(null)}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono underline"
            >
              Reset Corridor Filter
            </button>
          )}
        </div>

        {/* Main Stats Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main CPI Gauge */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
              National Airfare CPI
            </span>
            <div className="flex items-baseline gap-3">
              <AnimatedNumber
                value={compositeVal}
                decimals={2}
                className="text-4xl md:text-5xl font-black tracking-tight text-white font-mono"
              />
              {!hasLiveObs && !demoMode ? (
                <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/20">
                  <span>BASELINE / NO LIVE DATA</span>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full border ${
                    cpiDeltaPct >= 0
                      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  }`}
                >
                  {cpiDeltaPct >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span>
                    {cpiDeltaPct >= 0 ? `+${cpiDeltaPct}%` : `${cpiDeltaPct}%`} vs 2024 Base
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Weighted Geometric Jevons Index across {trackedCorridorsCnt} Primary Trunk Corridors
            </p>
          </div>

          {/* Sub-Indexes (Advance T-30 vs Tatkal T-1) */}
          <div className="grid grid-cols-2 gap-4 border-l border-r border-slate-800/80 px-0 md:px-6 py-2">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Advance Sub-Index (T-30)
              </span>
              <div className="text-xl font-bold font-mono text-purple-400">
                <AnimatedNumber value={advanceVal} decimals={2} />
              </div>
              <span className="text-[10px] text-slate-500">Planning Horizon (35% Weight)</span>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Spot Sub-Index (T-1)
              </span>
              <div className="text-xl font-bold font-mono text-cyan-400">
                <AnimatedNumber value={spotVal} decimals={2} />
              </div>
              <span className="text-[10px] text-slate-500">Immediate Spot Fare (20% Weight)</span>
            </div>
          </div>

          {/* Mini Sparkline Visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>30-DAY MARKET TREND</span>
              <span className={activeAlertsCnt > 0 ? "text-rose-400" : "text-emerald-400"}>
                {activeAlertsCnt > 0 ? `${activeAlertsCnt} SURGE ALERTS` : "MARKET STABLE"}
              </span>
            </div>
            <div className="h-12 w-full flex items-end gap-1.5 pt-2">
              {[40, 45, 42, 55, 60, 58, 65, 70, 68, 75, 82, 88, 84, 92, 95, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-600/30 to-blue-400 rounded-t transition-all hover:bg-blue-400"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry Pills Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />
            <span>
              <strong className="text-rose-400">{activeAlertsCnt}</strong> ACTIVE SURGE ALERTS
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <Database className="h-4 w-4 text-blue-400" />
            <span>
              <strong className="text-white">{observationCount}</strong> FARES INGESTED
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>
              COVERAGE: <strong className="text-emerald-400">{coveragePct}%</strong> PASSENGERS
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            <span>GEOMETRIC JEVONS ENGINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
