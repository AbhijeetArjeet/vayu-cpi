"use client";

import React from "react";
import { HelpCircle, AlertTriangle, Scale, Activity, BarChart2 } from "lucide-react";

interface WhyIsThisHappeningProps {
  corridor?: string;
  sigmaDeviation?: number;
  hhiScore?: number;
}

export default function WhyIsThisHappening({
  corridor = "DEL-BOM",
  sigmaDeviation = 3.5,
  hhiScore = 1850,
}: WhyIsThisHappeningProps) {
  const drivers = [
    { name: "Price Deviation vs 30D Baseline", pct: Math.min(Math.round(sigmaDeviation * 18), 95), color: "bg-rose-500" },
    { name: "Spot Booking Demand Pressure (T+1)", pct: 68, color: "bg-amber-500" },
    { name: "Airfare Volatility Index", pct: 45, color: "bg-blue-500" },
    { name: "Airline Concentration (HHI)", pct: Math.min(Math.round((hhiScore / 2500) * 100), 100), color: "bg-indigo-500" },
  ];

  return (
    <div className="glass-panel p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
            WHY IS {corridor} UNDER AIRFARE PRESSURE?
          </h3>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded">
          ECONOMETRIC ANALYSIS
        </span>
      </div>

      {/* Driver Progress Bars */}
      <div className="space-y-4">
        {drivers.map((d, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{d.name}</span>
              <span className="font-bold text-slate-900 dark:text-white">{d.pct}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${d.color} transition-all duration-700 ease-out rounded-full`}
                style={{ width: `${d.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Natural Language Insights Box */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-300 font-mono">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
          <Activity className="h-4 w-4 text-blue-500" />
          <span>KEY POLICY INSIGHTS FOR REGULATOR</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <li>
            Spot fare on {corridor} is currently <strong className="text-rose-400">{sigmaDeviation}σ</strong> above 30-day baseline, indicating acute short-horizon price surge.
          </li>
          <li>
            Market HHI index stands at <strong className="text-amber-400">{hhiScore}</strong>, signaling moderate carrier concentration (IndiGo & Air India control over 80% capacity).
          </li>
          <li>
            Fuel surcharge & non-unbundled airport fees contribute ₹1,550 (~25%) of total ticket cost.
          </li>
        </ul>
      </div>
    </div>
  );
}
