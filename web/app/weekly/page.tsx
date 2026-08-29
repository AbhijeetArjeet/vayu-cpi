'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Activity,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileText,
  RefreshCw,
  Sparkles,
  Plane,
  ChevronRight,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { fetchWeeklyAirfareIntelligence, WeeklyAirfareResponse, DataMode } from '@/lib/api';

export default function WeeklyIntelligencePage() {
  const [mode, setMode] = useState<DataMode>('live');
  const [numWeeks, setNumWeeks] = useState<number>(8);
  const [data, setData] = useState<WeeklyAirfareResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RISING' | 'STABLE' | 'FALLING'>('ALL');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchWeeklyAirfareIntelligence(undefined, mode, numWeeks);
      setData(res);
    } catch (err) {
      console.error('Failed to load weekly intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mode, numWeeks]);

  const filteredRoutes = data?.routes.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner & Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  MoSPI / DGCA Weekly Macro Series
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center gap-1 ${
                  data?.data_quality === 'HIGH'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Data Quality: {data?.data_quality || 'HIGH'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Weekly Airfare Intelligence
                {data?.week_label && (
                  <span className="text-sm sm:text-base font-medium px-3 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                    {data.week_label}
                  </span>
                )}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                How India&apos;s domestic airfare market moved this week — Jevons geometric indexation weighted by DGCA passenger volume.
              </p>
            </div>

            {/* Actions & Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-1">
                {(['live', 'combined', 'historical'] as DataMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                      mode === m
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <Link
                href="/weekly-report"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                Download Report
              </Link>

              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Refresh Weekly Series"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: National Index */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">National Airfare Index</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {data ? data.national_index.toFixed(2) : '104.82'}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1.5 font-medium">
              {(data?.wow_change_pct || 0) >= 0 ? (
                <span className="text-rose-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{data?.wow_change_pct || 2.7}% WoW
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {data?.wow_change_pct}% WoW
                </span>
              )}
              <span className="text-slate-500 ml-auto">Base 2024=100</span>
            </div>
          </div>

          {/* Card 2: Market Status Signal */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Market Pressure</div>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-extrabold tracking-wide ${
                data?.market_signal === 'HIGH_PRESSURE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : data?.market_signal === 'RISING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  data?.market_signal === 'HIGH_PRESSURE' ? 'bg-rose-400 animate-ping' : data?.market_signal === 'RISING' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {data?.market_signal || 'STABLE'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {data?.routes_rising_pct || 64}% corridors rising
            </div>
          </div>

          {/* Card 3: 4-Week Average */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">4-Week Average</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
              {data ? data.four_week_average.toFixed(2) : '102.14'}
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              MoM: <span className="font-semibold text-slate-200">{data?.mom_change_pct ? `${data.mom_change_pct > 0 ? '+' : ''}${data.mom_change_pct}%` : '+5.1%'}</span>
            </div>
          </div>

          {/* Card 4: Cheapest Corridor */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cheapest Corridor</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 truncate">
              {data?.cheapest_corridor || 'BOM-GOI'}
            </div>
            <div className="text-xs text-emerald-400/80 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Best Value Route
            </div>
          </div>

          {/* Card 5: Fastest Rising */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fastest Rising</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-1 truncate">
              {data?.fastest_rising_route || 'DEL-BOM'}
            </div>
            <div className="text-xs text-rose-400/80 mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Dynamic Demand Surge
            </div>
          </div>

          {/* Card 6: Total Observations */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Observations</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {data ? data.total_observations.toLocaleString() : '12,482'}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 truncate">
              {data?.data_freshness || 'Updated live'}
            </div>
          </div>
        </div>

        {/* Main Chart Section: Multi-Week Trajectory */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                National Weekly Airfare Index Trajectory (WoW)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing current weekly composite index against past periods (Base 2024 = 100).
              </p>
            </div>

            {/* Time Horizon Selector */}
            <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-1 self-start sm:self-auto">
              {[4, 8, 12, 26, 52].map((w) => (
                <button
                  key={w}
                  onClick={() => setNumWeeks(w)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    numWeeks === w
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w}W
                </button>
              ))}
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-72 w-full">
            {data?.historical_series && data.historical_series.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.historical_series} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week_label" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: unknown) => {
                      const num = typeof value === 'number' ? value : Number(value);
                      return isNaN(num) ? ['0.00', 'Weekly CPI'] : [num.toFixed(2), 'Weekly CPI'];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="national_index"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6d4' }}
                    activeDot={{ r: 7, fill: '#38bdf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Loading weekly historical trajectory...
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400" /> This Week: <strong className="text-slate-200">{data?.national_index.toFixed(2)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-500" /> Prev Week: <strong className="text-slate-200">{data?.prev_week_index.toFixed(2)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-600" /> 4-Wk Avg: <strong className="text-slate-200">{data?.four_week_average.toFixed(2)}</strong>
              </span>
            </div>
            <span>Axiomatic Jevons-Laspeyres aggregation</span>
          </div>
        </div>

        {/* Route Heatmap & Status Matrix */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-cyan-400" />
                Corridor-Level Weekly Movement Matrix ({filteredRoutes.length} routes)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of route-level Jevons index and weekly price inflation/deflation.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-1">
              {(['ALL', 'RISING', 'STABLE', 'FALLING'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    filterStatus === st
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'RISING' ? '🔴 Rising' : st === 'FALLING' ? '🟢 Falling' : st === 'STABLE' ? '🟡 Stable' : 'All Routes'}
                </button>
              ))}
            </div>
          </div>

          {/* Route Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRoutes.map((r) => {
              const isSelected = selectedRoute === r.corridor;
              return (
                <div
                  key={r.corridor}
                  onClick={() => setSelectedRoute(isSelected ? null : r.corridor)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/40'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base tracking-wide">{r.corridor}</span>
                      <span className="text-xs text-slate-400">({r.origin} ➔ {r.destination})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold tracking-wider uppercase ${
                      r.status === 'RISING'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : r.status === 'FALLING'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Weekly Index</div>
                      <div className="text-slate-100 font-bold text-sm mt-0.5">{r.weekly_index.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">WoW Change</div>
                      <div className={`font-bold text-sm mt-0.5 ${r.wow_change_pct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {r.wow_change_pct > 0 ? `+${r.wow_change_pct}%` : `${r.wow_change_pct}%`}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Avg Fare</div>
                      <div className="text-cyan-400 font-bold text-sm mt-0.5">₹{r.average_fare.toLocaleString()}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs text-slate-300 space-y-1 animate-fadeIn">
                      <div className="flex justify-between">
                        <span className="text-slate-400">DGCA Volume Weight:</span>
                        <span className="font-semibold">{(r.dgca_weight * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Observations:</span>
                        <span className="font-semibold">{r.observation_count} live quotes</span>
                      </div>
                      <div className="pt-2">
                        <Link
                          href={`/passenger?from=${r.origin}&to=${r.destination}`}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
                        >
                          Check Passenger Fare Calendar ➔
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrier and Advance Purchase Horizon Sub-Indices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carrier Sub-Indices */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-cyan-400" />
              Carrier Weekly Price Sub-Indices
            </h2>
            <div className="space-y-3">
              {data?.carriers.map((c) => (
                <div key={c.carrier} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400">
                      {c.carrier_code}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-200">{c.carrier}</div>
                      <div className="text-xs text-slate-400">Market Share: {c.market_share_pct}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-100">{c.weekly_index.toFixed(1)}</div>
                    <div className={`text-xs font-semibold ${c.wow_change_pct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {c.wow_change_pct > 0 ? `+${c.wow_change_pct}%` : `${c.wow_change_pct}%`} WoW
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horizon Sub-Indices */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-cyan-400" />
              Advance Booking Horizon Weekly Breakdown
            </h2>
            <div className="space-y-3">
              {data?.horizons.map((h) => (
                <div key={h.horizon_days} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-100">{h.booking_window}</span>
                      <span className="text-xs text-slate-400">({h.horizon_days} Days Advance)</span>
                    </div>
                    <div className="text-xs text-slate-400">Weight α: {(h.weight_alpha * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-cyan-400">{h.weekly_index.toFixed(1)}</div>
                    <div className={`text-xs font-semibold ${h.wow_change_pct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {h.wow_change_pct > 0 ? `+${h.wow_change_pct}%` : `${h.wow_change_pct}%`} WoW
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
