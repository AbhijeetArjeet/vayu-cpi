"use client";

import React from "react";
import { Grid, ShieldAlert } from "lucide-react";
import { RouteJevonsIndex } from "../lib/api";

interface FarePressureMatrixProps {
  routes: RouteJevonsIndex[];
  onSelectCorridor: (corridor: string) => void;
}

export default function FarePressureMatrix({ routes, onSelectCorridor }: FarePressureMatrixProps) {
  // Classify routes into 4 quadrants
  const stable: string[] = [];
  const watch: string[] = [];
  const elevated: string[] = [];
  const critical: string[] = [];

  routes.forEach((r) => {
    const code = `${r.origin}-${r.destination}`;
    const highIndex = r.jevons_index >= 135;
    const highVol = r.horizon_days === 1 || r.jevons_index >= 145;

    if (highIndex && highVol) critical.push(code);
    else if (highIndex && !highVol) elevated.push(code);
    else if (!highIndex && highVol) watch.push(code);
    else stable.push(code);
  });

  return (
    <div className="glass-panel p-6 space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-indigo-500" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
            REGULATORY FARE PRESSURE MATRIX (2x2 RISK QUADRANTS)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">DGCA Risk Framework</span>
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
        {/* Quadrant 1: Watch (High Vol, Low Index) */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex justify-between items-center font-bold text-amber-500">
            <span>🟡 WATCH (HIGH VOLATILITY, LOW INDEX)</span>
            <span>{watch.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {watch.length > 0 ? (
              watch.map((c) => (
                <span
                  key={c}
                  onClick={() => onSelectCorridor(c)}
                  className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer font-bold"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-[10px]">None</span>
            )}
          </div>
        </div>

        {/* Quadrant 2: Critical (High Vol, High Index) */}
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
          <div className="flex justify-between items-center font-bold text-rose-500">
            <span>🔴 CRITICAL (HIGH VOLATILITY, HIGH INDEX)</span>
            <span>{critical.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {critical.length > 0 ? (
              critical.map((c) => (
                <span
                  key={c}
                  onClick={() => onSelectCorridor(c)}
                  className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-pointer font-bold animate-pulse"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-[10px]">None</span>
            )}
          </div>
        </div>

        {/* Quadrant 3: Stable (Low Vol, Low Index) */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex justify-between items-center font-bold text-emerald-500">
            <span>🟢 STABLE (LOW VOLATILITY, LOW INDEX)</span>
            <span>{stable.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stable.length > 0 ? (
              stable.map((c) => (
                <span
                  key={c}
                  onClick={() => onSelectCorridor(c)}
                  className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-pointer font-bold"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-[10px]">None</span>
            )}
          </div>
        </div>

        {/* Quadrant 4: Elevated (Low Vol, High Index) */}
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
          <div className="flex justify-between items-center font-bold text-orange-500">
            <span>🟠 ELEVATED (LOW VOLATILITY, HIGH INDEX)</span>
            <span>{elevated.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {elevated.length > 0 ? (
              elevated.map((c) => (
                <span
                  key={c}
                  onClick={() => onSelectCorridor(c)}
                  className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 cursor-pointer font-bold"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-[10px]">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
