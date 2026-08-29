"use client";

import React from "react";
import IndexTraceTreeViewer from "../../components/intelligence/IndexTraceTree";

export default function ProvenancePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 uppercase font-bold">
          <span>VAYU Statistical Integrity</span>
          <span>/</span>
          <span>Data Confidence & Audit Tree</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Index Confidence & Complete Provenance
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Trace every published index point down to regional, corridor, carrier, and raw unbundled scraped fare quotes.
        </p>
      </div>

      <IndexTraceTreeViewer />
    </main>
  );
}
