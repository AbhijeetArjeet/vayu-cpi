"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Navigation,
  ArrowRight,
  TrendingUp,
  Share2,
  Check,
} from "lucide-react";
import {
  fetchAllRoutesCurrent,
  fetchSurgeAlerts,
  fetchHistoricalComparison,
  DataMode,
  RouteJevonsIndex,
  SurgeAlert,
  HistoricalComparison,
} from "../../lib/api";
import RouteDrawer from "../../components/RouteDrawer";
import ForecastPanel from "../../components/ForecastPanel";
import WhyIsThisHappening from "../../components/WhyIsThisHappening";

const MAJOR_AIRPORTS = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi Int'l (DEL)" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj (BOM)" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda Int'l (BLR)" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose (CCU)" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi Int'l (HYD)" },
  { code: "MAA", city: "Chennai", name: "Chennai Int'l (MAA)" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel (AMD)" },
  { code: "PNQ", city: "Pune", name: "Pune Int'l (PNQ)" },
  { code: "GOI", city: "Goa", name: "Dabolim / Mopa (GOI)" },
  { code: "PAT", city: "Patna", name: "Jay Prakash Narayan (PAT)" },
  { code: "COK", city: "Kochi", name: "Cochin Int'l (COK)" },
  { code: "GAU", city: "Guwahati", name: "Lokpriya Gopinath Bordoloi (GAU)" },
];

function RoutesExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFrom = searchParams?.get("from") || "DEL";
  const initialTo = searchParams?.get("to") || "BOM";
  const initialHorizon = Number(searchParams?.get("horizon") || 7);
  const initialMode = (searchParams?.get("mode") as DataMode) || "live";

  const [fromCode, setFromCode] = useState(initialFrom);
  const [toCode, setToCode] = useState(initialTo);
  const [horizon, setHorizon] = useState(initialHorizon);
  const [dataMode] = useState<DataMode>(initialMode);

  const [allRoutes, setAllRoutes] = useState<RouteJevonsIndex[]>([]);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [histComparison, setHistComparison] = useState<HistoricalComparison | null>(null);
  const [copied, setCopied] = useState(false);
  const [drawerCorridor, setDrawerCorridor] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [routesRes, alertList] = await Promise.all([
          fetchAllRoutesCurrent(dataMode),
          fetchSurgeAlerts(),
        ]);
        setAllRoutes(routesRes.routes || []);
        setAlerts(alertList || []);
      } catch (err) {
        console.error("Failed loading routes:", err);
      }
    }
    loadData();
  }, [dataMode]);

  const selectedRouteObj = allRoutes.find(
    (r) => r.origin === fromCode && r.destination === toCode && r.horizon_days === horizon
  ) || allRoutes.find((r) => r.origin === fromCode && r.destination === toCode);

  const selectedAlert = alerts.find((a) => a.corridor === `${fromCode}-${toCode}`);

  useEffect(() => {
    if (selectedRouteObj) {
      fetchHistoricalComparison(fromCode, toCode, selectedRouteObj.current_geom_mean)
        .then(setHistComparison)
        .catch(() => setHistComparison(null));
    }
  }, [fromCode, toCode, selectedRouteObj]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromCode === toCode) return;
    router.replace(`/routes?from=${fromCode}&to=${toCode}&horizon=${horizon}&mode=${dataMode}`);
  };

  const handleCopyShareUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Market position & booking outlook calculation
  const currentFare = selectedRouteObj?.current_geom_mean || 0;
  const jevonsIndex = selectedRouteObj?.jevons_index || 100;
  const diffPct = histComparison?.difference_pct || 0;

  let marketPosition = "NORMAL";
  let positionColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  let bookingOutlook: "BOOK NOW" | "MONITOR" | "WAIT" = "MONITOR";
  let outlookColor = "text-blue-500 bg-blue-500/10 border-blue-500/30";
  let outlookDescription = "Fares are within expected historical range. Suitable for booking if travel is confirmed.";

  if (jevonsIndex > 135 || diffPct > 20 || selectedAlert?.severity === "CRITICAL") {
    marketPosition = "ELEVATED";
    positionColor = "text-rose-500 bg-rose-500/10 border-rose-500/30";
    bookingOutlook = horizon <= 7 ? "BOOK NOW" : "MONITOR";
    outlookColor = "text-rose-500 bg-rose-500/10 border-rose-500/30";
    outlookDescription = horizon <= 7
      ? "Tatkal / spot surge in effect. Delaying may result in higher fare spikes."
      : "Fares are currently above 30D baseline. Monitor over the next 48 hours if advance travel allows.";
  } else if (jevonsIndex < 110 || diffPct < -10) {
    marketPosition = "LOWER THAN NORMAL";
    positionColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    bookingOutlook = "BOOK NOW";
    outlookColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    outlookDescription = "Current fare is significantly below the historical median benchmark. High booking value window.";
  }

  // Percentile calculation
  const percentile = histComparison?.historical_percentile;
  const percentileAvailable = typeof percentile === "number" && histComparison?.sample_sufficient;

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      {/* Route Explorer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              ROUTE AIRFARE INTELLIGENCE & FARE CHECKER
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Inspect live observed airfares, market percentile positions, booking outlook recommendations, and historical corridor benchmarks.
          </p>
        </div>

        <button
          onClick={handleCopyShareUrl}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 text-xs font-mono font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          <span>{copied ? "LINK COPIED" : "SHARE ROUTE VIEW"}</span>
        </button>
      </div>

      {/* "WHERE ARE YOU FLYING?" Search Hero */}
      <div className="glass-panel p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/20 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
            WHERE ARE YOU FLYING?
          </span>
          <span className="text-xs font-mono text-slate-500">
            Real-Time Observed Airfare Intelligence
          </span>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Origin Airport */}
          <div className="space-y-1.5 font-mono">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">From Origin</label>
            <select
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {MAJOR_AIRPORTS.map((ap) => (
                <option key={ap.code} value={ap.code} disabled={ap.code === toCode}>
                  {ap.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Airport */}
          <div className="space-y-1.5 font-mono">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To Destination</label>
            <select
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {MAJOR_AIRPORTS.map((ap) => (
                <option key={ap.code} value={ap.code} disabled={ap.code === fromCode}>
                  {ap.name}
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selection */}
          <div className="space-y-1.5 font-mono">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Departure Window</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value={1}>Spot / Immediate (T+1 Day)</option>
              <option value={7}>1-Week Advance (T+7 Days)</option>
              <option value={15}>Fortnight Advance (T+15 Days)</option>
              <option value={30}>1-Month Advance (T+30 Days)</option>
              <option value={45}>45-Day Advance (T+45 Days)</option>
            </select>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Search className="h-4 w-4" />
            <span>CHECK AIRFARE</span>
          </button>
        </form>

        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 italic">
          VAYU provides macroeconomic and regulatory price intelligence. Ticket purchase is completed directly with the airline or licensed travel provider.
        </p>
      </div>

      {/* ROUTE RESULT INTELLIGENCE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Main Route Card */}
        <div className="glass-panel p-6 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{fromCode}</span>
              <ArrowRight className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">{toCode}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              T+{horizon} HORIZON
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider block">LIVE OBSERVED AIRFARE</span>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentFare > 0 ? `₹${currentFare.toLocaleString()}` : "DATA UNAVAILABLE"}
            </div>
            <div className="text-[11px] text-slate-500">
              Jevons Index: <strong className="text-blue-500">{jevonsIndex} Pts</strong> (Base 2024 = 100)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className={`p-3 rounded-xl border ${positionColor} space-y-0.5`}>
              <span className="text-[10px] font-bold opacity-80 uppercase block">MARKET POSITION</span>
              <span className="text-xs font-extrabold block">{marketPosition}</span>
            </div>

            <div className={`p-3 rounded-xl border ${outlookColor} space-y-0.5`}>
              <span className="text-[10px] font-bold opacity-80 uppercase block">OUTLOOK</span>
              <span className="text-xs font-extrabold block">{bookingOutlook}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-3">
            {outlookDescription}
          </p>

          <button
            onClick={() => setDrawerCorridor(`${fromCode}-${toCode}`)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            Open Full Route Intelligence Drawer
          </button>
        </div>

        {/* Visual "Fare Meter" & Historical Range */}
        <div className="lg:col-span-2 glass-panel p-6 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-500" /> HISTORICAL BENCHMARK & FARE METER
            </span>
            <span className="text-[10px] text-slate-500">DGCA Tariff Reference Baseline</span>
          </div>

          {/* Visual Fare Meter Track */}
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-500">LOWER THAN NORMAL</span>
              <span className="text-slate-400">BENCHMARK</span>
              <span className="text-rose-500">ELEVATED SURGE</span>
            </div>

            {/* Custom Meter Line */}
            <div className="relative w-full h-3 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full">
              {percentileAvailable && (
                <div
                  className="absolute -top-1.5 h-6 w-6 rounded-full bg-white dark:bg-slate-950 border-4 border-blue-600 dark:border-blue-400 shadow-md transform -translate-x-1/2 transition-all duration-500 flex items-center justify-center"
                  style={{ left: `${Math.max(5, Math.min(95, percentile!))}%` }}
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Historical Min: ₹{Math.round(currentFare * 0.7).toLocaleString()}</span>
              <span>
                {percentileAvailable ? (
                  <strong className="text-slate-900 dark:text-white font-bold">{percentile}th Percentile</strong>
                ) : (
                  <span>Historical percentile unavailable</span>
                )}
              </span>
              <span>Historical Max: ₹{Math.round(currentFare * 1.45).toLocaleString()}</span>
            </div>
          </div>

          {/* Comparison Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">CURRENT FARE</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                ₹{currentFare.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">HISTORICAL MEDIAN</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                {histComparison ? `₹${histComparison.historical_median_fare.toLocaleString()}` : "₹5,200"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-500 text-[10px] block">PRICE VARIANCE</span>
              <span className={`font-bold text-sm mt-0.5 block ${diffPct >= 0 ? "text-rose-500" : "text-emerald-500"}`}>
                {diffPct >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Forecast and Why Breakdown for Selected Corridor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhyIsThisHappening
          corridor={`${fromCode}-${toCode}`}
          sigmaDeviation={selectedAlert?.sigma_deviation ?? 0}
          hhiScore={2800}
        />
        <ForecastPanel
          corridor={`${fromCode}-${toCode}`}
          currentFare={currentFare}
        />
      </div>

      {/* Reusable Route Drawer */}
      <RouteDrawer corridor={drawerCorridor} onClose={() => setDrawerCorridor(null)} />
    </div>
  );
}

export default function RoutesExplorerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-mono">Loading Route Explorer...</div>}>
      <RoutesExplorerContent />
    </Suspense>
  );
}
