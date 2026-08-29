"use client";

import React, { useState, useEffect } from "react";
import { fetchSourceConsensus, SourceConsensusReport } from "../../lib/api";
import { CheckCircle2, AlertTriangle, Layers, ArrowRight, ShieldCheck } from "lucide-react";

export default function SourceConsensusCard({
  origin = "DEL",
  destination = "BOM",
  horizonDays = 7,
}: {
  origin?: string;
  destination?: string;
  horizonDays?: number;
}) {
  const [report, setReport] = useState<SourceConsensusReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchSourceConsensus(origin, destination, horizonDays).then((res) => {
      if (isMounted) {
        setReport(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [origin, destination, horizonDays]);

  if (loading || !report) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse text-center font-mono text-xs text-slate-500">
        Evaluating multi-feed source consensus for {origin}-{destination}...
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              SOURCE CONSENSUS ENGINE: {report.corridor} ({report.booking_window})
            </h3>
            <p className="text-xs text-slate-500">Cross-portal price convergence & outlier exclusion</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block">Market Consensus</span>
            <span className="text-base font-black text-blue-500">
              ₹{report.market_consensus_fare.toLocaleString()}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
            {report.agreement_score_pct}% Agreement
          </span>
        </div>
      </div>

      {/* Multi-portal prices list */}
      <div className="space-y-2">
        {report.source_prices.map((sp, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 font-mono text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">{sp.portal}</span>
              <span className="text-[10px] text-slate-400">({sp.source_name})</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{sp.observed_fare.toLocaleString()}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  sp.status === "RETAINED"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : sp.status === "DOWNWEIGHTED"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                }`}
              >
                {sp.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
        ℹ️ {report.methodology_applied}
      </p>
    </div>
  );
}
