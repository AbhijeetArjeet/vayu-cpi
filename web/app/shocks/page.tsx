"use client";

import React from "react";
import ShockBadgeGrid from "../../components/intelligence/ShockBadgeGrid";

export default function ShocksPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-rose-500 uppercase font-bold">
          <span>VAYU Surveillance</span>
          <span>/</span>
          <span>Anomaly & Shock Matrix</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          National Airfare Shock Detector
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Automated 3-sigma standard deviation anomaly detector flagging tariff spikes, carrier dominance surges, and severe price shocks across Indian airspace.
        </p>
      </div>

      <ShockBadgeGrid />
    </main>
  );
}
