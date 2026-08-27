"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ShieldAlert, AlertTriangle, Info, PieChart, Layers } from "lucide-react";
import AnimatedNumber from "../../components/AnimatedNumber";
import {
  fetchSurgeAlerts,
  fetchFeeDecomposition,
  fetchRouteConcentration,
  SurgeAlert,
  RouteConcentration,
  FeeDecomposition,
} from "../../lib/api";

export default function DgcaPortal() {
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [feeData, setFeeData] = useState<FeeDecomposition[]>([]);
  const [concentration, setConcentration] = useState<RouteConcentration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [alertsData, fees, concData] = await Promise.all([
          fetchSurgeAlerts(),
          fetchFeeDecomposition(),
          fetchRouteConcentration(),
        ]);
        setAlerts(alertsData);
        setFeeData(fees);
        setConcentration(concData);
      } catch (err) {
        console.error("Failed to load DGCA data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4 font-mono">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-medium">Hydrating DGCA Regulatory Matrix...</div>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> CRITICAL SURGE
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> HIGH ELEVATION
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
            MODERATE
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-rose-500 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            REGULATORY SURGE MATRIX (DGCA CONTROL ROOM)
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
          Directorate General of Civil Aviation • Real-Time Anti-Predatory Pricing & Fee Unbundling Monitor
        </p>
      </div>

      {/* Active Surge Alerts Section */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
              ACTIVE SURGE ALERTS & PREDATORY PRICING FLAGS
            </h2>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-full">
            {alerts.length} FLAGGED
          </span>
        </div>

        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Corridor</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Spot Fare (₹)</th>
                <th className="px-5 py-3">30D Baseline (₹)</th>
                <th className="px-5 py-3">Sigma Deviation</th>
                <th className="px-5 py-3">Dominant Airline</th>
                <th className="px-5 py-3">Flagged Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {alerts.map((alert, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{alert.corridor}</td>
                  <td className="px-5 py-4">{getSeverityBadge(alert.severity)}</td>
                  <td className="px-5 py-4 font-black text-rose-500 text-sm">
                    ₹{alert.current_fare.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-slate-400">₹{alert.baseline_30d_fare.toLocaleString()}</td>
                  <td className="px-5 py-4 font-bold text-amber-500">+{alert.sigma_deviation.toFixed(1)}σ</td>
                  <td className="px-5 py-4 text-blue-500 font-bold">{alert.carrier_dominance}</td>
                  <td className="px-5 py-4 text-slate-400">{new Date(alert.flagged_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unbundling Bar Chart */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <PieChart className="h-4 w-4 text-blue-500" />
            DGCA FEE DECOMPOSITION (BASE FARE VS ANCILLARIES)
          </h2>
          <span className="text-xs font-mono text-slate-400">Mandatory Unbundling Audit</span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feeData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="route" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", color: "#ffffff", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "11px" }} />
              <Bar dataKey="base_fare" name="Base Fare" stackId="a" fill="#3b82f6" />
              <Bar dataKey="fuel_surcharge_yq" name="Fuel Surcharge (YQ)" stackId="a" fill="#f59e0b" />
              <Bar dataKey="airport_fee_udf" name="Airport Fee (UDF)" stackId="a" fill="#10b981" />
              <Bar dataKey="convenience_fee" name="Convenience Fee" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Route Concentration HHI Card */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Layers className="h-5 w-5 text-indigo-500" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide">
            HERFINDAHL-HIRSCHMAN INDEX (HHI) AIRLINE CONCENTRATION
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Market Concentration Index (HHI)</span>
            <div className="text-3xl font-black text-indigo-500 mt-1">
              <AnimatedNumber value={concentration?.hhi ?? 1850} />
            </div>
            <span className="text-[10px] text-slate-500">Threshold: &gt;2,500 indicates High Monopolization</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400">Concentration Classification</span>
            <div className="text-xl font-bold text-amber-500 mt-2">
              {concentration?.concentration_label.replace("_", " ") ?? "MODERATE CONCENTRATION"}
            </div>
            <span className="text-[10px] text-slate-500">2 Carriers Control 83% Capacity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
