'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchSurgeAlerts, fetchFeeDecomposition, fetchRouteConcentration, SurgeAlert, RouteConcentration, FeeDecomposition } from '@/lib/api';
import { AlertCircle, Info } from 'lucide-react';

export default function DgcaPortal() {
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [feeData, setFeeData] = useState<FeeDecomposition[]>([]);
  const [concentration, setConcentration] = useState<RouteConcentration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [alertsData, fees, concData] = await Promise.all([
          fetchSurgeAlerts(),
          fetchFeeDecomposition(),
          fetchRouteConcentration()
        ]);
        setAlerts(alertsData);
        setFeeData(fees);
        setConcentration(concData);
      } catch (err) {
        console.error('Failed to load DGCA data', err);
        setError('Failed to load regulatory data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-medium">Loading Regulatory Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl flex items-center gap-3">
          <span className="font-semibold">Error:</span> {error}
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
      case 'MODERATE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MODERATE</span>;
      default:
        return <span>{severity}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Regulatory Surge Matrix (DGCA)</h1>
        <p className="text-slate-400">Monitoring corridor-level surge alerts and fee decompositions</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h2 className="text-xl font-semibold">Active Surge Alerts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-300">
              <tr>
                <th className="px-6 py-3 font-medium">Corridor</th>
                <th className="px-6 py-3 font-medium">Severity</th>
                <th className="px-6 py-3 font-medium">Current Fare (₹)</th>
                <th className="px-6 py-3 font-medium">30d Baseline (₹)</th>
                <th className="px-6 py-3 font-medium">σ Deviation</th>
                <th className="px-6 py-3 font-medium">Carrier Dominance</th>
                <th className="px-6 py-3 font-medium">Flagged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {alerts.map((alert, idx) => (
                <tr key={idx} className="hover:bg-slate-800/25 transition-colors">
                  <td className="px-6 py-4 font-medium">{alert.corridor}</td>
                  <td className="px-6 py-4">{getSeverityBadge(alert.severity)}</td>
                  <td className="px-6 py-4 text-red-400 font-semibold">{alert.current_fare.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-400">{alert.baseline_30d_fare.toLocaleString()}</td>
                  <td className="px-6 py-4">{alert.sigma_deviation.toFixed(1)}x</td>
                  <td className="px-6 py-4">{alert.carrier_dominance}</td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {new Date(alert.flagged_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No active surge alerts.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-6">Route Fee Decomposition</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="route" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                cursor={{ fill: '#334155', opacity: 0.4 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="base_fare" name="Base Fare" stackId="a" fill="#3b82f6" />
              <Bar dataKey="fuel_surcharge_yq" name="Fuel Surcharge (YQ)" stackId="a" fill="#f59e0b" />
              <Bar dataKey="airport_fee_udf" name="Airport Fee (UDF)" stackId="a" fill="#10b981" />
              <Bar dataKey="convenience_fee" name="Convenience Fee" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">DGCA Route Weights (ESTIMATED)</h2>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-xs font-semibold border border-yellow-500/30">
            <Info className="h-3 w-3" /> ESTIMATED
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Passenger volume weights for the national index computation. {concentration?.note}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Market Concentration (HHI)</div>
            <div className="text-3xl font-bold text-slate-200">{concentration?.hhi.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Concentration Level</div>
            <div className="text-xl font-bold text-slate-200 mt-2">{concentration?.concentration_label.replace('_', ' ')}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-300">
              <tr>
                <th className="px-6 py-3 font-medium">Corridor</th>
                <th className="px-6 py-3 font-medium">Volume Weight</th>
                <th className="px-6 py-3 font-medium">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {concentration?.routes.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/25 transition-colors">
                  <td className="px-6 py-4 font-semibold">{r.route}</td>
                  <td className="px-6 py-4">{r.weight.toFixed(2)}</td>
                  <td className="px-6 py-4 text-blue-400">{(r.weight * 100).toFixed(0)}%</td>
                </tr>
              ))}
              {(!concentration?.routes || concentration.routes.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No route concentration data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
