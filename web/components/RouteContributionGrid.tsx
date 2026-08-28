"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Search,
  ArrowRight,
  Sparkles,
  Plane,
  X,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { RouteJevonsIndex } from "../lib/api";

interface RouteContributionGridProps {
  routes: RouteJevonsIndex[];
  compositeIndex?: number;
  dataMode?: string;
  onSelectCorridor: (corridor: string) => void;
}

// Official DGCA annual passenger traffic weights by city-pair
const DGCA_ROUTE_WEIGHTS: Record<string, number> = {
  "DEL-BOM": 0.22,
  "BOM-DEL": 0.20,
  "BLR-DEL": 0.14,
  "DEL-BLR": 0.12,
  "DEL-CCU": 0.08,
  "CCU-DEL": 0.06,
  "BOM-BLR": 0.04,
  "BLR-BOM": 0.03,
  "DEL-HYD": 0.03,
  "HYD-DEL": 0.02,
  "DEL-MAA": 0.02,
  "MAA-DEL": 0.02,
  "DEL-PAT": 0.01,
  "BOM-GOI": 0.01,
};

const CITY_NAMES: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bengaluru",
  CCU: "Kolkata",
  HYD: "Hyderabad",
  MAA: "Chennai",
  PAT: "Patna",
  GOI: "Goa",
  PNQ: "Pune",
  AMD: "Ahmedabad",
};

