"use client";

import React from "react";
import { BookOpen, CheckCircle2, Shield, BarChart2, Info, AlertTriangle, Layers } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            VAYU-CPI ECONOMETRIC METHODOLOGY & SYSTEM TRANSPARENCY
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
          Official Econometric & Regulatory Framework for National Airfare Price Indexing
        </p>
      </div>

      {/* 1. Core Econometric Formulas */}
      <div className="glass-panel p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-blue-500" />
          1. JEVONS GEOMETRIC MEAN INDEX FORMULA
        </h2>

        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-3">
          <p className="text-slate-600 dark:text-slate-300">
            Per International Labour Organization (ILO) and Consumer Price Index (CPI) manual guidelines, unweighted elementary aggregate micro-indexes use the unweighted <strong>Jevons Geometric Mean Formula</strong> to eliminate substitution bias:
          </p>
          <div className="p-3 rounded bg-slate-950 text-blue-400 text-sm font-bold text-center border border-blue-500/30">
            J = ( Π [ p(i,t) / p(i,0) ] )^(1/n) × 100
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
            <li><strong>p_{"i,t"}</strong>: Observed total ticket fare for flight offer <i>i</i> at current calculation date <i>t</i></li>
            <li><strong>p_{"i,0"}</strong>: Pre-seeded 2024 reference base period fare for route <i>r</i> and horizon <i>h</i></li>
            <li><strong>n</strong>: Total sample size of observed flight offers</li>
          </ul>
        </div>
      </div>

      {/* 2. DGCA Route Weights & Horizons */}
      <div className="glass-panel p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          2. DGCA ROUTE WEIGHTS & ADVANCE HORIZON ALPHA
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-blue-500">Route Passenger Volume Weights (w_r):</span>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
              <li>• DEL → BOM: 26% (High Traffic Trunk)</li>
              <li>• BOM → DEL: 24% (High Traffic Trunk)</li>
              <li>• BLR → DEL: 20% (IT & Business Corridor)</li>
              <li>• DEL → CCU: 14% (East Coast Trunk)</li>
              <li>• DEL → PAT: 9% (High Seasonal Demand)</li>
              <li>• BOM → GOI: 7% (Leisure Corridor)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-purple-400">Horizon Advance Weights (α_h):</span>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
              <li>• T-30 (Advance Planning): 35% Weight</li>
              <li>• T-7 (Mid-Horizon): 45% Weight</li>
              <li>• T-1 (Tatkal / Immediate): 20% Weight</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Transparent Limitations */}
      <div className="glass-panel p-6 space-y-4 border-amber-500/30">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="font-bold text-slate-900 dark:text-white text-sm tracking-wide font-mono">
            3. SYSTEM LIMITATIONS & METHODOLOGY TRANSPARENCY
          </h2>
        </div>

        <div className="space-y-3 font-mono text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
            <strong className="text-amber-400">1. Regional Offer Format Variations:</strong>
            <p className="text-[11px] text-slate-400">
              Regional routes (such as DEL-PAT) occasionally return Google Flights HTML layouts without unbundled ancillary price breakdown arrays. These cases are classified as <code>NO_DATA</code> rather than system failures.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
            <strong className="text-blue-400">2. Trend Projection vs Trained ML Forecast:</strong>
            <p className="text-[11px] text-slate-400">
              Future fare recommendations are derived from deterministic horizon differentials and linear trend projections. They are not trained machine-learning forecasts until multi-year historical series depth is accumulated.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <strong className="text-emerald-400">3. Non-Stop Economy Scope:</strong>
            <p className="text-[11px] text-slate-400">
              Observed fares cover direct, non-stop economy class single-adult tickets in Indian Rupees (INR) to ensure uniform base comparisons across carriers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
