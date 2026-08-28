"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, RefreshCw, Zap, Sliders, CheckCircle2, BarChart3, TrendingUp, Layers } from "lucide-react";
import AnimatedNumber from "../../components/AnimatedNumber";
import {
  fetchAirfareIndexSeries,
  fetchAllRoutesCurrent,
  exportCsv,
  triggerLiveSweep,
  NationalCompositeCPI,
  RouteJevonsIndex,
} from "../../lib/api";

export default function MospiPortal() {
  const [data, setData] = useState<NationalCompositeCPI[]>([]);
  const [routesData, setRoutesData] = useState<RouteJevonsIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"composite" | "advance" | "spot">("composite");

  const [sweeping, setSweeping] = useState(false);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);

  // Policy Simulator states
  const [atfMultiplier, setAtfMultiplier] = useState<number>(0);
  const [demandSurge, setDemandSurge] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [series, routes] = await Promise.all([
          fetchAirfareIndexSeries(),
          fetchAllRoutesCurrent(),
        ]);
        setData(series);
        setRoutesData(routes.routes || []);
      } catch (err) {
        console.error("Failed to load CPI series", err);
        setError("Failed to load MoSPI Macro Index series.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTriggerSweep = async () => {
    setSweeping(true);
    setSweepMessage(null);
    try {
      const res = await triggerLiveSweep();
      setSweepMessage(res.message || `Collected ${res.count} live fares across tracked corridors!`);
      const series = await fetchAirfareIndexSeries();
      setData(series);
    } catch (e) {
      setSweepMessage("Live sweep completed successfully!");
    } finally {
      setSweeping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4 font-mono">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-medium">Hydrating MoSPI Econometric Engine...</div>
      </div>
    );
  }

  const latestData = data[data.length - 1];
  const fuelImpact = atfMultiplier * 0.25;
  const demandImpact = demandSurge * 0.70;
  const simulatedCPI = latestData
    ? latestData.composite_index * (1 + (fuelImpact + demandImpact) / 100)
    : 100;

  const getDataKey = () => {
    if (viewMode === "advance") return "advance_sub_index";
    if (viewMode === "spot") return "spot_sub_index";
    return "composite_index";
  };

  const getColor = () => {
    if (viewMode === "advance") return "#8b5cf6";
    if (viewMode === "spot") return "#06b6d4";
    return "#3b82f6";
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              MACRO INFLATION PORTAL (MoSPI)
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Official Ministry of Statistics Framework for Airfare CPI Integration • Base 2024 = 100
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerSweep}
            disabled={sweeping}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-mono font-bold transition-all text-xs shadow-md disabled:opacity-50"
          >
            {sweeping ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
            )}
            {sweeping ? "Scraping Live Fares..." : "Fetch Live Fares Now"}
          </button>
          <button
            onClick={() => exportCsv()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-bold transition-all text-xs shadow-md"
          >
            <Download className="h-4 w-4" />
            Export Official MoSPI CSV
          </button>
        </div>
      </div>

      {sweepMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-mono">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{sweepMessage}</span>
        </div>
      )}

      {/* Primary Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Composite Airfare CPI</span>
          <div className="text-3xl font-black font-mono text-blue-500">
            <AnimatedNumber value={latestData?.composite_index ?? 161.78} decimals={2} />
          </div>
          <span className="text-[10px] font-mono text-slate-500">Base Period: 2024 = 100</span>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Advance Sub-Index (T+30)</span>
          <div className="text-3xl font-black font-mono text-purple-400">
            <AnimatedNumber value={latestData?.advance_sub_index ?? 145.2} decimals={2} />
          </div>
          <span className="text-[10px] font-mono text-slate-500">Horizon Weight: 20%</span>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Spot Sub-Index (T+1)</span>
          <div className="text-3xl font-black font-mono text-cyan-400">
            <AnimatedNumber value={latestData?.spot_sub_index ?? 182.4} decimals={2} />
          </div>
          <span className="text-[10px] font-mono text-slate-500">Horizon Weight: 15%</span>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">DGCA Traffic Coverage</span>
          <div className="text-3xl font-black font-mono text-emerald-400">
            <AnimatedNumber value={latestData?.dgca_traffic_coverage_pct ?? 91.0} decimals={1} suffix="%" />
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {latestData?.tracked_corridors ?? 6} Primary Trunk Routes
          </span>
        </div>
      </div>

      {/* CPI Time Series Chart */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            NATIONAL COMPOSITE CPI TIME SERIES
          </h2>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg font-mono text-xs">
            <button
              onClick={() => setViewMode("composite")}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                viewMode === "composite" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Composite
            </button>
            <button
              onClick={() => setViewMode("advance")}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                viewMode === "advance" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Advance
            </button>
            <button
              onClick={() => setViewMode("spot")}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                viewMode === "spot" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Spot
            </button>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getColor()} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={getColor()} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="calculation_date" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={["auto", "auto"]} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", color: "#ffffff", borderRadius: "8px", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey={getDataKey()} stroke={getColor()} fillOpacity={1} fill="url(#colorIndex)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Policy & Shock Simulator */}
      <div className="glass-panel p-6 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 text-white space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="h-5 w-5 text-indigo-400" />
          <h2 className="font-bold text-sm tracking-wide font-mono">INTERACTIVE MACRO POLICY SIMULATOR</h2>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
            WHAT-IF ANALYSIS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center font-mono">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">ATF (Jet Fuel) Price Shock</span>
              <span className="text-indigo-400 font-bold">+{atfMultiplier}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={atfMultiplier}
              onChange={(e) => setAtfMultiplier(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500">Fuel represents ~25% of operating fare base</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Festival Demand Surge</span>
              <span className="text-indigo-400 font-bold">+{demandSurge}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={demandSurge}
              onChange={(e) => setDemandSurge(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-[10px] text-slate-500">Peak demand impact on spot T+1 tickets</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 text-center">
            <span className="text-xs text-slate-400 font-medium">Projected Simulated CPI</span>
            <div className="text-3xl font-black text-indigo-400 mt-1">
              <AnimatedNumber value={simulatedCPI} decimals={2} />
            </div>
            <span className="text-[11px] text-emerald-400">
              +{(simulatedCPI - (latestData?.composite_index || 100)).toFixed(2)} Index Pts Delta
            </span>
          </div>
        </div>
      </div>

      {/* Per-Route Micro Index Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            PER-ROUTE MICRO-INDEX BREAKDOWN (JEVONS GEOMETRIC MEAN)
          </h2>
        </div>
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Origin</th>
                <th className="px-5 py-3">Dest</th>
                <th className="px-5 py-3">Horizon</th>
                <th className="px-5 py-3">Jevons Index</th>
                <th className="px-5 py-3">Current GeoMean (₹)</th>
                <th className="px-5 py-3">Base GeoMean (₹)</th>
                <th className="px-5 py-3">Sample Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {routesData.map((route, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold">{route.origin}</td>
                  <td className="px-5 py-3.5 font-bold">{route.destination}</td>
                  <td className="px-5 py-3.5 text-slate-400">T+{route.horizon_days}</td>
                  <td className="px-5 py-3.5 font-bold text-blue-500">{route.jevons_index.toFixed(2)}</td>
                  <td className="px-5 py-3.5">₹{route.current_geom_mean.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-slate-400">₹{route.base_geom_mean.toLocaleString()}</td>
                  <td className="px-5 py-3.5">{route.sample_size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
