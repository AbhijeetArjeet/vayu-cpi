'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchSurgeAlerts, fetchFeeDecomposition, SurgeAlert } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

export default function DgcaPortal() {
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [alertsData, fees] = await Promise.all([
          fetchSurgeAlerts(),
          fetchFeeDecomposition()
        ]);
        setAlerts(alertsData);
        setFeeData(fees);
      } catch (error) {
        console.error('Failed to load DGCA data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading regulatory data...</div>;
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
    </div>
  );
}
