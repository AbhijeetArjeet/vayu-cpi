"use client";

import React from "react";
import FairFareCalculator from "../../components/intelligence/FairFareCalculator";
import SourceConsensusCard from "../../components/intelligence/SourceConsensusCard";

export default function FairFarePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-500 uppercase font-bold">
          <span>VAYU Consumer & Regulatory Intelligence</span>
          <span>/</span>
          <span>Benchmark Valuation</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Is This Airfare Normal? (Fair Fare Engine)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Compare any observed flight price against empirical 10th to 90th percentile distributions across advance booking horizons.
        </p>
      </div>

      <FairFareCalculator />

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Cross-Portal Source Consensus & Price Convergence
        </h2>
        <SourceConsensusCard origin="DEL" destination="BOM" horizonDays={7} />
      </div>
    </main>
  );
}
