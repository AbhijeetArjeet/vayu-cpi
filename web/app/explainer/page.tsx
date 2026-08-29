"use client";

import React from "react";
import ExplainerWaterfall from "../../components/intelligence/ExplainerWaterfall";
import FareDNACard from "../../components/intelligence/FareDNACard";

export default function ExplainerPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb / Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-500 uppercase font-bold">
          <span>VAYU Statistical Intelligence</span>
          <span>/</span>
          <span>Attribution Engine</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Why Did Airfare Move?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Decomposes national airfare inflation into mathematical constituent drivers — route pressure, booking horizon spreads, dynamic yield management, and calendar seasonality.
        </p>
      </div>

      {/* Main Explainer Waterfall */}
      <ExplainerWaterfall />

      {/* Sample Fare DNA Route Fingerprints */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Key Corridor Microstructure Profiles (Fare DNA)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FareDNACard origin="DEL" destination="BOM" />
          <FareDNACard origin="BLR" destination="DEL" />
        </div>
      </div>
    </main>
  );
}
