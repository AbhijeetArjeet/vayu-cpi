"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Database, ShieldCheck, Clock, Activity } from "lucide-react";
import { DataMode } from "../lib/api";

interface DataModeSelectorProps {
  currentMode: DataMode;
  onModeChange: (mode: DataMode) => void;
  observationCount?: number;
  lastUpdated?: string;
  sourceLabel?: string;
}

export default function DataModeSelector({
  currentMode,
  onModeChange,
  observationCount = 538,
  lastUpdated = "Just now",
  sourceLabel = "LIVE OBSERVATIONS ONLY",
}: DataModeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelectMode = (mode: DataMode) => {
    onModeChange(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="glass-panel p-4 mb-6 border-l-4 border-l-blue-500 bg-slate-900/80 text-white shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Badge */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-200">
              GLOBAL DATA ANALYSIS MODE
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wide border ${
                currentMode === "live"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : currentMode === "historical"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                  : "bg-purple-500/20 text-purple-400 border-purple-500/40"
              }`}
            >
              ● {sourceLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Recalculates National CPI, route indices, stress scores, and forecasts according to selected dataset context.
          </p>
        </div>

        {/* Radio Mode Selector Pills */}
        <div className="flex items-center bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => handleSelectMode("live")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              currentMode === "live"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${currentMode === "live" ? "bg-emerald-300 animate-ping" : "bg-slate-500"}`} />
            LIVE ONLY
          </button>

          <button
            onClick={() => handleSelectMode("historical")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              currentMode === "historical"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${currentMode === "historical" ? "bg-blue-300" : "bg-slate-500"}`} />
            HISTORICAL ONLY
          </button>

          <button
            onClick={() => handleSelectMode("combined")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
              currentMode === "combined"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${currentMode === "combined" ? "bg-purple-300" : "bg-slate-500"}`} />
            LIVE + HISTORICAL
          </button>
        </div>
      </div>

      {/* Metadata Metrics Row */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Active Observations:</span>
            <strong className="text-white">{observationCount.toLocaleString()}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>Freshness:</span>
            <strong className="text-white">{lastUpdated}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            <span>Traceability:</span>
            <strong className="text-slate-200">Full Provenance Audit Trail</strong>
          </span>
        </div>

        <div className="text-[10px] text-slate-500">
          {currentMode === "live" && "Calculated strictly from live scraped flight observations."}
          {currentMode === "historical" && "Calculated strictly from imported historical datasets & DGCA benchmarks."}
          {currentMode === "combined" && "Normalized baseline context combined with live market observations."}
        </div>
      </div>
    </div>
  );
}
