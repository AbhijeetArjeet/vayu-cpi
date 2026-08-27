"use client";

import React from "react";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { RouteJevonsIndex } from "../lib/api";

interface TopMoversProps {
  routes: RouteJevonsIndex[];
  onSelectCorridor: (corridor: string) => void;
}

export default function TopMovers({ routes, onSelectCorridor }: TopMoversProps) {
  // Sort routes by Jevons index descending (Rising) and ascending (Falling)
  const sorted = [...routes].sort((a, b) => b.jevons_index - a.jevons_index);
  const topRising = sorted.slice(0, 3);
  const topFalling = [...sorted].reverse().slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
      {/* Top Rising Routes */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-rose-500 font-bold text-xs font-mono">
          <TrendingUp className="h-4 w-4" />
          <span>TOP RISING AIRFARE CORRIDORS</span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {topRising.map((r, i) => {
            const deltaPct = Number((r.jevons_index - 100).toFixed(1));
            const code = `${r.origin}-${r.destination}`;
            return (
              <div
                key={i}
                onClick={() => onSelectCorridor(code)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">#{i + 1}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">₹{r.current_geom_mean.toLocaleString()}</span>
                  <span className="font-bold text-rose-500 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5" />+{deltaPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Falling / Stable Routes */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-emerald-500 font-bold text-xs font-mono">
          <TrendingDown className="h-4 w-4" />
          <span>MOST STABLE / FALLING CORRIDORS</span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {topFalling.map((r, i) => {
            const deltaPct = Number((r.jevons_index - 100).toFixed(1));
            const code = `${r.origin}-${r.destination}`;
            return (
              <div
                key={i}
                onClick={() => onSelectCorridor(code)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">#{i + 1}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">₹{r.current_geom_mean.toLocaleString()}</span>
                  <span className="font-bold text-emerald-500 flex items-center">
                    {deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
