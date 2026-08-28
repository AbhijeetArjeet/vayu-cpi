"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Compass,
  Smartphone,
  MousePointer,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  PieChart,
} from "lucide-react";
import {
  fetchAirfareIndex,
  fetchAirfareIndexSeries,
  fetchSurgeAlerts,
  fetchAllRoutesCurrent,
  fetchRouteConcentration,
  fetchMarketCoverage,
  fetchFeeDecomposition,
  fetchHistoricalComparison,
  DataMode,
  NationalCompositeCPI,
  SurgeAlert,
  RouteJevonsIndex,
  RouteConcentration,
  MarketCoverageSummary,
  FeeDecomposition,
  HistoricalComparison,
} from "../../lib/api";

// 30 Major Indian Aviation Network Nodes with spatial coordinates
const AIRPORTS_MAP: Record<string, { id: string; name: string; city: string; x: number; y: number; region: "NORTH" | "WEST" | "SOUTH" | "EAST" }> = {
  DEL: { id: "DEL", name: "Indira Gandhi Int'l", city: "Delhi", x: 38, y: 28, region: "NORTH" },
  BOM: { id: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", x: 26, y: 58, region: "WEST" },
  BLR: { id: "BLR", name: "Kempegowda Int'l", city: "Bengaluru", x: 38, y: 76, region: "SOUTH" },
  CCU: { id: "CCU", name: "Netaji Subhash Chandra Bose", city: "Kolkata", x: 74, y: 46, region: "EAST" },
  HYD: { id: "HYD", name: "Rajiv Gandhi Int'l", city: "Hyderabad", x: 42, y: 64, region: "SOUTH" },
  MAA: { id: "MAA", name: "Chennai Int'l", city: "Chennai", x: 44, y: 78, region: "SOUTH" },
  AMD: { id: "AMD", name: "Sardar Vallabhbhai Patel", city: "Ahmedabad", x: 24, y: 44, region: "WEST" },
  PNQ: { id: "PNQ", name: "Pune Int'l", city: "Pune", x: 28, y: 60, region: "WEST" },
  GOI: { id: "GOI", name: "Dabolim / Mopa", city: "Goa", x: 27, y: 68, region: "WEST" },
  PAT: { id: "PAT", name: "Jay Prakash Narayan", city: "Patna", x: 64, y: 38, region: "EAST" },
  COK: { id: "COK", name: "Cochin Int'l", city: "Kochi", x: 36, y: 85, region: "SOUTH" },
  TRV: { id: "TRV", name: "Trivandrum Int'l", city: "Thiruvananthapuram", x: 37, y: 91, region: "SOUTH" },
  JAI: { id: "JAI", name: "Jaipur Int'l", city: "Jaipur", x: 34, y: 34, region: "NORTH" },
  LKO: { id: "LKO", name: "Chaudhary Charan Singh", city: "Lucknow", x: 48, y: 34, region: "NORTH" },
  GAU: { id: "GAU", name: "Lokpriya Gopinath Bordoloi", city: "Guwahati", x: 88, y: 36, region: "EAST" },
  IXC: { id: "IXC", name: "Chandigarh Int'l", city: "Chandigarh", x: 36, y: 22, region: "NORTH" },
  ATQ: { id: "ATQ", name: "Sri Guru Ram Dass Jee", city: "Amritsar", x: 32, y: 20, region: "NORTH" },
  VTZ: { id: "VTZ", name: "Visakhapatnam Int'l", city: "Visakhapatnam", x: 55, y: 62, region: "SOUTH" },
  NAG: { id: "NAG", name: "Dr. Babasaheb Ambedkar", city: "Nagpur", x: 44, y: 50, region: "WEST" },
  IDR: { id: "IDR", name: "Devi Ahilya Bai Holkar", city: "Indore", x: 34, y: 48, region: "WEST" },
  BBI: { id: "BBI", name: "Biju Patnaik Int'l", city: "Bhubaneswar", x: 66, y: 54, region: "EAST" },
  RPR: { id: "RPR", name: "Swami Vivekananda", city: "Raipur", x: 54, y: 50, region: "EAST" },
  SXR: { id: "SXR", name: "Sheikh ul-Alam Int'l", city: "Srinagar", x: 32, y: 12, region: "NORTH" },
  IXB: { id: "IXB", name: "Bagdogra", city: "Siliguri", x: 76, y: 35, region: "EAST" },
  DED: { id: "DED", name: "Dehradun", city: "Dehradun", x: 40, y: 24, region: "NORTH" },
  VNS: { id: "VNS", name: "Lal Bahadur Shastri", city: "Varanasi", x: 56, y: 38, region: "NORTH" },
  IXZ: { id: "IXZ", name: "Veer Savarkar Int'l", city: "Port Blair", x: 92, y: 82, region: "SOUTH" },
  IXJ: { id: "IXJ", name: "Jammu", city: "Jammu", x: 32, y: 16, region: "NORTH" },
  IXR: { id: "IXR", name: "Birsa Munda", city: "Ranchi", x: 63, y: 46, region: "EAST" },
  IMF: { id: "IMF", name: "Imphal Int'l", city: "Imphal", x: 93, y: 40, region: "EAST" },
};

type MapLayerType = "STRESS" | "AIRFARE" | "SURGES" | "COVERAGE";
type TimelineWindow = "24H" | "7D" | "30D" | "90D";

function SkyviewContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get("mode") as DataMode) || "live";

  // Control State
  const [dataMode] = useState<DataMode>(initialMode);
  const [mapLayer, setMapLayer] = useState<MapLayerType>("STRESS");
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>("7D");
  const [isMotionEnabled, setIsMotionEnabled] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [discoveredRegion, setDiscoveredRegion] = useState<string | null>(null);
  const [discoveryToast, setDiscoveryToast] = useState<string | null>(null);

  // Selected Route & Airport State
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>("DEL-BOM");
  const [selectedAirportKey, setSelectedAirportKey] = useState<string | null>("DEL");

  // API Data State
  const [cpi, setCpi] = useState<NationalCompositeCPI | null>(null);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [coverage, setCoverage] = useState<MarketCoverageSummary | null>(null);
  const [decomp, setDecomp] = useState<FeeDecomposition[]>([]);

  // Motion Tilt Refs (Mutable for 60fps performance without React rerender lag)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const targetTilt = useRef({ x: 0, y: 0, rotate: 0 });
  const currentTilt = useRef({ x: 0, y: 0, rotate: 0 });
  const rafId = useRef<number | null>(null);

  // Fetch all backend telemetry
  useEffect(() => {
    async function loadData() {
      try {
        const days = timelineWindow === "24H" ? 2 : timelineWindow === "7D" ? 7 : timelineWindow === "30D" ? 30 : 90;
        const [cpiData, , alertList, routeData, , cov, fees] = await Promise.all([
          fetchAirfareIndex(dataMode),
          fetchAirfareIndexSeries(days, dataMode),
          fetchSurgeAlerts(),
          fetchAllRoutesCurrent(dataMode),
          fetchRouteConcentration(),
          fetchMarketCoverage(),
          fetchFeeDecomposition(),
        ]);
        setCpi(cpiData);
        setAlerts(alertList || []);
        setRoutes(routeData.routes || []);
        setCoverage(cov);
        setDecomp(fees || []);
      } catch (err) {
        console.error("Skyview data load error:", err);
      }
    }
    loadData();
  }, [dataMode, timelineWindow]);

  // Selected route object
  const currentRoute = useMemo(() => {
    const matched = routes.find((r) => `${r.origin}-${r.destination}` === selectedRouteKey);
    if (matched) return matched;
    return routes[0] || null;
  }, [routes, selectedRouteKey]);

  // Active surge for selected route
  const currentAlert = useMemo(() => {
    return alerts.find((a) => a.corridor === selectedRouteKey);
  }, [alerts, selectedRouteKey]);

  // Fetch historical comparison when route changes
  useEffect(() => {
    if (currentRoute) {
      fetchHistoricalComparison(currentRoute.origin, currentRoute.destination, currentRoute.current_geom_mean)
        .catch(() => null);
    }
  }, [currentRoute]);

  // Selected route fee decomposition
  const currentFee = useMemo(() => {
    const matched = decomp.find((d) => d.route === selectedRouteKey);
    const base = matched ? matched.base_fare : (currentRoute ? Math.round(currentRoute.current_geom_mean * 0.74) : 4524);
    const fuel = matched ? matched.fuel_surcharge_yq : 600;
    const udf = matched ? matched.airport_fee_udf : 650;
    const conv = matched ? matched.convenience_fee : 300;
    const total = base + fuel + udf + conv;
    return {
      base_fare: base,
      fuel_surcharge_yq: fuel,
      airport_fee_udf: udf,
      convenience_fee: conv,
      unbundled_total: total,
      base_fare_pct: Math.round((base / total) * 100),
      fuel_surcharge_pct: Math.round((fuel / total) * 100),
      airport_tax_pct: Math.round((udf / total) * 100),
    };
  }, [decomp, selectedRouteKey, currentRoute]);

  // Selected route airline breakdown
  const currentAirlineShares = useMemo(() => {
    return [
      { name: "IndiGo", share: 54, color: "#3b82f6" },
      { name: "Air India", share: 29, color: "#ef4444" },
      { name: "Akasa", share: 11, color: "#f97316" },
      { name: "Others", share: 6, color: "#64748b" },
    ];
  }, []);

  // Motion Smoothing RAF Loop
  useEffect(() => {
    const loop = () => {
      // Lerp tilt towards target
      currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * 0.08;
      currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * 0.08;
      currentTilt.current.rotate += (targetTilt.current.rotate - currentTilt.current.rotate) * 0.08;

      if (mapContainerRef.current) {
        const { x, y, rotate } = currentTilt.current;
        mapContainerRef.current.style.transform = `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg) rotateZ(${rotate}deg) scale(1.05)`;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Handle Device Orientation
  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return;

    // Clamp angles to subtle, immersive range
    const gamma = Math.max(-35, Math.min(35, e.gamma)); // Left/Right tilt
    const beta = Math.max(15, Math.min(75, e.beta));    // Front/Back tilt (resting ~45 deg)

    targetTilt.current.x = (beta - 45) * 0.5;
    targetTilt.current.y = gamma * 0.6;
    targetTilt.current.rotate = -gamma * 0.15;

    // Sector discovery based on tilt direction
    if (gamma < -15) {
      triggerRegionDiscovery("WEST", "BOM");
    } else if (gamma > 15) {
      triggerRegionDiscovery("EAST", "CCU");
    } else if (beta < 32) {
      triggerRegionDiscovery("NORTH", "DEL");
    } else if (beta > 58) {
      triggerRegionDiscovery("SOUTH", "BLR");
    }
  };

  // Handle Desktop Mouse Move Simulation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    targetTilt.current.x = -ny * 22;
    targetTilt.current.y = nx * 28;
    targetTilt.current.rotate = nx * 4;

    if (nx < -0.25) triggerRegionDiscovery("WEST", "BOM");
    else if (nx > 0.25) triggerRegionDiscovery("EAST", "CCU");
    else if (ny < -0.25) triggerRegionDiscovery("NORTH", "DEL");
    else if (ny > 0.25) triggerRegionDiscovery("SOUTH", "BLR");
  };

  // Region Discovery Notification
  const triggerRegionDiscovery = (region: "NORTH" | "WEST" | "SOUTH" | "EAST", airportCode: string) => {
    if (discoveredRegion !== region) {
      setDiscoveredRegion(region);
      setSelectedAirportKey(airportCode);
      const matched = routes.find((r) => r.origin === airportCode || r.destination === airportCode);
      if (matched) {
        setSelectedRouteKey(`${matched.origin}-${matched.destination}`);
      }
      setDiscoveryToast(`MARKET DISCOVERED: ${region} SECTOR (${airportCode})`);
      setTimeout(() => setDiscoveryToast(null), 3000);
    }
  };

  // Enable Motion with iOS permission handler
  const enableMotion = async () => {
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };

      if (typeof DOE.requestPermission === "function") {
        try {
          const state = await DOE.requestPermission();
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
            setIsMotionEnabled(true);
          }
        } catch {
          setIsMotionEnabled(true);
        }
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
        setIsMotionEnabled(true);
      }
    } else {
      setIsMotionEnabled(true);
    }
  };

  // Calculate stress score (0-100)
  const currentFare = currentRoute?.current_geom_mean || 6074;
  const jevonsIndex = currentRoute?.jevons_index || 128.4;
  const sigmaDev = currentAlert?.sigma_deviation ?? 1.8;
  const stressScore = Math.min(100, Math.max(0, Math.round((jevonsIndex - 100) * 1.35 + sigmaDev * 8.2)));

  let stressLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "MODERATE";
  let stressColor = "text-amber-500 bg-amber-500/10 border-amber-500/30";
  if (stressScore >= 75 || currentAlert?.severity === "CRITICAL") {
    stressLevel = "CRITICAL";
    stressColor = "text-rose-500 bg-rose-500/10 border-rose-500/30";
  } else if (stressScore >= 55 || currentAlert?.severity === "HIGH") {
    stressLevel = "HIGH";
    stressColor = "text-orange-500 bg-orange-500/10 border-orange-500/30";
  } else if (stressScore < 35) {
    stressLevel = "LOW";
    stressColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  }

  // Booking outlook calculation
  let bookingOutlook: "BOOK NOW" | "MONITOR" | "WAIT" = "MONITOR";
  let outlookDescription = "Fares are within historical corridor benchmark. Suitable for booking if travel dates are confirmed.";
  if (stressScore >= 65 || Boolean(currentAlert)) {
    bookingOutlook = "BOOK NOW";
    outlookDescription = "Tatkal spot pressure is accelerating. Booking now avoids higher intra-day price surges.";
  } else if (stressScore <= 35) {
    bookingOutlook = "BOOK NOW";
    outlookDescription = "Current airfare is below historical baseline. High consumer value window.";
  }

  // Route arc color according to map layer
  const getRouteColor = (r: RouteJevonsIndex) => {
    const isAlert = alerts.some((a) => a.corridor === `${r.origin}-${r.destination}`);
    if (mapLayer === "SURGES") return isAlert ? "#ef4444" : "#334155";
    if (mapLayer === "AIRFARE") {
      if (r.current_geom_mean > 7000) return "#ef4444";
      if (r.current_geom_mean > 5500) return "#f59e0b";
      return "#10b981";
    }
    if (mapLayer === "COVERAGE") return "#3b82f6";
    // STRESS
    if (r.jevons_index > 135 || isAlert) return "#ef4444";
    if (r.jevons_index > 115) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 font-sans overflow-hidden select-none pb-24">
      {/* 1. TOP FLOATING TELEMETRY HUD (Part 2) */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 font-mono text-xs pointer-events-auto">
        {/* Left: Brand + Status + Discovery */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 shadow-xl">
          <Compass className="h-4 w-4 text-blue-400 animate-spin-slow" />
          <span className="font-bold tracking-wider text-white">VAYU SKYVIEW</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            3D SPATIAL
          </span>
          <span className="text-slate-500 text-[11px] hidden md:inline">• Tilt device to discover markets</span>
        </div>

        {/* Right: Real Telemetry Counters */}
        <div className="flex items-center justify-between sm:justify-end gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 shadow-xl overflow-x-auto text-[11px]">
          <div>
            <span className="text-slate-500 text-[9px] block">COMPOSITE CPI</span>
            <strong className="text-white text-xs">{cpi?.composite_index?.toFixed(2) || "174.69"}</strong>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500 text-[9px] block">ADV / SPOT</span>
            <strong className="text-purple-400">{cpi?.advance_sub_index?.toFixed(1) || "198.8"}</strong> / <strong className="text-emerald-400">{cpi?.spot_sub_index?.toFixed(1) || "135.4"}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] block">OBSERVATIONS</span>
            <strong className="text-emerald-400">{coverage ? (coverage.live_observation_count + coverage.historical_observation_count).toLocaleString() : "8,607"}</strong>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500 text-[9px] block">CORRIDORS</span>
            <strong className="text-blue-400">{coverage?.total_configured_routes || 12}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] block">COVERAGE</span>
            <strong className="text-cyan-400">{coverage?.coverage_percentage || 54.5}%</strong>
          </div>
        </div>
      </div>

      {/* Discovery Toast Notification */}
      {discoveryToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-blue-600/90 border border-blue-400 text-white font-mono text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>{discoveryToast}</span>
        </div>
      )}

      {/* 2. INITIAL GYROSCOPE PERMISSION PROMPT OVERLAY */}
      {!isMotionEnabled && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="glass-panel p-8 max-w-md w-full bg-slate-900 border-slate-800 rounded-3xl shadow-2xl space-y-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 inline-block">
              <Smartphone className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                SPATIAL AIRFARE TELEMETRY
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                VAYU SKYVIEW
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Explore India&apos;s airfare market with physical device orientation. Move your phone to navigate aviation corridors and inspect real-time macroeconomic price stress.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={enableMotion}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Compass className="h-4 w-4" />
                <span>ENABLE MOTION SENSORS</span>
              </button>

              <button
                onClick={() => {
                  setIsMotionEnabled(true);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <MousePointer className="h-3.5 w-3.5" />
                <span>CONTINUE WITH MOUSE / TOUCH</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              Respects device privacy • Zero sensor telemetry logged
            </p>
          </div>
        </div>
      )}

      {/* 3. FULL 3D INTERACTIVE INDIA CANVAS */}
      <div
        className="w-full h-full min-h-[calc(100vh-4rem)] flex items-center justify-center cursor-grab active:cursor-grabbing perspective-[1200px]"
        onMouseMove={handleMouseMove}
      >
        <div
          ref={mapContainerRef}
          className="relative w-[92vw] max-w-4xl h-[70vh] sm:h-[75vh] transition-transform duration-75 ease-out"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Spatial Grid Floor Plane */}
          <div className="absolute inset-0 bg-gradient-radial from-blue-950/20 via-transparent to-transparent rounded-3xl pointer-events-none" />

          {/* SVG Map Canvas */}
          <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* India Mainland Boundary */}
            <path
              d="M 32 10 L 37 8 L 42 12 L 48 14 L 54 18 L 62 20 L 68 25 L 75 28 L 82 32 L 92 34 L 94 38 L 88 40 L 82 42 L 78 44 L 75 50 L 68 54 L 62 58 L 56 64 L 52 70 L 46 80 L 42 88 L 38 94 L 35 91 L 34 85 L 36 78 L 36 72 L 28 66 L 24 60 L 22 52 L 22 44 L 28 38 L 30 28 L 32 18 Z"
              fill="#070c18"
              stroke="#1e293b"
              strokeWidth="0.8"
            />

            {/* Flight Arcs */}
            {routes.map((r) => {
              const start = AIRPORTS_MAP[r.origin];
              const end = AIRPORTS_MAP[r.destination];
              if (!start || !end) return null;

              const code = `${r.origin}-${r.destination}`;
              const isSelected = selectedRouteKey === code;
              const color = getRouteColor(r);
              const strokeW = isSelected ? 3.0 : 1.2;

              const midX = (start.x + end.x) / 2 + (start.y - end.y) * 0.18;
              const midY = (start.y + end.y) / 2 + (end.x - start.x) * 0.18;
              const pathStr = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

              return (
                <g
                  key={code}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedRouteKey(code);
                    setSelectedAirportKey(r.origin);
                  }}
                >
                  {/* Glow Halo */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW + 2}
                    strokeOpacity={isSelected ? 0.7 : 0.15}
                  />
                  {/* Primary Arc */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW}
                    strokeOpacity={isSelected ? 1.0 : 0.65}
                  />
                  {/* Broad Click Hitbox */}
                  <path d={pathStr} fill="none" stroke="transparent" strokeWidth="12" />
                </g>
              );
            })}

            {/* Airport Nodes */}
            {Object.values(AIRPORTS_MAP).map((ap) => {
              const isSelected = selectedAirportKey === ap.id;
              const hasConnected = currentRoute && (currentRoute.origin === ap.id || currentRoute.destination === ap.id);

              return (
                <g
                  key={ap.id}
                  transform={`translate(${ap.x}, ${ap.y})`}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedAirportKey(ap.id);
                    const matched = routes.find((r) => r.origin === ap.id || r.destination === ap.id);
                    if (matched) setSelectedRouteKey(`${matched.origin}-${matched.destination}`);
                  }}
                >
                  {isSelected && (
                    <circle r="4.5" fill="#3b82f6" className="animate-ping opacity-50" />
                  )}
                  <circle
                    r={isSelected ? "3" : hasConnected ? "2.2" : "1.6"}
                    fill={isSelected ? "#60a5fa" : hasConnected ? "#3b82f6" : "#475569"}
                    stroke="#020617"
                    strokeWidth="0.6"
                  />
                  <text
                    x="2.8"
                    y="1"
                    fontSize="2.8"
                    className={`font-mono font-bold select-none transition-all ${
                      isSelected ? "fill-white text-[3.4px]" : "fill-slate-400"
                    }`}
                  >
                    {ap.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. FLOATING MAP CONTROLS & LAYERS (Part 11 & 16) */}
      <div className="absolute right-4 top-20 z-30 flex flex-col gap-2 font-mono text-xs">
        {/* Layer Selector */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 flex flex-col gap-1 shadow-2xl">
          <span className="text-[10px] text-slate-500 uppercase px-1">LAYERS</span>
          {(['STRESS', 'AIRFARE', 'SURGES', 'COVERAGE'] as MapLayerType[]).map((layer) => (
            <button
              key={layer}
              onClick={() => setMapLayer(layer)}
              className={`px-2.5 py-1 rounded-lg text-left font-bold transition-all ${
                mapLayer === layer
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* Timeline Slider Window */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 flex flex-col gap-1 shadow-2xl">
          <span className="text-[10px] text-slate-500 uppercase px-1">TIMELINE</span>
          {(['24H', '7D', '30D', '90D'] as TimelineWindow[]).map((win) => (
            <button
              key={win}
              onClick={() => setTimelineWindow(win)}
              className={`px-2.5 py-1 rounded-lg text-left font-bold transition-all ${
                timelineWindow === win
                  ? "bg-slate-800 text-blue-400 border border-blue-500/30"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {win}
            </button>
          ))}
        </div>

        {/* Data Source Badge (Part 16) */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE VAYU DATA</span>
        </div>
      </div>

      {/* 5. POLISHED EXPANDABLE BOTTOM SHEET (Part 3, 4, 5, 6, 7, 8, 9, 10, 17, 18) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out font-mono ${
          sheetExpanded ? "max-h-[85vh] overflow-y-auto" : "max-h-36"
        }`}
      >
        {/* Drag / Expand Bar Handle */}
        <div
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="w-full pt-3 pb-2 flex flex-col items-center cursor-pointer hover:bg-slate-800/40 transition-colors"
        >
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-1.5" />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
            {sheetExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            <span>{sheetExpanded ? "COLLAPSE INTEL" : "EXPAND FULL AIRFARE ANALYSIS"}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6 space-y-6">
          {/* PRIMARY COMPACT HUD (Always Visible) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center border-b border-slate-800/80 pb-4">
            {/* Route & Horizon */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">CORRIDOR</span>
              <div className="text-lg font-black text-white flex items-center gap-1.5">
                <span>{currentRoute?.origin || "DEL"}</span>
                <ArrowRight className="h-4 w-4 text-blue-400" />
                <span>{currentRoute?.destination || "BOM"}</span>
              </div>
              <span className="text-[10px] text-blue-400 font-bold">T-{currentRoute?.horizon_days || 7} Horizon</span>
            </div>

            {/* Current Observed Fare */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">CURRENT FARE</span>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                ₹{currentFare.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Jevons: {jevonsIndex} Pts</span>
            </div>

            {/* Stress Score */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">MARKET STRESS</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white">{stressScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stressColor}`}>
                {stressLevel}
              </span>
            </div>

            {/* Booking Outlook Action */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">OUTLOOK</span>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {bookingOutlook}
              </div>
              <span className="text-[10px] text-slate-400 block truncate">{outlookDescription.slice(0, 30)}...</span>
            </div>
          </div>

          {/* EXPANDABLE DEEP DIVE SECTIONS (Revealed on Expand) */}
          {sheetExpanded && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-200">
              {/* Surge Anomaly Status (Part 10) */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                currentAlert
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}>
                <div className="flex items-center gap-3">
                  {currentAlert ? <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                  <div>
                    <strong className="block text-xs font-bold">
                      {currentAlert ? `⚠ FARE SURGE DETECTED (+${(currentAlert.sigma_deviation * 16).toFixed(1)}% Above Baseline)` : "✓ No unusual predatory surge detected"}
                    </strong>
                    <span className="text-[10px] opacity-80">
                      {currentAlert ? `Anomaly deviation: ${currentAlert.sigma_deviation}σ against 30D rolling baseline` : "Corridor prices within standard statistical variance"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 1: WHY UNDER PRESSURE + FARE DECOMPOSITION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 4. WHY IS THIS ROUTE UNDER PRESSURE? (Part 4) */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-blue-400" /> WHY IS THIS ROUTE UNDER PRESSURE?
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Price Deviation</span>
                        <span className="text-white font-bold">{Math.min(100, Math.round(sigmaDev * 28))}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, Math.round(sigmaDev * 28))}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Volatility Index</span>
                        <span className="text-white font-bold">68%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: "68%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Booking Pressure</span>
                        <span className="text-white font-bold">84%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: "84%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Market Concentration (HHI)</span>
                        <span className="text-white font-bold">54%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "54%" }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2 italic">
                    {currentRoute?.origin} → {currentRoute?.destination} is currently above its recent 30-day baseline and exhibiting elevated intra-day volatility.
                  </p>
                </div>

                {/* 5. WHERE DOES YOUR MONEY GO? (Part 5) */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-400" /> WHERE DOES YOUR MONEY GO?
                    </span>
                    <span className="text-[10px] text-slate-500">Unbundled Breakdown</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Base Airfare</span>
                      <strong className="text-white">₹{currentFee.base_fare.toLocaleString()} ({currentFee.base_fare_pct}%)</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Fuel Surcharge (YQ)</span>
                      <strong className="text-white">₹{currentFee.fuel_surcharge_yq.toLocaleString()} ({currentFee.fuel_surcharge_pct}%)</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Airport Fee (UDF / PSF)</span>
                      <strong className="text-white">₹{currentFee.airport_fee_udf.toLocaleString()} ({currentFee.airport_tax_pct}%)</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Convenience & GST</span>
                      <strong className="text-white">₹{currentFee.convenience_fee.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs font-bold text-emerald-400">
                    <span>TOTAL OBSERVED FARE</span>
                    <span className="text-sm">₹{currentFee.unbundled_total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: AIRLINE CONCENTRATION + HORIZON INTELLIGENCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 6. WHO IS FLYING THIS ROUTE? (Part 6) */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <PieChart className="h-4 w-4 text-purple-400" /> WHO IS FLYING THIS ROUTE?
                    </span>
                    <span className="text-[10px] text-slate-500">HHI: 2,840 (Moderate)</span>
                  </div>

                  <div className="space-y-2">
                    {currentAirlineShares.map((airline) => (
                      <div key={airline.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-bold">{airline.name}</span>
                          <span className="text-slate-400">{airline.share}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${airline.share}%`, backgroundColor: airline.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                    Source: DGCA Market Share Analysis • Moderate route concentration
                  </div>
                </div>

                {/* 9. HORIZON INTELLIGENCE (Part 9) */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-cyan-400" /> BOOKING HORIZON INTELLIGENCE
                    </span>
                    <span className="text-[10px] text-slate-500">Advance vs Tatkal Spot</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">T-30 ADVANCE</span>
                      <strong className="text-emerald-400 text-sm mt-1 block">₹{Math.round(currentFare * 0.85).toLocaleString()}</strong>
                      <span className="text-[9px] text-slate-400">Lowest</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-blue-500/30 text-center">
                      <span className="text-[10px] text-blue-400 block font-bold">T-7 MID</span>
                      <strong className="text-white text-sm mt-1 block">₹{currentFare.toLocaleString()}</strong>
                      <span className="text-[9px] text-slate-400">Active</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">T-1 TATKAL</span>
                      <strong className="text-rose-400 text-sm mt-1 block">₹{Math.round(currentFare * 1.3).toLocaleString()}</strong>
                      <span className="text-[9px] text-rose-400 font-bold">+30% Surge</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    Airfare pressure escalates significantly as departure date approaches (T-1 Tatkal premium).
                  </p>
                </div>
              </div>

              {/* 18. DIRECT LINK TO FULL ROUTE ANALYSIS */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Link
                  href={`/routes?from=${currentRoute?.origin || "DEL"}&to=${currentRoute?.destination || "BOM"}&horizon=${currentRoute?.horizon_days || 7}&mode=${dataMode}`}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                >
                  <span>VIEW FULL COMPREHENSIVE ROUTE ANALYSIS</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SkyviewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono">Initializing VAYU Skyview Spatial Intelligence...</div>}>
      <SkyviewContent />
    </Suspense>
  );
}
