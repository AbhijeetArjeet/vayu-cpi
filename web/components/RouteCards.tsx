"use client";

import React from "react";
import { useVayuTheme } from "./ThemeContext";
import AnimatedNumber from "./AnimatedNumber";
import { ArrowUpRight, ArrowDownRight, ShieldAlert, Plane, ChevronRight } from "lucide-react";
import { RouteJevonsIndex, SurgeAlert } from "../lib/api";

interface RouteCardsProps {
  routes: RouteJevonsIndex[];
  alerts: SurgeAlert[];
}

export default function RouteCards({ routes, alerts }: RouteCardsProps) {
  const { selectedCorridor, setSelectedCorridor } = useVayuTheme();

  const getCorridorAlert = (origin: string, dest: string) => {
    const code = `${origin}-${dest}`;
    return alerts.find((a) => a.corridor === code);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide flex items-center gap-2">
          <Plane className="h-4 w-4 text-blue-500" />
          TRACKED DOMESTIC AIRFARE CORRIDORS
        </h3>
        <span className="text-xs font-mono text-slate-400">
          Showing {routes.length || 6} Primary Corridors
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((r, idx) => {
          const corridorCode = `${r.origin}-${r.destination}`;
          const isSelected = selectedCorridor === corridorCode;
          const alert = getCorridorAlert(r.origin, r.destination);
          
          // Calculate stress score simulation (0 to 100)
          const stressScore = Math.min(Math.round(((r.jevons_index - 100) / 40) * 100 + 40), 95);
          const isSurge = alert || stressScore >= 70;

          return (
            <div
              key={idx}
              onClick={() => setSelectedCorridor(isSelected ? null : corridorCode)}
              className={`glass-panel p-5 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5 shadow-xl"
                  : "hover:border-blue-500/40 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              }`}
            >
              {/* Surge Glow Border Accent */}
              {isSurge && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />
              )}

              <div className="space-y-3">
                {/* Route Header & Alert Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono font-black text-lg text-slate-900 dark:text-white">
                    <span>{r.origin}</span>
                    <span className="text-slate-400 font-normal">→</span>
                    <span>{r.destination}</span>
                  </div>

                  {alert ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 rounded-full flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="h-3 w-3" />
                      {alert.severity} SURGE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full">
                      T-{r.horizon_days}
                    </span>
                  )}
                </div>

                {/* Main Fare & Index Row */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Spot Fare</span>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      <AnimatedNumber value={r.current_geom_mean} prefix="₹" />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Jevons Index</span>
                    <div className="text-lg font-bold font-mono text-blue-500">
                      <AnimatedNumber value={r.jevons_index} decimals={1} />
                    </div>
                  </div>
                </div>

                {/* Stress Score Bar Footer */}
                <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Airfare Stress Score:</span>
                    <span className={`font-bold ${stressScore >= 70 ? "text-rose-500" : "text-emerald-500"}`}>
                      {stressScore} / 100
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stressScore >= 70 ? "bg-rose-500" : stressScore >= 50 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${stressScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
