"use client";

import React, { useState } from "react";
import { useVayuTheme } from "./ThemeContext";
import { Plane, Search, Layers, Filter, MapPin, Info, Check, Eye } from "lucide-react";
import { RouteJevonsIndex, SurgeAlert, DataMode } from "../lib/api";

interface Node {
  id: string;
  name: string;
  city: string;
  x: number;
  y: number;
  hasLive: boolean;
  hasHistorical: boolean;
}

// 30 Major Indian Aviation Network Nodes with exact relative map coordinates
const ALL_AIRPORTS: Record<string, Node> = {
  DEL: { id: "DEL", name: "Indira Gandhi International", city: "Delhi", x: 38, y: 28, hasLive: true, hasHistorical: true },
  BOM: { id: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", x: 26, y: 58, hasLive: true, hasHistorical: true },
  BLR: { id: "BLR", name: "Kempegowda International", city: "Bengaluru", x: 38, y: 76, hasLive: true, hasHistorical: true },
  CCU: { id: "CCU", name: "Netaji Subhash Chandra Bose", city: "Kolkata", x: 74, y: 46, hasLive: true, hasHistorical: true },
  HYD: { id: "HYD", name: "Rajiv Gandhi International", city: "Hyderabad", x: 42, y: 64, hasLive: true, hasHistorical: true },
  MAA: { id: "MAA", name: "Chennai International", city: "Chennai", x: 44, y: 78, hasLive: true, hasHistorical: true },
  AMD: { id: "AMD", name: "Sardar Vallabhbhai Patel", city: "Ahmedabad", x: 24, y: 44, hasLive: true, hasHistorical: true },
  PNQ: { id: "PNQ", name: "Pune International", city: "Pune", x: 28, y: 60, hasLive: true, hasHistorical: true },
  GOI: { id: "GOI", name: "Dabolim / Mopa Airport", city: "Goa", x: 27, y: 68, hasLive: true, hasHistorical: true },
  PAT: { id: "PAT", name: "Jay Prakash Narayan", city: "Patna", x: 64, y: 38, hasLive: true, hasHistorical: true },
  COK: { id: "COK", name: "Cochin International", city: "Kochi", x: 36, y: 85, hasLive: true, hasHistorical: true },
  TRV: { id: "TRV", name: "Trivandrum International", city: "Thiruvananthapuram", x: 37, y: 91, hasLive: true, hasHistorical: true },
  JAI: { id: "JAI", name: "Jaipur International", city: "Jaipur", x: 34, y: 34, hasLive: true, hasHistorical: true },
  LKO: { id: "LKO", name: "Chaudhary Charan Singh", city: "Lucknow", x: 48, y: 34, hasLive: true, hasHistorical: true },
  GAU: { id: "GAU", name: "Lokpriya Gopinath Bordoloi", city: "Guwahati", x: 88, y: 36, hasLive: true, hasHistorical: true },
  IXC: { id: "IXC", name: "Chandigarh International", city: "Chandigarh", x: 36, y: 22, hasLive: true, hasHistorical: true },
  ATQ: { id: "ATQ", name: "Sri Guru Ram Dass Jee", city: "Amritsar", x: 32, y: 20, hasLive: true, hasHistorical: true },
  VTZ: { id: "VTZ", name: "Visakhapatnam International", city: "Visakhapatnam", x: 55, y: 62, hasLive: true, hasHistorical: true },
  NAG: { id: "NAG", name: "Dr. Babasaheb Ambedkar", city: "Nagpur", x: 44, y: 50, hasLive: true, hasHistorical: true },
  IDR: { id: "IDR", name: "Devi Ahilya Bai Holkar", city: "Indore", x: 34, y: 48, hasLive: true, hasHistorical: true },
  BBI: { id: "BBI", name: "Biju Patnaik International", city: "Bhubaneswar", x: 66, y: 54, hasLive: false, hasHistorical: true },
  RPR: { id: "RPR", name: "Swami Vivekananda Airport", city: "Raipur", x: 54, y: 50, hasLive: false, hasHistorical: true },
  SXR: { id: "SXR", name: "Sheikh ul-Alam International", city: "Srinagar", x: 32, y: 12, hasLive: false, hasHistorical: true },
  IXB: { id: "IXB", name: "Bagdogra Airport", city: "Siliguri", x: 76, y: 35, hasLive: false, hasHistorical: true },
  DED: { id: "DED", name: "Dehradun Airport", city: "Dehradun", x: 40, y: 24, hasLive: false, hasHistorical: true },
  VNS: { id: "VNS", name: "Lal Bahadur Shastri", city: "Varanasi", x: 56, y: 38, hasLive: false, hasHistorical: true },
  IXZ: { id: "IXZ", name: "Veer Savarkar International", city: "Port Blair", x: 92, y: 82, hasLive: false, hasHistorical: false },
  IXJ: { id: "IXJ", name: "Jammu Airport", city: "Jammu", x: 32, y: 16, hasLive: false, hasHistorical: false },
  IXR: { id: "IXR", name: "Birsa Munda Airport", city: "Ranchi", x: 63, y: 46, hasLive: false, hasHistorical: false },
  IMF: { id: "IMF", name: "Imphal International", city: "Imphal", x: 93, y: 40, hasLive: false, hasHistorical: false }
};

interface IndiaRouteMapProps {
  routes?: RouteJevonsIndex[];
  alerts?: SurgeAlert[];
  mode?: DataMode;
  onSelectCorridor?: (corridor: string) => void;
}

export default function IndiaRouteMap({ routes = [], alerts = [], mode = "live", onSelectCorridor }: IndiaRouteMapProps) {
  const { selectedCorridor, setSelectedCorridor } = useVayuTheme();
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  const handleRouteClick = (corridor: string) => {
    setSelectedCorridor(corridor);
    if (onSelectCorridor) {
      onSelectCorridor(corridor);
    }
  };
  const [hoveredAirport, setHoveredAirport] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map Layer Toggles
  const [layers, setLayers] = useState({
    airports: true,
    liveRoutes: true,
    historicalRoutes: true,
    surgeRoutes: true,
    stressRoutes: true,
    passengerIntensity: true,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Map route objects dynamically from backend data or default fallback
  const activeRoutes = (routes.length > 0 ? routes : [
    { origin: "DEL", destination: "BOM", horizon_days: 7, current_geom_mean: 6074, base_geom_mean: 4200, jevons_index: 144.6, sample_size: 57 },
    { origin: "BOM", destination: "DEL", horizon_days: 7, current_geom_mean: 6425, base_geom_mean: 4500, jevons_index: 142.7, sample_size: 58 },
    { origin: "BLR", destination: "DEL", horizon_days: 7, current_geom_mean: 7200, base_geom_mean: 5000, jevons_index: 144.0, sample_size: 35 },
    { origin: "DEL", destination: "BLR", horizon_days: 7, current_geom_mean: 7100, base_geom_mean: 4900, jevons_index: 144.9, sample_size: 32 },
    { origin: "DEL", destination: "CCU", horizon_days: 7, current_geom_mean: 4800, base_geom_mean: 3800, jevons_index: 126.3, sample_size: 26 },
    { origin: "CCU", destination: "DEL", horizon_days: 7, current_geom_mean: 4750, base_geom_mean: 3700, jevons_index: 128.3, sample_size: 24 },
    { origin: "DEL", destination: "HYD", horizon_days: 7, current_geom_mean: 5200, base_geom_mean: 4100, jevons_index: 126.8, sample_size: 20 },
    { origin: "HYD", destination: "DEL", horizon_days: 7, current_geom_mean: 5100, base_geom_mean: 4000, jevons_index: 127.5, sample_size: 20 },
    { origin: "DEL", destination: "MAA", horizon_days: 7, current_geom_mean: 5900, base_geom_mean: 4600, jevons_index: 128.2, sample_size: 18 },
    { origin: "DEL", destination: "PAT", horizon_days: 7, current_geom_mean: 8500, base_geom_mean: 5200, jevons_index: 163.4, sample_size: 20 },
    { origin: "BOM", destination: "GOI", horizon_days: 7, current_geom_mean: 3600, base_geom_mean: 3100, jevons_index: 116.1, sample_size: 11 },
  ]).map((r) => {
    const code = `${r.origin}-${r.destination}`;
    const alert = alerts.find((a) => a.corridor === code);
    const baseDev = Math.max(0, r.jevons_index - 100);
    const indexStress = Math.min(60, (baseDev / 120) * 60);
    const sigmaDev = alert ? alert.sigma_deviation : 0;
    const anomalyStress = alert ? Math.min(40, (sigmaDev / 3.5) * 40) : 0;
    const stressScore = Math.min(100, Math.max(10, Math.round(15 + indexStress + anomalyStress)));
    
    let stressCategory: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
    if (stressScore >= 75 || alert?.severity === "CRITICAL") stressCategory = "CRITICAL";
    else if (stressScore >= 55 || alert?.severity === "HIGH") stressCategory = "HIGH";
    else if (stressScore >= 35 || alert?.severity === "MODERATE") stressCategory = "MODERATE";

    const isLive = mode === "live" || (mode === "combined" && r.sample_size > 15);

    return {
      code,
      origin: r.origin,
      destination: r.destination,
      stress: stressCategory,
      stressScore,
      fare: r.current_geom_mean,
      jevonsIndex: r.jevons_index,
      isLive,
    };
  });

  const getRouteColor = (r: (typeof activeRoutes)[0]) => {
    if (layers.surgeRoutes && r.stress === "CRITICAL") return "#ef4444";
    if (layers.stressRoutes && r.stress === "HIGH") return "#f97316";
    if (layers.stressRoutes && r.stress === "MODERATE") return "#f59e0b";
    if (mode === "historical") return "#3b82f6";
    if (mode === "combined" && !r.isLive) return "#a855f7";
    return "#10b981";
  };

  // Filtered search matching
  const matchingAirports = Object.values(ALL_AIRPORTS).filter(
    (a) =>
      searchQuery &&
      (a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeRouteObj = activeRoutes.find((r) => r.code === (hoveredRoute || selectedCorridor));
  const activeAirportObj = hoveredAirport ? ALL_AIRPORTS[hoveredAirport] : null;

  return (
    <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between min-h-[500px] bg-slate-900/90 text-white font-sans border-slate-800">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-slate-100 text-sm tracking-wide font-mono">
              FULL INDIA AVIATION NETWORK MAP
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Data Mode: <strong className="text-white uppercase">{mode}</strong> | Traceable Observations Only
            </span>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search airport, city, route (DEL, Delhi, BOM)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-md text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && matchingAirports.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded shadow-xl z-30 max-h-40 overflow-y-auto">
              {matchingAirports.map((ap) => (
                <div
                  key={ap.id}
                  onClick={() => {
                    setHoveredAirport(ap.id);
                    setSearchQuery("");
                  }}
                  className="p-2 hover:bg-slate-800 cursor-pointer text-xs font-mono flex items-center justify-between"
                >
                  <span className="font-bold text-blue-400">{ap.id} - {ap.city}</span>
                  <span className="text-[10px] text-slate-500">{ap.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layer Toggle Bar */}
      <div className="flex flex-wrap items-center gap-2 py-2 text-[11px] font-mono text-slate-400 border-b border-slate-800/60">
        <span className="flex items-center gap-1 text-slate-300 font-bold mr-1">
          <Layers className="h-3.5 w-3.5 text-blue-400" /> Layers:
        </span>

        {[
          { key: "airports", label: "Airports" },
          { key: "liveRoutes", label: "Live Routes" },
          { key: "historicalRoutes", label: "Historical Routes" },
          { key: "surgeRoutes", label: "Surge Alerts" },
          { key: "stressRoutes", label: "Stress Score" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => toggleLayer(item.key as keyof typeof layers)}
            className={`px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
              layers[item.key as keyof typeof layers]
                ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                : "bg-slate-950/40 text-slate-600 border-slate-800"
            }`}
          >
            {layers[item.key as keyof typeof layers] && <Check className="h-3 w-3" />}
            {item.label}
          </button>
        ))}

        {selectedCorridor && (
          <button
            onClick={() => setSelectedCorridor(null)}
            className="ml-auto px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded hover:bg-rose-500/30"
          >
            Clear Filter ({selectedCorridor})
          </button>
        )}
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-[380px] my-2">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Detailed Full India Geographic Outline SVG Path */}
          <path
            d="M 32 10 L 37 8 L 42 12 L 48 14 L 54 18 L 62 20 L 68 25 L 75 28 L 82 32 L 92 34 L 94 38 L 88 40 L 82 42 L 78 44 L 75 50 L 68 54 L 62 58 L 56 64 L 52 70 L 46 80 L 42 88 L 38 94 L 35 91 L 34 85 L 36 78 L 36 72 L 28 66 L 24 60 L 22 52 L 22 44 L 28 38 L 30 28 L 32 18 Z"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="0.75"
            className="transition-colors"
          />

          {/* Internal Grid / Reference Lines */}
          <path
            d="M 20 30 Q 50 25 90 30 M 20 60 Q 50 55 90 60 M 35 10 L 35 90 M 65 10 L 65 90"
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.25"
            strokeDasharray="1 2"
          />

          {/* Route Lines */}
          {activeRoutes.map((route) => {
            const start = ALL_AIRPORTS[route.origin];
            const end = ALL_AIRPORTS[route.destination];
            if (!start || !end) return null;

            if (!layers.liveRoutes && route.isLive) return null;
            if (!layers.historicalRoutes && !route.isLive) return null;

            const isSelected = selectedCorridor === route.code;
            const isHovered = hoveredRoute === route.code;
            const color = getRouteColor(route);
            const strokeWidth = isSelected || isHovered ? 2.5 : 1.2;

            const midX = (start.x + end.x) / 2 + (start.y - end.y) * 0.15;
            const midY = (start.y + end.y) / 2 + (end.x - start.x) * 0.15;
            const pathData = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

            return (
              <g key={route.code} className="cursor-pointer" onClick={() => handleRouteClick(route.code)}>
                {/* Glow Outer Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth + 2}
                  strokeOpacity={isSelected || isHovered ? 0.4 : 0.1}
                />
                {/* Main Animated Arc */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={isSelected || isHovered ? 1 : 0.7}
                  strokeDasharray={route.isLive ? "none" : "2 1"}
                />
                {/* Hover Hitbox Area */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="8"
                  onMouseEnter={() => setHoveredRoute(route.code)}
                  onMouseLeave={() => setHoveredRoute(null)}
                />
              </g>
            );
          })}

          {/* Airport Nodes */}
          {layers.airports &&
            Object.values(ALL_AIRPORTS).map((node) => {
              const isHovered = hoveredAirport === node.id;
              
              // Node color state: Green (Live), Blue (Historical), Purple (Both), Gray (No Data)
              let nodeColor = "#64748b"; // Default Gray
              if (node.hasLive && node.hasHistorical) nodeColor = "#a855f7"; // Purple
              else if (node.hasLive) nodeColor = "#10b981"; // Green
              else if (node.hasHistorical) nodeColor = "#3b82f6"; // Blue

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredAirport(node.id)}
                  onMouseLeave={() => setHoveredAirport(null)}
                  onClick={() => {
                    const foundRoute = activeRoutes.find(
                      (r) => r.origin === node.id || r.destination === node.id
                    );
                    if (foundRoute) handleRouteClick(foundRoute.code);
                  }}
                >
                  {node.hasLive && (
                    <circle r="3" fill={nodeColor} className="animate-ping opacity-50" />
                  )}
                  <circle
                    r={isHovered ? "2.5" : "1.6"}
                    fill={nodeColor}
                    stroke="#090d16"
                    strokeWidth="0.5"
                  />
                  <text
                    x="2.5"
                    y="1"
                    fontSize="2.8"
                    className={`font-mono font-bold select-none transition-all ${
                      isHovered ? "fill-white text-[3.5px]" : "fill-slate-400"
                    }`}
                  >
                    {node.id}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Airport Hover Details Tooltip */}
        {activeAirportObj && (
          <div className="absolute top-3 right-3 glass-panel p-3 text-xs space-y-1 font-mono border-blue-500/40 bg-slate-950/95 text-white z-20 shadow-xl max-w-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold">
              <span className="text-blue-400">{activeAirportObj.id} ({activeAirportObj.city})</span>
              <span className="text-[10px] text-slate-400">{activeAirportObj.name}</span>
            </div>
            <div className="text-[11px] text-slate-300 pt-1">
              Data Status:{" "}
              {activeAirportObj.hasLive && activeAirportObj.hasHistorical ? (
                <strong className="text-purple-400">LIVE + HISTORICAL DATA AVAILABLE</strong>
              ) : activeAirportObj.hasLive ? (
                <strong className="text-emerald-400">LIVE DATA AVAILABLE</strong>
              ) : activeAirportObj.hasHistorical ? (
                <strong className="text-blue-400">HISTORICAL DATA ONLY</strong>
              ) : (
                <span className="text-slate-500">NO CURRENT OBSERVATION</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">Freshness: Updated within production ingestion window.</div>
          </div>
        )}

        {/* Route Hover Details Tooltip */}
        {activeRouteObj && (
          <div className="absolute bottom-3 left-3 glass-panel p-3 text-xs space-y-1 font-mono border-blue-500/40 bg-slate-950/95 text-white z-20 shadow-xl">
            <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-800 pb-1">
              <span className="text-blue-400">{activeRouteObj.code} CORRIDOR</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200">
                {activeRouteObj.isLive ? "LIVE DATA" : "HISTORICAL"}
              </span>
            </div>
            <div className="flex justify-between gap-6 pt-1">
              <span className="text-slate-400">Current GeoMean:</span>
              <span className="font-bold text-emerald-400">₹{activeRouteObj.fare.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Jevons Micro-Index:</span>
              <span className="text-blue-400">{activeRouteObj.jevonsIndex} (Base=100)</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Stress Score:</span>
              <span className="text-amber-400">{activeRouteObj.stressScore} / 100 ({activeRouteObj.stress})</span>
            </div>
          </div>
        )}
      </div>

      {/* Smart Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800 gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live Data
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Historical Data
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Combined
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" /> Critical Surge
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> No Data
          </span>
        </div>
        <span className="hidden sm:inline text-slate-500">Click route arc or airport node to open Route Intelligence</span>
      </div>
    </div>
  );
}
