"use client";

import React, { useState } from "react";
import { calculateFairFare, FairFareResponse } from "../../lib/api";
import {
  Calculator,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Percent,
  Sparkles,
} from "lucide-react";

export default function FairFareCalculator() {
  const [origin, setOrigin] = useState<string>("DEL");
  const [destination, setDestination] = useState<string>("BOM");
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [carrier, setCarrier] = useState<string>("");
  const [currentFare, setCurrentFare] = useState<string>("7500");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<FairFareResponse | null>(null);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fareNum = parseFloat(currentFare) || undefined;
    const res = await calculateFairFare({
      origin,
      destination,
      horizon_days: horizonDays,
      carrier: carrier || undefined,
      current_fare: fareNum,
    });
    setResult(res);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNUSUALLY_CHEAP":
        return {
          label: "🟢 UNUSUALLY CHEAP (GREAT DEAL)",
          color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
          icon: TrendingDown,
        };
      case "FAIR_NORMAL":
        return {
          label: "🟢 FAIR / NORMAL PRICE",
          color: "bg-blue-500/20 text-blue-500 border-blue-500/30",
          icon: CheckCircle2,
        };
      case "ELEVATED":
        return {
          label: "🟡 ELEVATED TARIFF",
          color: "bg-amber-500/20 text-amber-500 border-amber-500/30",
          icon: AlertCircle,
        };
      case "UNUSUALLY_EXPENSIVE":
        return {
          label: "🔴 UNUSUALLY EXPENSIVE (SURGE)",
          color: "bg-rose-500/20 text-rose-500 border-rose-500/30",
          icon: TrendingUp,
        };
      default:
        return {
          label: "⚪ INSUFFICIENT DATA",
          color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
          icon: HelpCircle,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Form */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 text-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">VAYU FAIR FARE / EXPECTED FARE ENGINE</h2>
            <p className="text-xs text-slate-400">
              "Is This Airfare Normal?" — Real-time empirical percentile benchmark evaluation
            </p>
          </div>
        </div>

        <form onSubmit={handleEvaluate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase">Origin (IATA)</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              maxLength={3}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase">Destination (IATA)</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              maxLength={3}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase">Booking Window</label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(parseInt(e.target.value))}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={1}>T+1 (Tatkal / Spot)</option>
              <option value={7}>T+7 (1 Week Advance)</option>
              <option value={15}>T+15 (2 Weeks Advance)</option>
              <option value={30}>T+30 (1 Month Advance)</option>
              <option value={45}>T+45 (Long Range)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase">Airline Filter (Optional)</label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. IndiGo"
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase">Current Quote (INR)</label>
            <input
              type="number"
              value={currentFare}
              onChange={(e) => setCurrentFare(e.target.value)}
              placeholder="e.g. 7500"
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[42px] bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30"
            >
              {loading ? "Evaluating..." : "Evaluate Fare"}
            </button>
          </div>
        </form>
      </div>

      {/* Results Display */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          {/* Status Badge & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-slate-400">CORRIDOR EVALUATION: {result.corridor} ({result.booking_window})</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                Observed Fare: ₹{result.current_fare?.toLocaleString() || "N/A"}
              </h3>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border ${getStatusBadge(result.fare_status).color}`}>
              {getStatusBadge(result.fare_status).label}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Expected Fair Fare</span>
              <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                ₹{result.expected_fare.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Median Empirical Price</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Difference vs Fair Fare</span>
              <div className={`text-2xl font-black font-mono mt-1 ${
                (result.difference_pct || 0) > 0 ? "text-rose-500" : "text-emerald-500"
              }`}>
                {result.difference_pct != null ? `${result.difference_pct > 0 ? "+" : ""}${result.difference_pct}%` : "N/A"}
              </div>
              <span className="text-[10px] text-slate-500">Premium / Discount</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Historical Percentile</span>
              <div className="text-2xl font-black font-mono text-amber-500 mt-1">
                {result.percentile_rank != null ? `${result.percentile_rank}th` : "N/A"}
              </div>
              <span className="text-[10px] text-slate-500">% of fares cheaper than this</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Data Confidence</span>
              <div className="text-2xl font-black font-mono text-emerald-500 mt-1">
                {result.confidence_pct}%
              </div>
              <span className="text-[10px] text-slate-500">{result.observations_analyzed} quotes analyzed</span>
            </div>
          </div>

          {/* Distribution Percentiles Slider */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
              EMPIRICAL FARE DISTRIBUTION BANDS (INR)
            </span>
            <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-slate-400 block">10th Pct</span>
                <strong className="text-emerald-500">₹{result.distribution.p10.toLocaleString()}</strong>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] text-slate-400 block">25th Pct</span>
                <strong className="text-blue-500">₹{result.distribution.p25.toLocaleString()}</strong>
              </div>
              <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                <span className="text-[10px] text-indigo-400 block">Median (50th)</span>
                <strong className="text-indigo-400">₹{result.distribution.median.toLocaleString()}</strong>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-slate-400 block">75th Pct</span>
                <strong className="text-amber-500">₹{result.distribution.p75.toLocaleString()}</strong>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] text-slate-400 block">90th Pct</span>
                <strong className="text-rose-500">₹{result.distribution.p90.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            💡 {result.assessment_notes}
          </p>
        </div>
      )}
    </div>
  );
}
