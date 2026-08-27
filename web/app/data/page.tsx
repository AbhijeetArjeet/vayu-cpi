"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Database, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, BookOpen, Layers } from "lucide-react";
import { fetchDatasets, DatasetMetadata } from "../../lib/api";

export default function DataPage() {
  const [datasets, setDatasets] = useState<DatasetMetadata[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchDatasets()
      .then((data) => {
        if (data === null) {
          setError(true);
          setDatasets(null);
        } else {
          setDatasets(data);
        }
      })
      .catch(() => {
        setError(true);
        setDatasets(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 font-sans">
        {/* Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
              DATASET LIBRARY & SOURCE TRANSPARENCY
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complete provenance registry of all active fare observation feeds, DGCA baseline datasets, and public historical tariffs.
          </p>
        </div>

        {/* Dataset Registry Card */}
        <div className="glass-panel p-6 bg-slate-900/80 border-slate-800 font-mono space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-wider">
                REGISTERED AVIATION DATASETS ({datasets ? datasets.length : 0})
              </h2>
            </div>
            <span className="text-xs text-slate-400">Strict Source Audit Trail</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              <span>Fetching dataset registry audit log...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg flex flex-col items-center gap-2">
              <AlertCircle className="h-6 w-6 text-rose-400" />
              <div className="font-bold text-sm">DATASET SERVICE UNAVAILABLE</div>
              <p className="text-xs text-slate-400">Could not connect to the backend dataset registry. Please check server connection.</p>
            </div>
          ) : datasets && datasets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-lg space-y-3">
              <div className="font-bold text-base text-amber-400 tracking-wider">NO DATASETS LOADED</div>
              <p className="text-xs text-slate-400">
                No historical datasets are currently loaded. Live VAYU observations remain available.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-mono transition-colors shadow-sm"
                >
                  View Live Data
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Source Type</th>
                    <th className="py-2.5 px-3">Dataset Name</th>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3">Date Range</th>
                    <th className="py-2.5 px-3">Row Count</th>
                    <th className="py-2.5 px-3">Corridors</th>
                    <th className="py-2.5 px-3">Airlines</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {datasets?.map((ds) => (
                    <tr key={ds.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            ds.source_type === "LIVE_FLIGHT"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                          }`}
                        >
                          {ds.source_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{ds.source_name}</div>
                        <div className="text-[10px] text-slate-400">{ds.description}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{ds.dataset_version}</td>
                      <td className="py-3 px-3 text-slate-300">{ds.date_range_start} to {ds.date_range_end}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">{ds.row_count.toLocaleString()}</td>
                      <td className="py-3 px-3 text-blue-400">{ds.routes_count} Corridors</td>
                      <td className="py-3 px-3 text-purple-400">{ds.airlines_count} Airlines</td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> {ds.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Methodology & Ethics Standards Section */}
        <div className="glass-panel p-6 bg-slate-900/80 border-slate-800 font-mono space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold uppercase text-white tracking-wider">
              VAYU DATA METHODOLOGY & ETHICAL TRANSPARENCY PRINCIPLES
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950/60 rounded border border-slate-800 space-y-2">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> 1. Scientific Authenticity
              </div>
              <p className="text-slate-400 leading-relaxed">
                VAYU never fakes live observations or mislabels imported historical records as live scraped data. All calculations preserve strict data provenance.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded border border-slate-800 space-y-2">
              <div className="font-bold text-purple-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400" /> 2. Normalization Layer
              </div>
              <p className="text-slate-400 leading-relaxed">
                Historical records provide contextual baselines and percentile distributions, while live scraped feeds provide current spot period observations without silent concatenation.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> 3. Jevons Geometric Mean
              </div>
              <p className="text-slate-400 leading-relaxed">
                Route micro-indices are computed via geometric mean ratio against official Base 2024 benchmarks, removing extreme outliers and unbundled fee noise.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}