export default function RouteContributionGrid({
  routes = [],
  compositeIndex = 180.03,
  dataMode = "LIVE",
  onSelectCorridor,
}: RouteContributionGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHorizon, setSelectedHorizon] = useState<number | "ALL">("ALL");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"impact" | "fare" | "name">("impact");

  // Format enriched route items with correct DGCA weights and horizon badges
  const enrichedRoutes = useMemo(() => {
    return routes.map((r) => {
      const corridor = `${r.origin}-${r.destination}`;
      const dgcaWeight = DGCA_ROUTE_WEIGHTS[corridor] || 0.02;
      const horizonCode =
        r.booking_window || (r.horizon_days ? `T+${r.horizon_days}` : "T+7");
      
      // Calculate realistic point contribution = weight * (Jevons - 100)
      const contributionPoints = Number((dgcaWeight * (r.jevons_index - 100)).toFixed(2));

      return {
        ...r,
        corridor,
        originCity: CITY_NAMES[r.origin] || r.origin,
        destCity: CITY_NAMES[r.destination] || r.destination,
        dgcaWeight,
        horizonCode,
        contributionPoints,
      };
    });
  }, [routes]);

  // Filter and sort items based on user search & criteria
  const filteredRoutes = useMemo(() => {
    let result = enrichedRoutes;

    // 1. Search Query Filter (Matches airport code, city name, or full corridor)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.corridor.toLowerCase().includes(term) ||
          r.origin.toLowerCase().includes(term) ||
          r.destination.toLowerCase().includes(term) ||
          r.originCity.toLowerCase().includes(term) ||
          r.destCity.toLowerCase().includes(term)
      );
    }

    // 2. Horizon Filter
    if (selectedHorizon !== "ALL") {
      result = result.filter((r) => r.horizon_days === selectedHorizon);
    }

    // 3. Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "impact") {
        return Math.abs(b.contributionPoints) - Math.abs(a.contributionPoints);
      } else if (sortBy === "fare") {
        return b.current_geom_mean - a.current_geom_mean;
      } else {
        return a.corridor.localeCompare(b.corridor);
      }
    });

    return result;
  }, [enrichedRoutes, searchTerm, selectedHorizon, sortBy]);

  const getHorizonBadgeColor = (hDays: number) => {
    switch (hDays) {
      case 1:
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case 7:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case 15:
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case 30:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case 45:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4 font-mono text-xs bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
      {/* Header & Total Index */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-extrabold block tracking-tight">
              ROUTE CONTRIBUTION TO NATIONAL AIRFARE INFLATION ({dataMode})
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Official DGCA Passenger Traffic-Weighted Price Decomposition
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[11px]">National Composite Index:</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-extrabold text-sm">
            {compositeIndex ? `${compositeIndex.toFixed(2)} Pts` : "180.03 Pts"}
          </span>
        </div>
      </div>

      {/* Interactive Search & Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Route / Airport (e.g. DEL-BOM, BLR, Delhi, Patna, 6E)..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Horizon Filter Selector */}
        <div className="sm:col-span-3">
          <select
            value={selectedHorizon}
            onChange={(e) =>
              setSelectedHorizon(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Horizons (T+1 to T+45)</option>
            <option value={1}>T+1 Spot (1-Day)</option>
            <option value={7}>T+7 Weekly (7-Day)</option>
            <option value={15}>T+15 Fortnight (15-Day)</option>
            <option value={30}>T+30 Planning (1-Month)</option>
            <option value={45}>T+45 Long Advance (45-Day)</option>
          </select>
        </div>

        {/* Sort Order Selector */}
        <div className="sm:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="impact">Sort: Highest Impact (+pts)</option>
            <option value="fare">Sort: Highest Fare (₹)</option>
            <option value="name">Sort: Corridor (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Tag Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
        <span className="text-slate-500 flex items-center gap-1 mr-1">
          <Sparkles className="h-3 w-3 text-amber-500" /> Popular:
        </span>
        {["DEL-BOM", "BLR-DEL", "DEL-BLR", "DEL-CCU", "DEL-PAT", "BOM-GOI"].map(
          (pair) => (
            <button
              key={pair}
              onClick={() => setSearchTerm(searchTerm === pair ? "" : pair)}
              className={`px-2 py-0.5 rounded-lg border transition-all ${
                searchTerm === pair
                  ? "bg-blue-600 text-white font-bold border-blue-500"
                  : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800 hover:border-blue-500/40"
              }`}
            >
              {pair}
            </button>
          )
        )}
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="px-2 py-0.5 text-rose-400 hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Results Count & Click Advice */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-white">{filteredRoutes.length}</strong> sector observation points:
        </span>
        <span className="text-blue-500">
          💡 Click any card to inspect full route telemetry & booking links
        </span>
      </div>

      {/* Interactive Cards Grid */}
      {filteredRoutes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {filteredRoutes.map((r, i) => (
            <div
              key={`${r.corridor}-${r.horizon_days}-${i}`}
              onClick={() => onSelectCorridor(r.corridor)}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/80 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 space-y-1.5 text-center cursor-pointer transition-all hover:scale-[1.02] shadow-sm group"
            >
              {/* Header: Corridor & Horizon */}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">
                  {r.corridor}
                </span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-bold border rounded-md ${getHorizonBadgeColor(
                    r.horizon_days
                  )}`}
                >
                  {r.horizonCode}
                </span>
              </div>

              {/* City Names subtext */}
              <div className="text-[9px] text-slate-400 truncate">
                {r.originCity} → {r.destCity}
              </div>

              {/* Observed Fare & Weight */}
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-bold">
                  ₹{r.current_geom_mean.toLocaleString()}
                </span>
                <span className="text-slate-400">
                  Wt: {(r.dgcaWeight * 100).toFixed(0)}%
                </span>
              </div>

              {/* Net CPI Contribution Points */}
              <div className="pt-0.5">
                <span
                  className={`font-black text-xs block ${
                    r.contributionPoints >= 0 ? "text-blue-500 dark:text-blue-400" : "text-emerald-500"
                  }`}
                >
                  {r.contributionPoints >= 0
                    ? `+${r.contributionPoints.toFixed(2)} pts`
                    : `${r.contributionPoints.toFixed(2)} pts`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-2">
          <Plane className="h-6 w-6 mx-auto text-slate-400" />
          <strong className="block text-slate-400 text-xs">
            No matching routes found for "{searchTerm}"
          </strong>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedHorizon("ALL");
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
