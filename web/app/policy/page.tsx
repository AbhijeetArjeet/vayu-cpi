"use client";

import React from "react";
import WhatIfSimulator from "../../components/intelligence/WhatIfSimulator";

export default function PolicyPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-500 uppercase font-bold">
          <span>VAYU Macroeconomic Research</span>
          <span>/</span>
          <span>Policy Lab & Simulation Sandbox</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          What-If CPI Simulator & Index Lab
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Model hypothetical macroeconomic shocks (demand, capacity, ATF fuel prices) and experiment with econometric weighting schemes.
        </p>
      </div>

      <WhatIfSimulator />
    </main>
  );
}
