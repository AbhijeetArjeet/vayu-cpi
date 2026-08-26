'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { fetchAirfareIndexSeries, exportCsv, NationalCompositeCPI } from '@/lib/api';

export default function MospiPortal() {
  const [data, setData] = useState<NationalCompositeCPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'composite' | 'advance' | 'spot'>('composite');

  useEffect(() => {
    async function loadData() {
      try {
        const series = await fetchAirfareIndexSeries();
        setData(series);
      } catch (error) {
        console.error('Failed to load CPI series', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Loading data...</div>;
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
    </div>
  );
}
