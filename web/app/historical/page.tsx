"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { Database, Filter, TrendingUp, BarChart3, Award, RefreshCw, AlertCircle } from "lucide-react";
import { fetchHistoricalAnalytics, HistoricalAnalytics } from "../../lib/api";

export default function HistoricalPage() {
  const [analytics, setAnalytics] = useState<HistoricalAnalytics | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const orig = selectedRoute ? selectedRoute.split("-")[0] : undefined;
    const dest = selectedRoute ? selectedRoute.split("-")[1] : undefined;
    fetchHistoricalAnalytics(orig, dest)
      .then((res) => {
        if (res === null) {
          setError(true);
          setAnalytics(null);
        } else {
          setAnalytics(res);
        }
      })
      .catch(() => {
        setError(true);
        setAnalytics(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedRoute]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
                HISTORICAL AIRFARE TRENDS & DISTRIBUTION ANALYTICS
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Multi-year domestic airfare benchmarks, percentile distribution, volatility metrics, and DGCA dataset analytics.
            </p>
          </div>

          {/* Route Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 font-mono text-xs">
            <Filter className="h-4 w-4 text-blue-400" />
            <span className="text-slate-400">Filter Corridor:</span>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-slate-950 text-white border border-slate-800 rounded px-3 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Indian Corridors</option>
              <option value="DEL-BOM">DEL → BOM (Delhi-Mumbai)</option>
              <option value="BLR-DEL">BLR → DEL (Bengaluru-Delhi)</option>
              <option value="DEL-CCU">DEL → CCU (Delhi-Kolkata)</option>
              <option value="DEL-HYD">DEL → HYD (Delhi-Hyderabad)</option>
              <option value="DEL-PAT">DEL → PAT (Delhi-Patna)</option>
              <option value="BOM-GOI">BOM → GOI (Mumbai-Goa)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel p-12 text-center text-slate-400 font-mono flex items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
            <span>Calculating historical percentile distributions across datasets...</span>
          </div>
        ) : error || !analytics ? (
          <div className="glass-panel p-12 text-center text-rose-400 font-mono flex flex-col items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <div className="font-bold text-sm uppercase">Historical Analytics Service Unavailable</div>
            <p className="text-xs text-slate-400">Could not retrieve historical analytics from backend. Please check server logs.</p>
          </div>
        ) : analytics.sample_size === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-400 font-mono border border-dashed border-slate-800 rounded-lg space-y-2">
            <div className="font-bold text-base text-amber-400">No historical dataset is currently loaded.</div>
            <p className="text-xs text-slate-500">
              No verified historical tariff observations exist in the database for the selected corridor filter.
            </p>
          </div>
        ) : (
          <>
            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
              <div className="glass-panel p-4 bg-slate-900/70 border-slate-800">
                <div className="text-xs text-slate-400">Sample Size</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {analytics.sample_size.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Verified Fares</div>
              </div>

              <div className="glass-panel p-4 bg-slate-900/70 border-slate-800">
                <div className="text-xs text-slate-400">Median Fare</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">
                  ₹{analytics.median_fare.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">50th Percentile</div>
              </div>

              <div className="glass-panel p-4 bg-slate-900/70 border-slate-800">
                <div className="text-xs text-slate-400">Average (Mean)</div>
                <div className="text-2xl font-bold text-slate-200 mt-1">
                  ₹{analytics.mean_fare.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Arithmetic Mean</div>
              </div>

              <div className="glass-panel p-4 bg-slate-900/70 border-slate-800">
                <div className="text-xs text-slate-400">25th Percentile</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  ₹{analytics.p25.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Lower Quartile</div>
              </div>

              <div className="glass-panel p-4 bg-slate-900/70 border-slate-800">
                <div className="text-xs text-slate-400">90th Percentile</div>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  ₹{analytics.p90.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Peak Spike Bound</div>
              </div>

              <div className="glass-panel p-4 bg-slate-900/70 border-slate-800">
                <div className="text-xs text-slate-400">Volatility (Std Dev)</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  ₹{analytics.volatility_std.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Price Spread</div>
              </div>
            </div>

            {/* Fare Distribution Histogram & Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
              {/* Histogram */}
              <div className="glass-panel p-5 bg-slate-900/80 border-slate-800 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                      HISTORICAL FARE DISTRIBUTION HISTOGRAM
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">INR Price Brackets</span>
                </div>

                <div className="space-y-4">
                  {analytics.histogram.map((bin, idx) => {
                    const maxCount = Math.max(...analytics.histogram.map((b) => b.count), 1);
                    const pct = Math.round((bin.count / maxCount) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>{bin.range}</span>
                          <span className="text-blue-400 font-bold">{bin.count} observations</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Airline Rankings */}
              <div className="glass-panel p-5 bg-slate-900/80 border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                      AIRLINE TARIFF RANKINGS
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {analytics.airline_rankings.map((air, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{air.airline}</div>
                        <div className="text-[10px] text-slate-500">{air.count} fare samples</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">₹{air.avg_fare.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Avg Fare</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Route Rankings Table */}
            <div className="glass-panel p-5 bg-slate-900/80 border-slate-800 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                    HISTORICAL CORRIDOR TARIFF RANKINGS
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Sorted by Average Historical Fare</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2 px-3">Corridor</th>
                      <th className="py-2 px-3">Average Fare</th>
                      <th className="py-2 px-3">Median Fare</th>
                      <th className="py-2 px-3">Observations</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {analytics.route_rankings.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-blue-400">{r.route}</td>
                        <td className="py-2.5 px-3 text-emerald-400">₹{r.avg_fare.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-200">₹{r.median_fare.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.count}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                            VERIFIED DATASET
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
