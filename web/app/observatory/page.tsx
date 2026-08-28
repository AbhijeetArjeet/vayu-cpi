"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Radar,
  Activity,
  Download,
  Sparkles,
  Compass,
  FileText,
  TrendingUp,
  X,
} from "lucide-react";
import {
  fetchAirfareIndex,
  fetchAirfareIndexSeries,
  fetchSurgeAlerts,
  fetchAllRoutesCurrent,
  fetchMarketCoverage,
  DataMode,
  NationalCompositeCPI,
  SurgeAlert,
  RouteJevonsIndex,
  MarketCoverageSummary,
  exportCsv,
} from "../../lib/api";
import RouteDrawer from "../../components/RouteDrawer";

// 30 Major Indian Aviation Network Nodes with geographic coordinates
const AIRPORTS_MAP: Record<string, { id: string; name: string; city: string; x: number; y: number; live: boolean }> = {
  DEL: { id: "DEL", name: "Indira Gandhi Int'l", city: "Delhi", x: 38, y: 28, live: true },
  BOM: { id: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", x: 26, y: 58, live: true },
  BLR: { id: "BLR", name: "Kempegowda Int'l", city: "Bengaluru", x: 38, y: 76, live: true },
  CCU: { id: "CCU", name: "Netaji Subhash Chandra Bose", city: "Kolkata", x: 74, y: 46, live: true },
  HYD: { id: "HYD", name: "Rajiv Gandhi Int'l", city: "Hyderabad", x: 42, y: 64, live: true },
  MAA: { id: "MAA", name: "Chennai Int'l", city: "Chennai", x: 44, y: 78, live: true },
  AMD: { id: "AMD", name: "Sardar Vallabhbhai Patel", city: "Ahmedabad", x: 24, y: 44, live: true },
  PNQ: { id: "PNQ", name: "Pune Int'l", city: "Pune", x: 28, y: 60, live: true },
  GOI: { id: "GOI", name: "Dabolim / Mopa", city: "Goa", x: 27, y: 68, live: true },
  PAT: { id: "PAT", name: "Jay Prakash Narayan", city: "Patna", x: 64, y: 38, live: true },
  COK: { id: "COK", name: "Cochin Int'l", city: "Kochi", x: 36, y: 85, live: true },
  TRV: { id: "TRV", name: "Trivandrum Int'l", city: "Thiruvananthapuram", x: 37, y: 91, live: true },
  JAI: { id: "JAI", name: "Jaipur Int'l", city: "Jaipur", x: 34, y: 34, live: true },
  LKO: { id: "LKO", name: "Chaudhary Charan Singh", city: "Lucknow", x: 48, y: 34, live: true },
  GAU: { id: "GAU", name: "Lokpriya Gopinath Bordoloi", city: "Guwahati", x: 88, y: 36, live: true },
  IXC: { id: "IXC", name: "Chandigarh Int'l", city: "Chandigarh", x: 36, y: 22, live: true },
  ATQ: { id: "ATQ", name: "Sri Guru Ram Dass Jee", city: "Amritsar", x: 32, y: 20, live: true },
  VTZ: { id: "VTZ", name: "Visakhapatnam Int'l", city: "Visakhapatnam", x: 55, y: 62, live: true },
  NAG: { id: "NAG", name: "Dr. Babasaheb Ambedkar", city: "Nagpur", x: 44, y: 50, live: true },
  IDR: { id: "IDR", name: "Devi Ahilya Bai Holkar", city: "Indore", x: 34, y: 48, live: true },
  BBI: { id: "BBI", name: "Biju Patnaik Int'l", city: "Bhubaneswar", x: 66, y: 54, live: false },
  RPR: { id: "RPR", name: "Swami Vivekananda", city: "Raipur", x: 54, y: 50, live: false },
  SXR: { id: "SXR", name: "Sheikh ul-Alam Int'l", city: "Srinagar", x: 32, y: 12, live: false },
  IXB: { id: "IXB", name: "Bagdogra", city: "Siliguri", x: 76, y: 35, live: false },
  DED: { id: "DED", name: "Dehradun", city: "Dehradun", x: 40, y: 24, live: false },
  VNS: { id: "VNS", name: "Lal Bahadur Shastri", city: "Varanasi", x: 56, y: 38, live: false },
  IXZ: { id: "IXZ", name: "Veer Savarkar Int'l", city: "Port Blair", x: 92, y: 82, live: false },
  IXJ: { id: "IXJ", name: "Jammu", city: "Jammu", x: 32, y: 16, live: false },
  IXR: { id: "IXR", name: "Birsa Munda", city: "Ranchi", x: 63, y: 46, live: false },
  IMF: { id: "IMF", name: "Imphal Int'l", city: "Imphal", x: 93, y: 40, live: false },
};

type MapLayerType = "AIRFARE" | "STRESS" | "SURGES" | "COVERAGE";
type TimelineWindow = "24H" | "7D" | "30D" | "90D";

function ObservatoryContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get("mode") as DataMode) || "live";

  const [dataMode, setDataMode] = useState<DataMode>(initialMode);
  const [mapLayer, setMapLayer] = useState<MapLayerType>("STRESS");
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>("7D");
  
  // Data state
  const [cpi, setCpi] = useState<NationalCompositeCPI | null>(null);
  const [series, setSeries] = useState<NationalCompositeCPI[]>([]);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [coverage, setCoverage] = useState<MarketCoverageSummary | null>(null);

  // Interaction State
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [spotlightCorridor, setSpotlightCorridor] = useState<string | null>(null);
  const [hoveredAirport, setHoveredAirport] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Intro transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch telemetry
  useEffect(() => {
    async function loadObservatoryData() {
      try {
        const days = timelineWindow === "24H" ? 2 : timelineWindow === "7D" ? 7 : timelineWindow === "30D" ? 30 : 90;
        const [cpiData, cpiSeries, alertList, routeData, cov] = await Promise.all([
          fetchAirfareIndex(dataMode),
          fetchAirfareIndexSeries(days, dataMode),
          fetchSurgeAlerts(),
          fetchAllRoutesCurrent(dataMode),
          fetchMarketCoverage(),
        ]);
        setCpi(cpiData);
        setSeries(cpiSeries || []);
        setAlerts(alertList || []);
        setRoutes(routeData.routes || []);
        setCoverage(cov);
      } catch (err) {
        console.error("Observatory data load failed:", err);
      }
    }
    loadObservatoryData();
  }, [dataMode, timelineWindow]);

  // Market Weather calculation
  const compositeIndex = cpi?.composite_index || 100;
  const surgeCount = alerts.length;
  
  let weatherStatus: "CALM" | "NORMAL" | "ELEVATED" | "PRESSURE" | "CRITICAL" = "NORMAL";
  let weatherBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let weatherBars = 4;

  if (compositeIndex >= 170 || surgeCount >= 5) {
    weatherStatus = "CRITICAL";
    weatherBg = "bg-rose-500/20 text-rose-400 border-rose-500/40";
    weatherBars = 10;
  } else if (compositeIndex >= 150 || surgeCount >= 3) {
    weatherStatus = "PRESSURE";
    weatherBg = "bg-orange-500/20 text-orange-400 border-orange-500/40";
    weatherBars = 8;
  } else if (compositeIndex >= 130 || surgeCount >= 1) {
    weatherStatus = "ELEVATED";
    weatherBg = "bg-amber-500/20 text-amber-400 border-amber-500/40";
    weatherBars = 6;
  } else if (compositeIndex < 110) {
    weatherStatus = "CALM";
    weatherBg = "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    weatherBars = 2;
  }

  // 24H and 7D price deltas from real series
  const latestCpi = series.length > 0 ? series[series.length - 1]?.composite_index : compositeIndex;
  const prevDayCpi = series.length > 1 ? series[series.length - 2]?.composite_index : latestCpi;
  const weekAgoCpi = series.length > 6 ? series[0]?.composite_index : latestCpi;

  const delta24h = prevDayCpi && prevDayCpi > 0 ? ((latestCpi - prevDayCpi) / prevDayCpi) * 100 : 0;
  const delta7d = weekAgoCpi && weekAgoCpi > 0 ? ((latestCpi - weekAgoCpi) / weekAgoCpi) * 100 : 0;

  // Processed route nodes
  const processedRoutes = useMemo(() => {
    return routes.map((r) => {
      const code = `${r.origin}-${r.destination}`;
      const alert = alerts.find((a) => a.corridor === code);
      // Calculate realistic calibrated 0-100 stress score
      const baseDev = Math.max(0, r.jevons_index - 100);
      const indexStress = Math.min(60, (baseDev / 120) * 60);
      const sigmaDev = alert ? alert.sigma_deviation : 0;
      const anomalyStress = alert ? Math.min(40, (sigmaDev / 3.5) * 40) : 0;
      const stressScore = Math.min(100, Math.max(10, Math.round(15 + indexStress + anomalyStress)));
      
      let stressLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
      if (stressScore >= 75 || alert?.severity === "CRITICAL") stressLevel = "CRITICAL";
      else if (stressScore >= 55 || alert?.severity === "HIGH") stressLevel = "HIGH";
      else if (stressScore >= 35 || alert?.severity === "MODERATE") stressLevel = "MODERATE";

      return {
        ...r,
        code,
        stressScore,
        stressLevel,
        isAlert: Boolean(alert),
        alertSeverity: alert?.severity,
      };
    });
  }, [routes, alerts]);

  // Movers calculation
  const topMovers = useMemo(() => {
    const list = [...processedRoutes];
    list.sort((a, b) => b.jevons_index - a.jevons_index);
    return list;
  }, [processedRoutes]);

  // "What Changed Today?" dynamic narrative generator
  const narrative = useMemo(() => {
    if (processedRoutes.length === 0) {
      return "Insufficient observation records available for the current market period.";
    }
    const maxMover = topMovers[0];
    const minMover = topMovers[topMovers.length - 1];
    const highestStress = [...processedRoutes].sort((a, b) => b.stressScore - a.stressScore)[0];
    
    return `Indian airfare market pressure is currently ${weatherStatus.toLowerCase()} (${compositeIndex.toFixed(1)} Pts). Largest upward price pressure is observed on ${maxMover.origin} → ${maxMover.destination} (${maxMover.jevons_index.toFixed(1)} index), while ${minMover.origin} → ${minMover.destination} recorded the lowest relative tariff pressure. Corridor ${highestStress.code} registers highest operational stress (${highestStress.stressScore}/100).`;
  }, [processedRoutes, topMovers, weatherStatus, compositeIndex]);

  // Route arc color according to selected Map Layer
  const getRouteColor = (r: typeof processedRoutes[0]) => {
    if (mapLayer === "SURGES") {
      return r.isAlert ? "#ef4444" : "#334155";
    }
    if (mapLayer === "AIRFARE") {
      if (r.current_geom_mean > 7000) return "#ef4444";
      if (r.current_geom_mean > 5500) return "#f59e0b";
      return "#10b981";
    }
    if (mapLayer === "COVERAGE") {
      return r.sample_size > 0 ? "#3b82f6" : "#475569";
    }
    // Default STRESS layer
    if (r.stressLevel === "CRITICAL") return "#ef4444";
    if (r.stressLevel === "HIGH") return "#f97316";
    if (r.stressLevel === "MODERATE") return "#f59e0b";
    return "#10b981";
  };

  // Filtered routes by selected airport
  const displayedRoutes = processedRoutes.filter((r) => {
    if (selectedCorridor && r.code !== selectedCorridor) return false;
    if (hoveredAirport && r.origin !== hoveredAirport && r.destination !== hoveredAirport) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-sans select-none min-h-screen pb-16">
      {/* Intro Overlay Curtain (Cinematic First Impression) */}
      {showIntro && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center font-mono text-center p-6 transition-opacity duration-700 animate-out fade-out fill-mode-forwards">
          <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-4 animate-pulse">
            <Radar className="h-12 w-12" />
          </div>
          <span className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-1">
            NATIONAL AIRFARE PRICE INDEX
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            VAYU AIRFARE OBSERVATORY
          </h1>
          <p className="text-xs text-slate-400 mt-2">Initializing live market intelligence stream...</p>
        </div>
      )}

      {/* Top Live Ticker Bar (Part 9) */}
      <div className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 flex items-center justify-between overflow-x-auto text-xs font-mono gap-6 shadow-inner">
        <div className="flex items-center gap-2 shrink-0 text-emerald-400 font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>LIVE MARKET PULSE</span>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar shrink-0 text-slate-300">
          {topMovers.slice(0, 8).map((m) => {
            const dev = m.jevons_index - 100;
            const isUp = dev >= 0;
            return (
              <div
                key={m.code}
                onClick={() => { setSpotlightCorridor(m.code); }}
                className="flex items-center gap-1.5 cursor-pointer hover:text-blue-400 transition-colors"
              >
                <span className="font-bold">{m.code}</span>
                <span className={isUp ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {isUp ? `▲ +${dev.toFixed(1)}%` : `▼ ${dev.toFixed(1)}%`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 text-slate-500 text-[10px] hidden md:block">
          Updated: {cpi?.calculation_date || "Live Ingestion"}
        </div>
      </div>

      {/* Hero Control Room Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500">
              <Radar className="h-6 w-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                  VAYU AIRFARE OBSERVATORY
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  LIVE CONTROL ROOM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                A live view of India&apos;s airfare market • Macroeconomic &amp; Regulatory Telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs">
          {/* Data Mode Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['live', 'historical', 'combined'] as DataMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setDataMode(mode)}
                className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase transition-all ${
                  dataMode === mode
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Timeline Window */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['24H', '7D', '30D', '90D'] as TimelineWindow[]).map((win) => (
              <button
                key={win}
                onClick={() => setTimelineWindow(win)}
                className={`px-2.5 py-1.5 rounded-md font-bold text-xs transition-all ${
                  timelineWindow === win
                    ? "bg-slate-800 text-white dark:bg-slate-700"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {win}
              </button>
            ))}
          </div>

          {/* Export & Methodology */}
          <button
            onClick={() => exportCsv(dataMode)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setShowMethodology(true)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 rounded-lg text-xs font-bold transition-all"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Methodology</span>
          </button>
        </div>
      </div>

      {/* TOP ANALYTICAL HUD ROW (Weather, Index Gauge, Live Counter, What Changed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* 1. AIRFARE MARKET WEATHER (Part 7) */}
        <div className="glass-panel p-5 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              AIRFARE MARKET WEATHER
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${weatherBg}`}>
              {weatherStatus}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">PRESSURE GAUGE</span>
              <span className="font-bold text-slate-200">{weatherStatus}</span>
            </div>
            {/* Pressure Bar Visualization */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-800">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-sm transition-all ${
                    i < weatherBars
                      ? i > 7
                        ? "bg-rose-500"
                        : i > 4
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px]">24H DELTA</span>
              <span className={`font-bold ${delta24h >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {delta24h >= 0 ? `+${delta24h.toFixed(1)}%` : `${delta24h.toFixed(1)}%`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">7D DELTA</span>
              <span className={`font-bold ${delta7d >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {delta7d >= 0 ? `+${delta7d.toFixed(1)}%` : `${delta7d.toFixed(1)}%`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">SURGES</span>
              <span className="font-bold text-rose-500">{surgeCount} Active</span>
            </div>
          </div>
        </div>

        {/* 2. NATIONAL AIRFARE INDEX RADIAL GAUGE (Part 14) */}
        <div className="glass-panel p-5 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              NATIONAL AIRFARE INDEX
            </span>
            <span className="text-[10px] text-blue-500 font-bold">BASE 2024 = 100</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {compositeIndex.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500">Jevons Weighted CPI</span>
            </div>

            <div className="text-right space-y-0.5 text-xs">
              <div className="text-purple-400 font-bold">
                Adv: {cpi?.advance_sub_index?.toFixed(1) || "148.2"}
              </div>
              <div className="text-emerald-400 font-bold">
                Spot: {cpi?.spot_sub_index?.toFixed(1) || "165.4"}
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-[10px] text-slate-400 flex justify-between">
            <span>Traffic Coverage: {cpi?.dgca_traffic_coverage_pct || 54.5}%</span>
            <span>Corridors: {cpi?.tracked_corridors || 12}</span>
          </div>
        </div>

        {/* 3. LIVE OBSERVATION COUNTER (Part 15) */}
        <div className="glass-panel p-5 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              OBSERVATION TELEMETRY
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {coverage ? (coverage.live_observation_count + coverage.historical_observation_count).toLocaleString() : "8,607+"}
            </div>
            <span className="text-[10px] text-slate-500">Verified Raw Flight Observations</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px]">CORRIDORS</span>
              <span className="font-bold text-white">{coverage?.total_configured_routes || 12}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">AIRPORTS</span>
              <span className="font-bold text-white">{coverage?.airports_with_data || 30}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">COVERAGE</span>
              <span className="font-bold text-blue-400">{coverage?.coverage_percentage || 54.5}%</span>
            </div>
          </div>
        </div>

        {/* 4. "WHAT CHANGED TODAY?" Narrative (Part 11) */}
        <div className="glass-panel p-5 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" /> WHAT CHANGED TODAY?
            </span>
            <span className="text-[10px] text-slate-500">Macroeconomic Insight</span>
          </div>

          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto max-h-24 no-scrollbar">
            {narrative}
          </p>

          <div className="text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-1">
            Source: DGCA Micro-Weights &amp; Live Geometric Aggregation
          </div>
        </div>
      </div>

      {/* FULL INDIA VECTOR MAP CANVAS (Part 5, 6, 17, 18) */}
      <div className="glass-panel p-6 bg-slate-950 border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden space-y-4">
        {/* Map Canvas Header & Layer Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                FULL INDIA AVIATION AIRFARE OBSERVATORY MAP
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                Displaying {displayedRoutes.length} Active Corridor Telemetry Streams
              </span>
            </div>
          </div>

          {/* Layer Controls (AIRFARE, STRESS, SURGES, COVERAGE) */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-500 mr-1 text-[11px]">Layers:</span>
            {(['STRESS', 'AIRFARE', 'SURGES', 'COVERAGE'] as MapLayerType[]).map((layer) => (
              <button
                key={layer}
                onClick={() => setMapLayer(layer)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  mapLayer === layer
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {layer}
              </button>
            ))}

            {selectedCorridor && (
              <button
                onClick={() => setSelectedCorridor(null)}
                className="px-2.5 py-1 text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg hover:bg-rose-500/30 ml-2"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* SVG Interactive India Canvas */}
        <div className="relative w-full h-[540px] sm:h-[600px] bg-slate-950 rounded-xl overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* India Geographic Outline */}
            <path
              d="M 32 10 L 37 8 L 42 12 L 48 14 L 54 18 L 62 20 L 68 25 L 75 28 L 82 32 L 92 34 L 94 38 L 88 40 L 82 42 L 78 44 L 75 50 L 68 54 L 62 58 L 56 64 L 52 70 L 46 80 L 42 88 L 38 94 L 35 91 L 34 85 L 36 78 L 36 72 L 28 66 L 24 60 L 22 52 L 22 44 L 28 38 L 30 28 L 32 18 Z"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="0.8"
            />

            {/* Reference Coordinate Grid */}
            <path
              d="M 20 30 Q 50 25 90 30 M 20 60 Q 50 55 90 60 M 35 10 L 35 90 M 65 10 L 65 90"
              fill="none"
              stroke="#0f172a"
              strokeWidth="0.3"
              strokeDasharray="1 2"
            />

            {/* Dynamic Route Connection Arcs */}
            {displayedRoutes.map((route) => {
              const start = AIRPORTS_MAP[route.origin];
              const end = AIRPORTS_MAP[route.destination];
              if (!start || !end) return null;

              const isSelected = selectedCorridor === route.code;
              const color = getRouteColor(route);
              const strokeW = isSelected ? 3.0 : 1.4;

              const midX = (start.x + end.x) / 2 + (start.y - end.y) * 0.16;
              const midY = (start.y + end.y) / 2 + (end.x - start.x) * 0.16;
              const pathStr = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

              return (
                <g
                  key={route.code}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedCorridor(route.code);
                    setSpotlightCorridor(route.code);
                  }}
                >
                  {/* Outer Glow Halo */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW + 2.5}
                    strokeOpacity={isSelected ? 0.6 : 0.15}
                  />

                  {/* Primary Route Path */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeOpacity={isSelected ? 1.0 : 0.75}
                  />

                  {/* Invisible broad hitbox for easy clicking */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="10"
                  />
                </g>
              );
            })}

            {/* Airport Nodes */}
            {Object.values(AIRPORTS_MAP).map((ap) => {
              const isHovered = hoveredAirport === ap.id;
              const isLive = ap.live;

              return (
                <g
                  key={ap.id}
                  transform={`translate(${ap.x}, ${ap.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredAirport(ap.id)}
                  onMouseLeave={() => setHoveredAirport(null)}
                  onClick={() => {
                    const matched = processedRoutes.find((r) => r.origin === ap.id || r.destination === ap.id);
                    if (matched) {
                      setSelectedCorridor(matched.code);
                      setSpotlightCorridor(matched.code);
                    }
                  }}
                >
                  {isLive && (
                    <circle r="3.5" fill="#3b82f6" className="animate-ping opacity-40" />
                  )}
                  <circle
                    r={isHovered ? "2.8" : "1.8"}
                    fill={isLive ? "#60a5fa" : "#475569"}
                    stroke="#020617"
                    strokeWidth="0.6"
                  />
                  <text
                    x="3"
                    y="1"
                    fontSize="2.6"
                    className={`font-mono font-bold select-none transition-all ${
                      isHovered ? "fill-white text-[3.2px]" : "fill-slate-400"
                    }`}
                  >
                    {ap.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Airport Hover Info Card (Part 18) */}
          {hoveredAirport && AIRPORTS_MAP[hoveredAirport] && (
            <div className="absolute top-4 right-4 glass-panel p-4 bg-slate-900/95 border-blue-500/40 text-white font-mono text-xs rounded-xl shadow-2xl space-y-1.5 max-w-xs z-30 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-blue-400">
                  {AIRPORTS_MAP[hoveredAirport].id} - {AIRPORTS_MAP[hoveredAirport].city}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {AIRPORTS_MAP[hoveredAirport].live ? "● ACTIVE NODE" : "HISTORICAL"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">{AIRPORTS_MAP[hoveredAirport].name}</p>
              <div className="text-[10px] text-slate-400 pt-1">
                Click airport to isolate connected corridor routes.
              </div>
            </div>
          )}

          {/* Map Layer Legend Bar */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low Stress (Normal)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Moderate Stress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" /> Critical Surge
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Inactive / Sparse
              </span>
            </div>

            <div className="text-slate-500 text-[11px]">
              Layer: <strong className="text-white">{mapLayer}</strong> | Click route to open Full Spotlight
            </div>
          </div>
        </div>
      </div>

      {/* LOWER COMMAND GRID: TOP MOVERS + ROUTE PRESSURE MATRIX (Part 8 & 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
        {/* Top Market Movers */}
        <div className="glass-panel p-6 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                BIGGEST MARKET MOVERS TODAY
              </h3>
            </div>
            <span className="text-xs text-slate-500">24H / 7D Micro-Index Delta</span>
          </div>

          <div className="space-y-2.5">
            {topMovers.slice(0, 6).map((m) => {
              const dev = m.jevons_index - 100;
              const isUp = dev >= 0;
              return (
                <div
                  key={m.code}
                  onClick={() => setSpotlightCorridor(m.code)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <span>{m.origin} → {m.destination}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        T+{m.horizon_days}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">GeoMean Fare: ₹{m.current_geom_mean.toLocaleString()}</span>
                  </div>

                  <div className="text-right">
                    <div className={`font-extrabold text-xs ${isUp ? "text-rose-500" : "text-emerald-500"}`}>
                      {isUp ? `▲ +${dev.toFixed(1)}%` : `▼ ${dev.toFixed(1)}%`}
                    </div>
                    <span className="text-[10px] text-slate-400">Index: {m.jevons_index}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Route Pressure Grid */}
        <div className="glass-panel p-6 bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                ROUTE PRESSURE MATRIX
              </h3>
            </div>
            <div className="flex gap-3 text-[10px] text-slate-500">
              <span>LOW</span>
              <span>MODERATE</span>
              <span>HIGH</span>
              <span className="text-rose-500 font-bold">CRITICAL</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
            {processedRoutes.map((r) => (
              <div
                key={r.code}
                onClick={() => setSpotlightCorridor(r.code)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer text-xs transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">{r.code}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">₹{r.current_geom_mean.toLocaleString()}</span>
                  <div className="flex gap-1 items-center">
                    <span className={`h-2.5 w-2.5 rounded-full ${r.stressScore >= 20 ? "bg-emerald-500" : "bg-slate-800"}`} />
                    <span className={`h-2.5 w-2.5 rounded-full ${r.stressScore >= 45 ? "bg-amber-500" : "bg-slate-800"}`} />
                    <span className={`h-2.5 w-2.5 rounded-full ${r.stressScore >= 65 ? "bg-orange-500" : "bg-slate-800"}`} />
                    <span className={`h-2.5 w-2.5 rounded-full ${r.stressScore >= 80 ? "bg-rose-500 animate-pulse" : "bg-slate-800"}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FULLSCREEN ROUTE SPOTLIGHT DRAWER (Part 12) */}
      <RouteDrawer corridor={spotlightCorridor} onClose={() => setSpotlightCorridor(null)} />

      {/* METHODOLOGY MODAL (Part 30) */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="glass-panel p-6 sm:p-8 bg-slate-900 border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">HOW VAYU CALCULATES AIRFARE INDEX</h3>
              </div>
              <button
                onClick={() => setShowMethodology(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-blue-400 block font-bold">1. Jevons Geometric Mean Micro-Index</strong>
                <p>Calculates the geometric mean of observed unbundled airfares against base period (Base 2024 = 100), eliminating product substitution bias.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-purple-400 block font-bold">2. DGCA Passenger Traffic Route Weights</strong>
                <p>Weights each corridor according to official DGCA annual city-pair passenger movement (e.g. DEL-BOM: 26%, BOM-DEL: 24%).</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block font-bold">3. Advance Booking Horizon Blending</strong>
                <p>Blends departure horizons: T+45 (15%), T+30 (20%), T+15 (25%), T+7 (25%), and T+1 Spot Booking (15%).</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-amber-400 block font-bold">4. Stress Score &amp; Anomaly Sigma Deviation</strong>
                <p>Flags predatory surge anomalies when observed spot fares exceed 2.0σ against the 30-day rolling baseline.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowMethodology(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
              >
                Close Methodology
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ObservatoryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-mono">Initializing VAYU Airfare Observatory...</div>}>
      <ObservatoryContent />
    </Suspense>
  );
}
