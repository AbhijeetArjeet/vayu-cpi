"use client";

import React, { useState, useEffect } from "react";
import {
  fetchDataConfidence,
  fetchIndexTrace,
  DataConfidenceReport,
  IndexTraceTree,
  IndexTraceNode,
} from "../../lib/api";
import {
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Database,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Plane,
  Info,
} from "lucide-react";

export default function IndexTraceTreeViewer() {
  const [confidence, setConfidence] = useState<DataConfidenceReport | null>(null);
  const [traceTree, setTraceTree] = useState<IndexTraceTree | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "root-national-cpi": true,
    "region-west-region": true,
    "corridor-DELBOM": true,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([fetchDataConfidence("live"), fetchIndexTrace("live")]).then(
      ([confRes, traceRes]) => {
        if (isMounted) {
          setConfidence(confRes);
          setTraceTree(traceRes);
          setLoading(false);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const renderNode = (node: IndexTraceNode, depth: number = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    const levelBadgeColor: Record<string, string> = {
      NATIONAL: "bg-blue-600/20 text-blue-400 border-blue-500/30",
      REGIONAL: "bg-purple-600/20 text-purple-400 border-purple-500/30",
      CORRIDOR: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
      CARRIER: "bg-amber-600/20 text-amber-400 border-amber-500/30",
      OBSERVATION: "bg-rose-600/20 text-rose-400 border-rose-500/30",
    };

    return (
      <div key={node.id} className="space-y-2">
        <div
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
            depth === 0
              ? "bg-slate-900 border-blue-500/40 shadow-lg text-white"
              : depth === 1
              ? "bg-slate-850 dark:bg-slate-900/90 border-slate-700/60 ml-4 text-slate-100"
              : depth === 2
              ? "bg-slate-800/80 dark:bg-slate-900/60 border-slate-700/40 ml-8 text-slate-200"
              : depth === 3
              ? "bg-slate-800/50 dark:bg-slate-900/40 border-slate-800 ml-12 text-slate-300"
              : "bg-slate-900/30 border-slate-800/80 ml-16 text-slate-400"
          } ${hasChildren ? "cursor-pointer hover:border-blue-400/50" : ""}`}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
              )
            ) : (
              <span className="h-4 w-4 shrink-0 flex items-center justify-center text-[9px] text-slate-600">•</span>
            )}

            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${levelBadgeColor[node.level] || ""}`}>
              {node.level}
            </span>

            <span className="font-bold text-sm font-mono">{node.label}</span>
            {node.sub_text && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                ({node.sub_text})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono">
            {node.weight_or_share !== undefined && (
              <span className="text-xs text-slate-400">Weight: {node.weight_or_share}%</span>
            )}
            <span className="font-black text-sm text-blue-400">
              {node.level === "OBSERVATION" ? `₹${node.value.toLocaleString()}` : node.value.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Detailed observation drawer */}
        {node.details && (
          <div className="ml-16 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] space-y-1 text-slate-400">
            {Object.entries(node.details).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="uppercase text-slate-500">{k}:</span>
                <span className="text-slate-300 font-bold">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Data Confidence Banner */}
      {confidence && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 text-white shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">DATA CONFIDENCE & AUDIT PROVENANCE</h2>
                <p className="text-xs text-slate-400">
                  Every published number verified through continuous multi-factor statistical auditing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Overall Score</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {confidence.overall_confidence_score}%
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500 px-2 py-1 rounded bg-emerald-500/20">
                {confidence.confidence_tier.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* 5 Quality Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {confidence.factors.map((f, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase">{f.factor_name}</span>
                  <span className="text-xs font-bold text-emerald-400">{f.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${f.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block truncate">{f.metric_value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Index Trace Tree */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              HIERARCHICAL INDEX AUDIT TRACE ("WHERE DID THIS NUMBER COME FROM?")
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any node to expand audit trail from National Composite CPI down to raw scraping timestamps
            </p>
          </div>
        </div>

        {loading || !traceTree ? (
          <div className="h-48 flex items-center justify-center text-slate-500 font-mono text-sm animate-pulse">
            Constructing hierarchical provenance tree...
          </div>
        ) : (
          <div className="space-y-2">
            {renderNode(traceTree.root)}
          </div>
        )}
      </div>
    </div>
  );
}
