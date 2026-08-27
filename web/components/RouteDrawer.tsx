"use client";

import React from "react";
import { X, Plane, ShieldAlert, BarChart2, ShoppingBag, PieChart, Clock, Layers, ChevronRight } from "lucide-react";
import { calculateDecomposedStress, calculateBookingDecision } from "../lib/analytics";
import AnimatedNumber from "./AnimatedNumber";

interface RouteDrawerProps {
  corridor: string | null;
  onClose: () => void;
}

export default function RouteDrawer({ corridor, onClose }: RouteDrawerProps) {
  if (!corridor) return null;

  const [origin, dest] = corridor.split("-");
  
  // Sample route metadata
  const currentFare = 6074;
  const baseFare = 4200;
  const jevonsIndex = 144.6;
  const sigmaDev = 3.5;
  const hhi = 1850;

  const stress = calculateDecomposedStress(jevonsIndex, sigmaDev, hhi, 18);
  const recommendation = calculateBookingDecision(jevonsIndex, 57);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/30">
              <Plane className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {origin} → {dest} INTELLIGENCE
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Official DGCA Trunk Corridor Analytics
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Key Metrics */}
        <div className="grid grid-cols-2 gap-4 font-mono">
          <div className="glass-panel p-4">
            <span className="text-[11px] text-slate-400 uppercase">Spot Fare</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              <AnimatedNumber value={currentFare} prefix="₹" />
            </div>
            <span className="text-[10px] text-slate-500">Base: ₹{baseFare.toLocaleString()}</span>
          </div>

          <div className="glass-panel p-4">
            <span className="text-[11px] text-slate-400 uppercase">Jevons Index</span>
            <div className="text-2xl font-black text-blue-500">
              <AnimatedNumber value={jevonsIndex} decimals={1} />
            </div>
            <span className="text-[10px] text-slate-500">Base 2024 = 100</span>
          </div>
        </div>

        {/* Explainable Stress Score Decomposition */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-xs font-mono text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> STRESS SCORE DECOMPOSITION
            </span>
            <span className="text-xs font-mono font-bold text-rose-500">
              {stress.totalScore} / 100 ({stress.category})
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {Object.entries(stress.components).map(([key, comp]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{comp.label}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {comp.score} / {comp.max}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(comp.score / comp.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Book Now Decision Recommendation */}
        <div className="glass-panel p-5 space-y-3 border-amber-500/30 bg-gradient-to-br from-slate-900 to-blue-950 text-white font-mono">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" /> BOOKING DECISION RULE
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
              CONFIDENCE: {recommendation.confidence}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">RECOMMENDED ACTION</span>
              <div className="text-2xl font-black text-amber-400">{recommendation.action}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">7-Day Change</span>
              <div className="text-lg font-bold text-rose-400">+{recommendation.expectedChangePct}%</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 pt-2 border-t border-slate-800">
            {recommendation.rationale}
          </p>
        </div>

        {/* Ancillary Fee Breakdown */}
        <div className="glass-panel p-5 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-blue-500" /> ANCILLARY FEE BREAKDOWN
            </span>
            <span className="text-slate-400 text-[10px]">DGCA Mandatory</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Airfare:</span>
              <span className="font-bold text-slate-900 dark:text-white">₹4,524 (74%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Surcharge (YQ):</span>
              <span className="text-amber-500 font-bold">₹600 (10%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Airport User Development Fee (UDF):</span>
              <span className="text-emerald-500 font-bold">₹650 (11%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Convenience Fee:</span>
              <span className="text-purple-400 font-bold">₹300 (5%)</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] font-mono text-slate-400 text-center pt-2">
          Data Freshness: Scraped 12 mins ago • Source: Google Flights Live Feed
        </div>
      </div>
    </div>
  );
}
