"use client";

import React, { useState, useEffect } from "react";
import {
  runWhatIfSimulation,
  runIndexLabExperiment,
  SimulationResponse,
  IndexLabResponse,
} from "../../lib/api";
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  FlaskConical,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function WhatIfSimulator() {
  const [activeTab, setActiveTab] = useState<"SIMULATOR" | "INDEX_LAB">("SIMULATOR");

  // Simulator state
  const [demandShock, setDemandShock] = useState<number>(15);
  const [capacityShock, setCapacityShock] = useState<number>(-8);
  const [fuelShock, setFuelShock] = useState<number>(20);
  const [seasonality, setSeasonality] = useState<number>(1.15);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Index Lab state
  const [methodology, setMethodology] = useState<"JEVONS" | "CARLI_DUTOT_ARITHMETIC">("JEVONS");
  const [weightingScheme, setWeightingScheme] = useState<"DGCA_TRAFFIC" | "EQUAL_WEIGHT">("DGCA_TRAFFIC");
  const [horizon, setHorizon] = useState<string>("T+7");
  const [labResult, setLabResult] = useState<IndexLabResponse | null>(null);
  const [labLoading, setLabLoading] = useState<boolean>(false);

  // Trigger default simulation on load
  useEffect(() => {
    handleRunSimulation();
    handleRunIndexLab();
  }, []);

  const handleRunSimulation = async () => {
    setSimLoading(true);
    const res = await runWhatIfSimulation({
      demand_shock_pct: demandShock,
      capacity_shock_pct: capacityShock,
      fuel_surcharge_shock_pct: fuelShock,
      seasonality_multiplier: seasonality,
    });
    setSimResult(res);
    setSimLoading(false);
  };

  const handleRunIndexLab = async () => {
    setLabLoading(true);
    const res = await runIndexLabExperiment({
      methodology,
      weighting_scheme: weightingScheme,
      booking_horizon: horizon,
    });
    setLabResult(res);
    setLabLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab("SIMULATOR")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === "SIMULATOR"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sliders className="h-4 w-4" />
          WHAT-IF CPI SIMULATOR
        </button>

        <button
          onClick={() => setActiveTab("INDEX_LAB")}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === "INDEX_LAB"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          INDEX LAB (RESEARCH SANDBOX)
        </button>
      </div>

      {activeTab === "SIMULATOR" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 text-white shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-400" />
                SCENARIO PARAMETERS
              </h3>
              <p className="text-xs text-slate-400">Modify macro variables to simulate CPI impact</p>
            </div>

            {/* Demand Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Passenger Demand Surge:</span>
                <span className="font-bold text-blue-400">{demandShock > 0 ? `+${demandShock}%` : `${demandShock}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={demandShock}
                onChange={(e) => setDemandShock(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <span className="text-[10px] text-slate-500 block">Assumed demand elasticity: ε = 0.65</span>
            </div>

            {/* Capacity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Airline Seat Capacity:</span>
                <span className="font-bold text-amber-400">{capacityShock > 0 ? `+${capacityShock}%` : `${capacityShock}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="2"
                value={capacityShock}
                onChange={(e) => setCapacityShock(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500 block">Fleet grounding / fleet expansion elasticity: ε = 0.85</span>
            </div>

            {/* Fuel Surcharge Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">ATF Fuel Surcharge Shock:</span>
                <span className="font-bold text-rose-400">{fuelShock > 0 ? `+${fuelShock}%` : `${fuelShock}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                value={fuelShock}
                onChange={(e) => setFuelShock(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-500 block">Aviation Turbine Fuel price pass-through</span>
            </div>

            {/* Seasonality Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Seasonality Factor:</span>
                <span className="font-bold text-emerald-400">{seasonality}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={seasonality}
                onChange={(e) => setSeasonality(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block">1.0 = Off-Peak, 1.25+ = Festival Peak</span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleRunSimulation}
                disabled={simLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Play className="h-4 w-4" />
                {simLoading ? "Simulating..." : "Run Scenario"}
              </button>
              <button
                onClick={() => {
                  setDemandShock(0);
                  setCapacityShock(0);
                  setFuelShock(0);
                  setSeasonality(1.0);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
                title="Reset to baseline"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Results Output */}
          <div className="lg:col-span-2 space-y-4">
            {simResult && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-500">
                      ⚡ SCENARIO SIMULATION OUTCOME
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      Simulated National CPI Impact
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    SIMULATION / SCENARIO
                  </span>
                </div>

                {/* Score Comparison */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Baseline CPI</span>
                    <div className="text-2xl font-black font-mono text-slate-700 dark:text-slate-300 mt-1">
                      {simResult.baseline_national_cpi.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <span className="text-[11px] font-mono text-blue-500 uppercase font-bold">Simulated CPI</span>
                    <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                      {simResult.simulated_national_cpi.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Absolute Change</span>
                    <div className={`text-2xl font-black font-mono mt-1 ${simResult.absolute_change_pts >= 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {simResult.absolute_change_pts >= 0 ? "+" : ""}{simResult.absolute_change_pts.toFixed(2)} pts
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Percentage Shift</span>
                    <div className={`text-2xl font-black font-mono mt-1 ${simResult.percentage_change_pct >= 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {simResult.percentage_change_pct >= 0 ? "+" : ""}{simResult.percentage_change_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Regional Impact Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    REGIONAL SIMULATED INDICES
                  </span>
                  <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
                    {Object.entries(simResult.regional_impacts).map(([reg, val]) => (
                      <div key={reg} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{reg}</span>
                        <strong className="text-blue-500">{val.toFixed(1)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corridor Impact Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Corridor</th>
                        <th className="py-2 px-3">Baseline</th>
                        <th className="py-2 px-3">Simulated</th>
                        <th className="py-2 px-3">Shift %</th>
                        <th className="py-2 px-3">Transmission Channel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {simResult.corridor_impacts.slice(0, 5).map((c, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-bold">{c.corridor}</td>
                          <td className="py-2 px-3 text-slate-500">{c.baseline_index}</td>
                          <td className="py-2 px-3 font-bold text-blue-500">{c.simulated_index}</td>
                          <td className={`py-2 px-3 font-bold ${c.difference_pct >= 0 ? "text-rose-500" : "text-emerald-500"}`}>
                            {c.difference_pct >= 0 ? "+" : ""}{c.difference_pct}%
                          </td>
                          <td className="py-2 px-3 text-slate-400">{c.key_transmission_channel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-slate-400 italic border-t border-slate-200 dark:border-slate-800 pt-3">
                  ⚠️ {simResult.disclaimer}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Index Lab View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 text-white shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-400" />
                INDEX LAB CONFIGURATION
              </h3>
              <p className="text-xs text-slate-400">Econometric formula & weighting sandbox</p>
            </div>

            {/* Methodology */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">Aggregation Formula</label>
              <select
                value={methodology}
                onChange={(e) => setMethodology(e.target.value as any)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
              >
                <option value="JEVONS">Jevons Elementary Geometric Mean (Standard)</option>
                <option value="CARLI_DUTOT_ARITHMETIC">Carli/Dutot Simple Arithmetic Average (Biased)</option>
              </select>
            </div>

            {/* Weighting Scheme */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">Weighting Scheme</label>
              <select
                value={weightingScheme}
                onChange={(e) => setWeightingScheme(e.target.value as any)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
              >
                <option value="DGCA_TRAFFIC">DGCA City-Pair Traffic Volume (Official MoCA)</option>
                <option value="EQUAL_WEIGHT">Equal Route Weighting (1/N Unweighted)</option>
              </select>
            </div>

            {/* Booking Horizon */}
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">Booking Horizon Focus</label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
              >
                <option value="T+1">T+1 (Tatkal / Spot Index)</option>
                <option value="T+7">T+7 (Weekly Horizon)</option>
                <option value="T+15">T+15 (Fortnightly Horizon)</option>
                <option value="T+30">T+30 (Advance Planning)</option>
                <option value="ALL_BLENDED">All Horizons Blended</option>
              </select>
            </div>

            <button
              onClick={handleRunIndexLab}
              disabled={labLoading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20"
            >
              <Play className="h-4 w-4" />
              {labLoading ? "Computing..." : "Run Experiment"}
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {labResult && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-500">
                      🔬 METHODOLOGY EVALUATION RESULT
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      Computed Index: {labResult.computed_index.toFixed(2)}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-500 border border-purple-500/30">
                    {labResult.methodology_used}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                    MATHEMATICAL AGGREGATION FORMULA
                  </span>
                  <div className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-sm overflow-x-auto">
                    {labResult.formula_latex}
                  </div>
                </div>

                {labResult.upward_bias_demonstration_pct && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/80 space-y-1">
                    <span className="text-xs font-bold font-mono text-rose-500 flex items-center gap-1.5">
                      ⚠️ UPWARD SUBSTITUTION BIAS DEMONSTRATED
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Simple arithmetic averaging (Carli/Dutot) creates an artificial inflation bias of{" "}
                      <strong>+{labResult.upward_bias_demonstration_pct}%</strong> compared to the Jevons geometric mean,
                      violating the Time Reversal Axiom.
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  📘 {labResult.econometric_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
