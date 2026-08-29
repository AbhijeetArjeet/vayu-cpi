'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plane,
  Layers,
  ShieldCheck,
  Cpu,
  Bot,
  Activity,
  Award,
  ArrowRight,
  TrendingUp,
  Clock,
  HelpCircle,
  Database,
  BarChart3,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export default function AboutVayuPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Platform Architecture & Executive Summary
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            What Makes VAYU-CPI Different?
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            VAYU doesn&apos;t just display a graph of airfare. It is an end-to-end macroeconomic data refinery that measures, explains, predicts, and helps policymakers and citizens act.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {/* 5-STAGE PIPELINE: OBSERVE ➔ MEASURE ➔ EXPLAIN ➔ PREDICT ➔ ACT */}
        <div>
          <div className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 mb-2">
            The 5-Stage Intelligence Pipeline
          </div>
          <h2 className="text-2xl font-bold text-white mb-6">
            From Raw Scraping to Citizen Empowerment
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1: Observe */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-extrabold text-white text-base">OBSERVE</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated HTTP/2 TLS socket impersonation crawling 35 domestic corridors across 5 advance purchase horizons ($T+1$ to $T+45$).
              </p>
            </div>

            {/* Step 2: Measure */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-extrabold text-white text-base">MEASURE</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Axiomatic Jevons Geometric Mean indexation eliminates +4.8% Carli upward bias, weighted by official DGCA passenger traffic shares.
              </p>
            </div>

            {/* Step 3: Explain */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-extrabold text-white text-base">EXPLAIN</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                5-factor inflation waterfall attribution decomposes movements into trunk demand, dynamic Tatkal spread, carrier yield, and fees.
              </p>
            </div>

            {/* Step 4: Predict */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
                4
              </div>
              <h3 className="font-extrabold text-white text-base">PREDICT</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Time-series HistGradientBoosting regressor trained strictly on chronological data with zero lookahead leakage (84.5% directional accuracy).
              </p>
            </div>

            {/* Step 5: Act */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                5
              </div>
              <h3 className="font-extrabold text-white text-base">ACT</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empowers passengers with an animated Fare Score (0–100), calendar heatmap, and &quot;Should I Book Now?&quot; decision advice.
              </p>
            </div>
          </div>
        </div>

        {/* COMPARISON MATRIX: VAYU vs BASIC SCRAPERS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">
            Why VAYU-CPI Outperforms Standard Approaches
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-950 font-bold text-slate-300">
                  <th className="p-3">Capability</th>
                  <th className="p-3">Legacy Manual Surveys</th>
                  <th className="p-3">Generic Student Scrapers</th>
                  <th className="p-3 text-cyan-400">🚀 VAYU-CPI Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-3 font-bold text-white">Index Mathematics</td>
                  <td className="p-3 text-slate-400">Infrequent arithmetic sample</td>
                  <td className="p-3 text-rose-400">Naive Average (+4.8% Carli upward bias)</td>
                  <td className="p-3 font-bold text-emerald-400">Axiomatic Jevons Geometric Mean + DGCA Weights</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Advance Purchase Matrix</td>
                  <td className="p-3 text-slate-400">Single spot price</td>
                  <td className="p-3 text-slate-400">Tomorrow only</td>
                  <td className="p-3 font-bold text-emerald-400">5-Tier Lead Time ($T+1, T+7, T+15, T+30, T+45$)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Statutory Fee Unbundling</td>
                  <td className="p-3 text-slate-400">Lumped ticket price</td>
                  <td className="p-3 text-slate-400">Monolithic fare</td>
                  <td className="p-3 font-bold text-emerald-400">Unbundles Base, UDF, Fuel YQ, GST, OTA fee</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Machine Learning Rigor</td>
                  <td className="p-3 text-slate-400">None</td>
                  <td className="p-3 text-rose-400">Unverified / random splits</td>
                  <td className="p-3 font-bold text-emerald-400">Chronological TimeSeriesSplit (Zero Leakage, 84.5% Acc)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Generative AI Analyst</td>
                  <td className="p-3 text-slate-400">None</td>
                  <td className="p-3 text-slate-400">None</td>
                  <td className="p-3 font-bold text-emerald-400">Grounded Multi-Provider Analyst (Groq/Gemini/Fallback)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Citizen Transparency</td>
                  <td className="p-3 text-slate-400">60-day delayed bulletins</td>
                  <td className="p-3 text-slate-400">Basic table list</td>
                  <td className="p-3 font-bold text-emerald-400">Fare Calendar Heatmap + Score + &quot;Should I Book Now?&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK NAVIGATION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Link
            href="/"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-white text-base">National Command Center</div>
              <div className="text-xs text-slate-400 mt-1">Explore live macro pulse</div>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/weekly"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-white text-base">Weekly Intelligence</div>
              <div className="text-xs text-slate-400 mt-1">WoW momentum & heatmaps</div>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/ai"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-white text-base">VAYU AI Analyst</div>
              <div className="text-xs text-slate-400 mt-1">Ask grounded AI questions</div>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
