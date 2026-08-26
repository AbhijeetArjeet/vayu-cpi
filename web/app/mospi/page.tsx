'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { fetchAirfareIndexSeries, fetchAllRoutesCurrent, exportCsv, NationalCompositeCPI, RouteJevonsIndex } from '@/lib/api';

export default function MospiPortal() {
  const [data, setData] = useState<NationalCompositeCPI[]>([]);
  const [routesData, setRoutesData] = useState<RouteJevonsIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'composite' | 'advance' | 'spot'>('composite');

  useEffect(() => {
    async function loadData() {
      try {
        const [series, routes] = await Promise.all([
          fetchAirfareIndexSeries(),
          fetchAllRoutesCurrent()
        ]);
        setData(series);
        setRoutesData(routes.routes || []);
      } catch (err) {
        console.error('Failed to load CPI series', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-medium">Loading MoSPI Macro Data...</div>
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

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
        No CPI series data available for the selected period.
      </div>
    );
  }

  const latestData = data[data.length - 1];

  const getDataKey = () => {
    if (viewMode === 'advance') return 'advance_sub_index';
    if (viewMode === 'spot') return 'spot_sub_index';
    return 'composite_index';
  };

  const getColor = () => {
    if (viewMode === 'advance') return '#8b5cf6'; // violet
    if (viewMode === 'spot') return '#06b6d4'; // cyan
    return '#3b82f6'; // blue
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Macro Inflation View (MoSPI)</h1>
          <p className="text-slate-400">Tracking national airfare inflation for CPI integration</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Official MoSPI CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-sm text-slate-400 mb-1">Composite Airfare CPI</div>
          <div className="text-3xl font-semibold text-blue-400">{latestData?.composite_index.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-2">Base: 2024 = 100</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-sm text-slate-400 mb-1">Advance Sub-Index (T-30)</div>
          <div className="text-3xl font-semibold text-violet-400">{latestData?.advance_sub_index.toFixed(2)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-sm text-slate-400 mb-1">Spot Sub-Index (T-1)</div>
          <div className="text-3xl font-semibold text-cyan-400">{latestData?.spot_sub_index.toFixed(2)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-sm text-slate-400 mb-1">DGCA Traffic Coverage</div>
          <div className="text-3xl font-semibold text-emerald-400">{latestData?.dgca_traffic_coverage_pct}%</div>
          <div className="text-xs text-slate-500 mt-2">{latestData?.tracked_corridors} Corridors</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">CPI Trend Analysis</h2>
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('composite')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'composite' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Composite
            </button>
            <button
              onClick={() => setViewMode('advance')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'advance' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Advance
            </button>
            <button
              onClick={() => setViewMode('spot')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'spot' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Spot
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getColor()} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={getColor()} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="calculation_date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: getColor() }}
              />
              <Area 
                type="monotone" 
                dataKey={getDataKey()} 
                stroke={getColor()} 
                fillOpacity={1} 
                fill="url(#colorIndex)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Per-Route Micro-Index Breakdown</h2>
          <p className="text-sm text-slate-400 mt-1">Jevons micro-indices for every tracked corridor and horizon</p>
        </div>
        <div className="overflow-x-auto">
          {routesData.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">No route micro-indices available.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="px-6 py-3 font-medium">Origin</th>
                  <th className="px-6 py-3 font-medium">Dest</th>
                  <th className="px-6 py-3 font-medium">Horizon</th>
                  <th className="px-6 py-3 font-medium">Jevons Index</th>
                  <th className="px-6 py-3 font-medium">Current GeoMean (₹)</th>
                  <th className="px-6 py-3 font-medium">Base GeoMean (₹)</th>
                  <th className="px-6 py-3 font-medium">Sample Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {routesData.map((route, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4 font-semibold">{route.origin}</td>
                    <td className="px-6 py-4 font-semibold">{route.destination}</td>
                    <td className="px-6 py-4">T-{route.horizon_days}</td>
                    <td className="px-6 py-4 font-bold text-blue-400">{route.jevons_index.toFixed(2)}</td>
                    <td className="px-6 py-4">{route.current_geom_mean.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400">{route.base_geom_mean.toLocaleString()}</td>
                    <td className="px-6 py-4">{route.sample_size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
