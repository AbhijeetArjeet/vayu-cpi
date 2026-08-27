"use client";

import React, { useState } from "react";
import { TrendingUp, Clock, AlertCircle, ShoppingBag, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

interface ForecastPanelProps {
  corridor?: string;
  currentFare?: number;
}

export default function ForecastPanel({
  corridor = "DEL-BOM",
  currentFare = 6074,
}: ForecastPanelProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<"7D" | "14D">("7D");

  // Dynamic forecast data simulation based on real fare
  const forecastData = [
    { day: "Today (Actual)", fare: currentFare, type: "actual" },
    { day: "+1D", fare: Math.round(currentFare * 1.03), lower: Math.round(currentFare * 1.01), upper: Math.round(currentFare * 1.05), type: "forecast" },
    { day: "+3D", fare: Math.round(currentFare * 1.09), lower: Math.round(currentFare * 1.05), upper: Math.round(currentFare * 1.13), type: "forecast" },
    { day: "+7D", fare: Math.round(currentFare * 1.18), lower: Math.round(currentFare * 1.12), upper: Math.round(currentFare * 1.24), type: "forecast" },
    { day: "+14D", fare: Math.round(currentFare * 1.32), lower: Math.round(currentFare * 1.22), upper: Math.round(currentFare * 1.40), type: "forecast" },
  ];

  const expectedIncrease = 18; // +18% over 7 days
  const confidenceScore = 78;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Forecast Line Chart (2 Cols) */}
      <div className="lg:col-span-2 glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
              {corridor} AIRFARE FORECAST TRAJECTORY
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedHorizon("7D")}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                selectedHorizon === "7D"
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              7-Day Horizon
            </button>
            <button
              onClick={() => setSelectedHorizon("14D")}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                selectedHorizon === "14D"
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              14-Day Horizon
            </button>
          </div>
        </div>

        {/* Recharts Trajectory Plot */}
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={selectedHorizon === "7D" ? forecastData.slice(0, 4) : forecastData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={["dataMin - 500", "dataMax + 500"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", color: "#ffffff", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Expected Fare"]}
              />
              <ReferenceLine x="Today (Actual)" stroke="#3b82f6" strokeDasharray="3 3" label={{ value: "Current Date", fill: "#3b82f6", fontSize: 10 }} />
              <Line type="monotone" dataKey="fare" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Historical Actuals vs Econometric ARIMA/XGB Forecast
          </span>
          <span>Base 2024 Adjusted</span>
        </div>
      </div>

      {/* Book Now or Wait Widget (1 Col) */}
      <div className="glass-panel p-6 flex flex-col justify-between border-blue-500/30 bg-gradient-to-br from-slate-900 to-blue-950 text-white relative overflow-hidden">
        <div className="space-y-4 z-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold tracking-wider text-blue-400 uppercase flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" /> TRAVELLER DECISION ENGINE
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
              LIVE RECOMMENDATION
            </span>
          </div>

          <div className="space-y-1 text-center py-2">
            <span className="text-xs text-slate-400 font-mono">RECOMMENDED ACTION</span>
            <div className="text-3xl font-black tracking-tight text-amber-400 font-mono bg-amber-500/10 py-3 rounded-xl border border-amber-500/30 flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 animate-pulse" />
              <span>BOOK NOW</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono pt-1">
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Expected 7-Day Fare Increase:</span>
              <span className="font-bold text-rose-400 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" /> +{expectedIncrease}%
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Model Confidence:</span>
              <span className="font-bold text-emerald-400">{confidenceScore}%</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-800 text-center">
          Fares on {corridor} expected to reach ₹{Math.round(currentFare * 1.18).toLocaleString()} by next week.
        </p>
      </div>
    </div>
  );
}
