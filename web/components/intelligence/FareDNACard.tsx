"use client";

import React, { useState, useEffect } from "react";
import { fetchFareDNA, FareDNAProfile } from "../../lib/api";
import { Dna, Activity, ShieldCheck, Flame, PieChart, ArrowRight } from "lucide-react";

export default function FareDNACard({
  origin = "DEL",
  destination = "BOM",
}: {
  origin?: string;
  destination?: string;
}) {
  const [profile, setProfile] = useState<FareDNAProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchFareDNA(origin, destination).then((res) => {
      if (isMounted) {
        setProfile(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [origin, destination]);

  if (loading || !profile) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse text-center font-mono text-xs text-slate-500">
        Sequencing VAYU Fare DNA profile for {origin}-{destination}...
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Dna className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              VAYU FARE DNA PROFILE: {profile.corridor}
            </h3>
            <p className="text-xs text-slate-500">Route micro-structure & dynamic yield fingerprint</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-500/20 text-purple-500 border border-purple-500/30">
          PROPRIETARY METRIC
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Fare Volatility</span>
          <div className="text-xl font-bold text-purple-500 mt-0.5">
            {profile.volatility_score} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Demand Pressure</span>
          <div className="text-xl font-bold text-blue-500 mt-0.5">
            {profile.demand_pressure_score} <span className="text-xs text-slate-400 font-normal">/ 10</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Booking Sensitivity</span>
          <div className="text-sm font-bold text-amber-500 mt-1">{profile.booking_sensitivity}</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Source Consensus</span>
          <div className="text-xl font-bold text-emerald-500 mt-0.5">{profile.source_agreement_pct}%</div>
        </div>
      </div>

      {/* Market Structure Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">Carrier Concentration</span>
          <div className="text-slate-800 dark:text-slate-200 font-bold">
            Dominant: {profile.dominant_carrier}
          </div>
          <span className="text-[10px] text-slate-500">HHI Index: {profile.hhi_carrier_concentration}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">Observed Fare Range</span>
          <div className="text-slate-800 dark:text-slate-200 font-bold">{profile.fare_range}</div>
          <span className="text-[10px] text-slate-500">Median: ₹{profile.median_fare.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
