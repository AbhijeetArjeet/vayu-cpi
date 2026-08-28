"use client";

import React, { useState } from "react";
import { Layers, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import { RouteJevonsIndex } from "../lib/api";

interface RouteComparisonProps {
  routes: RouteJevonsIndex[];
}

export default function RouteComparison({ routes }: RouteComparisonProps) {
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(["DEL-BOM", "BOM-DEL", "BLR-DEL"]);

  const toggleRouteSelection = (code: string) => {
    if (selectedRoutes.includes(code)) {
      if (selectedRoutes.length > 1) {
        setSelectedRoutes(selectedRoutes.filter((r) => r !== code));
      }
    } else {
      if (selectedRoutes.length < 4) {
        setSelectedRoutes([...selectedRoutes, code]);
      }
    }
  };

  const activeRouteObjects = routes.filter((r) => selectedRoutes.includes(`${r.origin}-${r.destination}`));

  return (
    <div className="glass-panel p-6 space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-500" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
            MULTI-CORRIDOR SIDE-BY-SIDE COMPARISON MATRIX
          </h3>
        </div>

        {/* Route Selector Checkboxes */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {routes.map((r, i) => {
            const code = `${r.origin}-${r.destination}`;
            const isChecked = selectedRoutes.includes(code);
            return (
              <button
                key={i}
                onClick={() => toggleRouteSelection(code)}
                className={`px-2.5 py-1 rounded-md font-bold transition-all border ${
                  isChecked
                    ? "bg-blue-600/20 text-blue-500 border-blue-500/40"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto font-mono text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Metric</th>
              {activeRouteObjects.map((r, idx) => (
                <th key={idx} className="px-4 py-3 text-blue-500 font-bold">
                  {r.origin} → {r.destination}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            <tr>
              <td className="px-4 py-3 text-slate-400 font-medium">Spot GeoMean (₹)</td>
              {activeRouteObjects.map((r, idx) => (
                <td key={idx} className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                  ₹{r.current_geom_mean.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-slate-400 font-medium">Base GeoMean (₹)</td>
              {activeRouteObjects.map((r, idx) => (
                <td key={idx} className="px-4 py-3 text-slate-400">
                  ₹{r.base_geom_mean.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-slate-400 font-medium">Jevons Index</td>
              {activeRouteObjects.map((r, idx) => (
                <td key={idx} className="px-4 py-3 font-bold text-blue-500">
                  {r.jevons_index.toFixed(1)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-slate-400 font-medium">Planning Horizon</td>
              {activeRouteObjects.map((r, idx) => (
                <td key={idx} className="px-4 py-3 text-purple-400">
                  T+{r.horizon_days} Days
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-slate-400 font-medium">Airfare Stress Score</td>
              {activeRouteObjects.map((r, idx) => {
                const stress = Math.min(100, Math.round(((r.jevons_index - 100) / 40) * 100 + 40));
                return (
                  <td key={idx} className="px-4 py-3 font-bold">
                    <span className={stress >= 70 ? "text-rose-500" : "text-emerald-500"}>
                      {stress} / 100
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
