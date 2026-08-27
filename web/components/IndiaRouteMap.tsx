"use client";

import React, { useState } from "react";
import { useVayuTheme } from "./ThemeContext";
import { Plane, Zap, Info, Filter } from "lucide-react";

interface Node {
  id: string;
  name: string;
  x: number; // SVG % coordinate
  y: number;
}

interface RouteArc {
  id: string;
  from: string;
  to: string;
  weight: number;
  stress: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  fare: number;
  stressScore: number;
}

const AIRPORTS: Record<string, Node> = {
  DEL: { id: "DEL", name: "Delhi (IGI)", x: 38, y: 32 },
  BOM: { id: "BOM", name: "Mumbai (CSMI)", x: 26, y: 58 },
  BLR: { id: "BLR", name: "Bengaluru (KIAL)", x: 37, y: 76 },
  CCU: { id: "CCU", name: "Kolkata (NSCBI)", x: 74, y: 46 },
  PAT: { id: "PAT", name: "Patna (JPNA)", x: 64, y: 40 },
  GOI: { id: "GOI", name: "Goa (Dabolim)", x: 28, y: 68 },
  MAA: { id: "MAA", name: "Chennai", x: 44, y: 78 },
  HYD: { id: "HYD", name: "Hyderabad", x: 40, y: 64 },
};

const ROUTES: RouteArc[] = [
  { id: "DEL-BOM", from: "DEL", to: "BOM", weight: 0.26, stress: "CRITICAL", fare: 15500, stressScore: 82 },
  { id: "BOM-DEL", from: "BOM", to: "DEL", weight: 0.24, stress: "HIGH", fare: 12400, stressScore: 76 },
  { id: "BLR-DEL", from: "BLR", to: "DEL", weight: 0.20, stress: "MODERATE", fare: 8500, stressScore: 61 },
  { id: "DEL-CCU", from: "DEL", to: "CCU", weight: 0.14, stress: "LOW", fare: 5200, stressScore: 38 },
  { id: "DEL-PAT", from: "DEL", to: "PAT", weight: 0.09, stress: "HIGH", fare: 9500, stressScore: 72 },
  { id: "BOM-GOI", from: "BOM", to: "GOI", weight: 0.07, stress: "LOW", fare: 3800, stressScore: 28 },
];

export default function IndiaRouteMap() {
  const { selectedCorridor, setSelectedCorridor } = useVayuTheme();
  const [hoveredRoute, setHoveredRoute] = useState<RouteArc | null>(null);

  const getStressColor = (stress: string) => {
    switch (stress) {
      case "CRITICAL":
        return "#ef4444"; // Red-500
      case "HIGH":
        return "#f97316"; // Orange-500
      case "MODERATE":
        return "#eab308"; // Yellow-500
      default:
        return "#10b981"; // Emerald-500
    }
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between min-h-[460px]">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-500" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
            LIVE INDIA AVIATION CONTROL CENTER MAP
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            6 ACTIVE CORRIDORS
          </span>
          {selectedCorridor && (
            <button
              onClick={() => setSelectedCorridor(null)}
              className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/20"
            >
              Clear Selected
            </button>
          )}
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full h-[360px] my-2">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle Map Outline Background */}
          <path
            d="M 35 15 L 45 12 L 55 18 L 65 25 L 75 32 L 80 42 L 72 52 L 68 62 L 55 70 L 45 88 L 35 85 L 25 72 L 20 60 L 22 45 L 30 28 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-slate-300 dark:text-slate-800/60"
            strokeDasharray="1 1"
          />

          {/* Render Route Flow Arcs */}
          {ROUTES.map((route) => {
            const start = AIRPORTS[route.from];
            const end = AIRPORTS[route.to];
            if (!start || !end) return null;

            const isSelected = selectedCorridor === route.id;
            const isHovered = hoveredRoute?.id === route.id;
            const color = getStressColor(route.stress);
            const strokeWidth = route.weight * 12 + 1.5;

            // Curved Quadratic Arc calculation
            const midX = (start.x + end.x) / 2 + (start.y - end.y) * 0.15;
            const midY = (start.y + end.y) / 2 + (end.x - start.x) * 0.15;
            const pathData = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

            return (
              <g key={route.id} className="cursor-pointer" onClick={() => setSelectedCorridor(route.id)}>
                {/* Background Shadow Arc */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth + 2}
                  strokeOpacity={isSelected || isHovered ? 0.35 : 0.1}
                />

                {/* Animated Flow Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={isSelected || isHovered ? 1 : 0.7}
                  className="animate-route-flow transition-all"
                />

                {/* Invisible Hover Hitbox */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="8"
                  onMouseEnter={() => setHoveredRoute(route)}
                  onMouseLeave={() => setHoveredRoute(null)}
                />
              </g>
            );
          })}

          {/* Render Airport Nodes */}
          {Object.values(AIRPORTS).map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle r="2" className="fill-blue-500 animate-ping opacity-75" />
              <circle r="1.5" className="fill-blue-400 stroke-slate-900" strokeWidth="0.5" />
              <text
                x="3"
                y="1"
                fontSize="3"
                className="fill-slate-700 dark:fill-slate-300 font-mono font-bold select-none"
              >
                {node.id}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover / Selected Floating Tooltip */}
        {(hoveredRoute || selectedCorridor) && (
          <div className="absolute bottom-3 left-3 glass-panel p-3 text-xs space-y-1 font-mono border-blue-500/40 bg-slate-900/90 text-white z-20">
            {(() => {
              const active = hoveredRoute || ROUTES.find((r) => r.id === selectedCorridor);
              if (!active) return null;
              return (
                <>
                  <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-700 pb-1">
                    <span>{active.id} CORRIDOR</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: `${getStressColor(active.stress)}33`, color: getStressColor(active.stress) }}
                    >
                      STRESS: {active.stressScore} / 100 ({active.stress})
                    </span>
                  </div>
                  <div className="flex justify-between gap-6 pt-1">
                    <span className="text-slate-400">Current Spot Fare:</span>
                    <span className="font-bold text-emerald-400">₹{active.fare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-400">DGCA Traffic Weight:</span>
                    <span className="text-blue-400">{(active.weight * 100).toFixed(0)}% Volume</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low Stress
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Critical Surge
          </span>
        </div>
        <span className="hidden sm:inline">Click any route arc to filter dashboard</span>
      </div>
    </div>
  );
}
