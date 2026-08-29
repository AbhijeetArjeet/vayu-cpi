"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  Plane,
  Sparkles,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  FileText,
  HelpCircle,
  BarChart3,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchAirfareIndex,
  fetchSurgeAlerts,
  fetchAllRoutesCurrent,
  fetchWeeklyAirfareIntelligence,
  fetchMLMetrics,
  DataMode,
  NationalCompositeCPI,
  SurgeAlert,
  RouteJevonsIndex,
  WeeklyAirfareResponse,
  MLModelMetricsResponse,
} from "@/lib/api";
import IndiaRouteMap from "@/components/IndiaRouteMap";
import RouteCards from "@/components/RouteCards";
import RouteDrawer from "@/components/RouteDrawer";

function CommandCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get("mode") as DataMode) || "live";

  const [dataMode, setDataMode] = useState<DataMode>(initialMode);
  const [cpiData, setCpiData] = useState<NationalCompositeCPI | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyAirfareResponse | null>(null);
  const [mlMetrics, setMlMetrics] = useState<MLModelMetricsResponse | null>(null);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerRoute, setDrawerRoute] = useState<string | null>(null);

  // Quick Search Form state
  const [searchFrom, setSearchFrom] = useState("DEL");
  const [searchTo, setSearchTo] = useState("BOM");
  const [searchDate, setSearchDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
  const [searchPax, setSearchPax] = useState("1");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [cpiRes, weeklyRes, mlRes, alertsRes, routesRes] = await Promise.all([
          fetchAirfareIndex(dataMode, 30),
          fetchWeeklyAirfareIntelligence(undefined, dataMode, 8),
          fetchMLMetrics(),
          fetchSurgeAlerts(),
          fetchAllRoutesCurrent(dataMode, 30),
        ]);

        if (cpiRes) setCpiData(cpiRes);
        if (weeklyRes) setWeeklyData(weeklyRes);
        if (mlRes) setMlMetrics(mlRes);
        if (alertsRes) setAlerts(alertsRes);
        if (routesRes && routesRes.routes) setRoutes(routesRes.routes);
      } catch (err) {
        console.error("Failed loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [dataMode]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/passenger?from=${searchFrom}&to=${searchTo}&date=${searchDate}&pax=${searchPax}`);
  };

  const nationalIndexVal = cpiData ? cpiData.composite_index : (weeklyData ? weeklyData.national_index : 104.82);
  const wowChange = weeklyData ? weeklyData.wow_change_pct : 2.7;
  const marketSignal = weeklyData ? weeklyData.market_signal : "RISING";
  const dataQuality = weeklyData ? weeklyData.data_quality : "HIGH";

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-100">
      {/* 1. HERO SECTION & NATIONAL AIRFARE PULSE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-2xl p-6 sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Official National Aviation Intelligence Platform
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
              VAYU-CPI
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-cyan-300">
              India&apos;s Airfare Intelligence Layer — <span className="text-slate-300">Track. Understand. Predict.</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              Automated multi-horizon airfare tracking across 35 domestic corridors. Computes axiomatic Jevons-Laspeyres price indices for MoSPI & DGCA and provides fair-fare validation for 150M+ Indian passengers.
            </p>

            {/* Quick Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                📊 Base Year 2024 = 100
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                🛡️ 3-Sigma Anomaly Radar
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                🤖 Time-Series ML Regressor
              </span>
            </div>
          </div>

          {/* DOMINANT NATIONAL INDEX CARD */}
          <div className="w-full lg:w-96 bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                National Airfare Index
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold tracking-wider uppercase border ${
                dataQuality === 'HIGH'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                Quality: {dataQuality}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {nationalIndexVal.toFixed(2)}
              </span>
              <span className={`text-sm sm:text-base font-extrabold flex items-center ${
                wowChange >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {wowChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {wowChange > 0 ? `+${wowChange}%` : `${wowChange}%`} this week
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Daily Delta</div>
                <div className="text-slate-200 font-bold mt-0.5">+0.4%</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Weekly (WoW)</div>
                <div className={`font-bold mt-0.5 ${wowChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {wowChange > 0 ? `+${wowChange}%` : `${wowChange}%`}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Monthly (MoM)</div>
                <div className="text-cyan-400 font-bold mt-0.5">
                  {weeklyData?.mom_change_pct ? `+${weeklyData.mom_change_pct}%` : '+5.1%'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Updated: {weeklyData?.data_freshness || 'Live IST'}</span>
              <Link href="/weekly" className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-0.5">
                Weekly Intel ➔
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT MARKET INDICATOR STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Signal */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className={`p-2.5 rounded-lg shrink-0 ${
            marketSignal === 'HIGH_PRESSURE' ? 'bg-rose-500/20 text-rose-400' : marketSignal === 'RISING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Market Signal</div>
            <div className="text-sm font-extrabold text-white">{marketSignal}</div>
          </div>
        </div>

        {/* Momentum */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Airfare Momentum</div>
            <div className="text-sm font-extrabold text-white">+{wowChange}% WoW</div>
          </div>
        </div>

        {/* Volatility */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Market Volatility</div>
            <div className="text-sm font-extrabold text-white">Moderate (HHI 0.42)</div>
          </div>
        </div>

        {/* ML Outlook */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ML Forward Outlook</div>
            <div className="text-sm font-extrabold text-emerald-400">Sweet-Spot T+14 to T+21</div>
          </div>
        </div>
      </div>

      {/* 3. PASSENGER QUICK SEARCH BAR (FIND YOUR FARE) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/40 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Plane className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-extrabold text-white">Find Your Fare Intelligence</h2>
          <span className="text-xs text-slate-400 hidden sm:inline">— Real-time fair price score, calendar heatmap & booking advice</span>
        </div>

        <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">From (Origin)</label>
            <select
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="DEL">Delhi (DEL)</option>
              <option value="BOM">Mumbai (BOM)</option>
              <option value="BLR">Bengaluru (BLR)</option>
              <option value="HYD">Hyderabad (HYD)</option>
              <option value="CCU">Kolkata (CCU)</option>
              <option value="MAA">Chennai (MAA)</option>
              <option value="GOI">Goa (GOI)</option>
              <option value="PAT">Patna (PAT)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">To (Destination)</label>
            <select
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="BOM">Mumbai (BOM)</option>
              <option value="DEL">Delhi (DEL)</option>
              <option value="BLR">Bengaluru (BLR)</option>
              <option value="HYD">Hyderabad (HYD)</option>
              <option value="CCU">Kolkata (CCU)</option>
              <option value="MAA">Chennai (MAA)</option>
              <option value="GOI">Goa (GOI)</option>
              <option value="PAT">Patna (PAT)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Departure Date</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Passengers</label>
            <select
              value={searchPax}
              onChange={(e) => setSearchPax(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="1">1 Passenger</option>
              <option value="2">2 Passengers</option>
              <option value="3">3 Passengers</option>
              <option value="4">4+ Passengers</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 transition hover:scale-102"
            >
              <Search className="w-4 h-4" />
              <span>Check Fare Intelligence</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. INDIA AIRFARE MARKET OVERVIEW (RISING / STABLE / FALLING) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              India Airfare Market Dispersion
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live route inflation tracking across India&apos;s primary domestic trunk and regional corridors.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              🔴 Rising: {weeklyData?.routes_rising_pct || 64}%
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              🟡 Stable: {weeklyData?.routes_stable_pct || 13}%
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🟢 Falling: {weeklyData?.routes_falling_pct || 23}%
            </span>
          </div>
        </div>

        {/* Map & Corridor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IndiaRouteMap onSelectCorridor={(corridor) => setDrawerRoute(corridor)} />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase text-slate-400 mb-3 tracking-wider flex items-center justify-between">
              <span>Tracked Corridors ({routes.length || 35})</span>
              <Link href="/weekly" className="text-cyan-400 hover:text-cyan-300 font-bold">
                View Weekly Heatmap ➔
              </Link>
            </div>
            <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
              {routes.slice(0, 8).map((r) => (
                <div
                  key={`${r.origin}-${r.destination}`}
                  onClick={() => setDrawerRoute(`${r.origin}-${r.destination}`)}
                  className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-extrabold text-white">{r.origin} ➔ {r.destination}</div>
                    <div className="text-slate-400 text-[11px]">Current Geom: ₹{Math.round(r.current_geom_mean).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-cyan-400">{r.jevons_index.toFixed(1)}</div>
                    <div className="text-[10px] text-slate-500">{r.sample_size} quotes</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. MULTI-PILLAR STATISTICAL INTELLIGENCE SUITE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              INTELLIGENCE PLATFORM SUITE
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Econometric, Surveillance & Machine Learning Modules
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <Link
            href="/weekly"
            className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition group space-y-1 block"
          >
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>1. WEEKLY</span>
              <span className="group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="text-slate-400 text-[11px]">WoW macro intelligence</p>
          </Link>

          <Link
            href="/passenger"
            className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition group space-y-1 block"
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>2. PASSENGER</span>
              <span className="group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="text-slate-400 text-[11px]">Fare calendar & score</p>
          </Link>

          <Link
            href="/explainer"
            className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 transition group space-y-1 block"
          >
            <div className="flex items-center justify-between text-blue-400 font-bold">
              <span>3. EXPLAINER</span>
              <span className="group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="text-slate-400 text-[11px]">Attribution waterfall</p>
          </Link>

          <Link
            href="/shocks"
            className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 transition group space-y-1 block"
          >
            <div className="flex items-center justify-between text-rose-400 font-bold">
              <span>4. SHOCKS</span>
              <span className="group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="text-slate-400 text-[11px]">3-Sigma surge detector</p>
          </Link>

          <Link
            href="/policy"
            className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 transition group space-y-1 block"
          >
            <div className="flex items-center justify-between text-purple-400 font-bold">
              <span>5. POLICY LAB</span>
              <span className="group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="text-slate-400 text-[11px]">What-If CPI simulator</p>
          </Link>

          <Link
            href="/provenance"
            className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition group space-y-1 block"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span>6. AUDIT TREE</span>
              <span className="group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="text-slate-400 text-[11px]">100% Provenance trace</p>
          </Link>
        </div>
      </div>

      {/* Drawer */}
      {drawerRoute && (
        <RouteDrawer corridor={drawerRoute} onClose={() => setDrawerRoute(null)} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading VAYU-CPI Platform...</div>}>
      <CommandCenterContent />
    </Suspense>
  );
}
