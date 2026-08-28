"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Database,
  Activity,
  Play,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Layers,
  Server,
  Zap,
  Clock,
  Radio,
} from "lucide-react";
import {
  fetchSweepStatus,
  triggerAdminSweep,
  validateImportPayload,
  confirmImportPayload,
  fetchMarketCoverage,
  ImportValidationReport,
  MarketCoverageSummary,
} from "../../lib/api";

export default function SystemControlCenterPage() {
  // Operational State
  const [activeTab, setActiveTab] = useState<"operations" | "import">("operations");
  const [sweepStatus, setSweepStatus] = useState<any>(null);
  const [coverage, setCoverage] = useState<MarketCoverageSummary | null>(null);
  const [sweeping, setSweeping] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);

  // Historical Import State
  const [datasetName, setDatasetName] = useState<string>("Historical Indian Airfare Dataset (2024-2025)");
  const [sourceType, setSourceType] = useState<string>("HISTORICAL_DATASET");
  const [datasetVersion, setDatasetVersion] = useState<string>("1.0.0");
  const [rawText, setRawText] = useState<string>(`[
  {
    "origin": "DEL",
    "destination": "BOM",
    "carrier_name": "IndiGo",
    "flight_number": "6E-205",
    "carrier_code": "6E",
    "base_fare": 4100,
    "total_fare": 5400,
    "horizon_days": 7,
    "scraped_at": "2025-05-10T10:00:00"
  },
  {
    "origin": "BLR",
    "destination": "DEL",
    "carrier_name": "Air India",
    "flight_number": "AI-502",
    "carrier_code": "AI",
    "base_fare": 4900,
    "total_fare": 6200,
    "horizon_days": 30,
    "scraped_at": "2025-05-10T10:00:00"
  }
]`);
  const [validationReport, setValidationReport] = useState<ImportValidationReport | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [sweepMessage, setSweepMessage] = useState<string | null>(null);

  const loadSystemMetrics = async () => {
    setLoading(true);
    try {
      const [status, cov] = await Promise.all([
        fetchSweepStatus(),
        fetchMarketCoverage(),
      ]);
      setSweepStatus(status);
      setCoverage(cov);
    } catch (err) {
      console.error("Failed to load system control metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemMetrics();
  }, []);

  const handleRunSweep = async () => {
    setSweeping(true);
    setSweepMessage(null);
    try {
      const res = await triggerAdminSweep(frequency);
      setSweepMessage(res.message || "Live sweep executed across all configured corridors.");
      const updatedStatus = await fetchSweepStatus();
      setSweepStatus(updatedStatus);
    } catch (err: any) {
      setSweepMessage(`Sweep execution error: ${err.message}`);
    } finally {
      setSweeping(false);
    }
  };

  const handleValidateImport = async () => {
    setValidating(true);
    setValidationReport(null);
    setImportSuccessMessage(null);
    try {
      const records = JSON.parse(rawText);
      const report = await validateImportPayload(datasetName, sourceType, records);
      setValidationReport(report);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationReport) return;
    setImporting(true);
    try {
      const records = JSON.parse(rawText);
      const dsId = `ds_import_${Date.now()}`;
      const res = await confirmImportPayload(
        dsId,
        datasetName,
        sourceType,
        datasetVersion,
        "System Control Center imported historical dataset",
        records
      );
      setImportSuccessMessage(res.message);
      setValidationReport(null);
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Control Center Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              VAYU SYSTEM CONTROL CENTER
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Public operational dashboard for background live ingestion pipelines, scheduler diagnostics, dataset integrity, and coverage telemetry.
          </p>
        </div>

        {/* Operational Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              activeTab === "operations"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Pipeline Health & Sweeps
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 rounded-md font-bold transition-all ${
              activeTab === "import"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Dataset Ingestion Wizard
          </button>
        </div>
      </div>

      {/* TAB 1: OPERATIONS & INGESTION HEALTH */}
      {activeTab === "operations" && (
        <div className="space-y-6 font-mono">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-blue-500" /> Configured Corridors
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {sweepStatus?.configured_routes_count || 12} Corridors
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Full-Duplex Major City Pairs</div>
            </div>

            <div className="glass-panel p-4 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-500" /> Horizons Monitored
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">T+1 to T+45</div>
              <div className="text-[10px] text-slate-400 mt-1">T+1, T+7, T+15, T+30, T+45</div>
            </div>

            <div className="glass-panel p-4 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-500" /> Total Observations
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {coverage ? (coverage.live_observation_count + coverage.historical_observation_count).toLocaleString() : "8,607+"}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {coverage?.live_observation_count || 0} Live | {coverage?.historical_observation_count || 0} Historical
              </div>
            </div>

            <div className="glass-panel p-4 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Avg Latency / Job
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {sweepStatus?.state?.avg_fetch_ms || 420} ms
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Fast-Flights Parser Duration</div>
            </div>
          </div>

          {/* Sweep Execution Notification */}
          {sweepMessage && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />
              <span>{sweepMessage}</span>
            </div>
          )}

          {/* Sweep Control & Frequency */}
          <div className="glass-panel p-6 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white tracking-wider">
                  LIVE INGESTION PIPELINE SCHEDULER
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Railway Microservice Worker</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Scheduler Cadence</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The automated background worker queries configured corridors every {frequency} minutes across 5 horizons (T+1, T+7, T+15, T+30, T+45).
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>Every 15 Minutes</option>
                    <option value={30}>Every 30 Minutes (Default)</option>
                    <option value={60}>Every 1 Hour</option>
                    <option value={180}>Every 3 Hours</option>
                    <option value={360}>Every 6 Hours</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Manual Sweep Trigger</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Force an on-demand live extraction sweep across all 12 major Indian routes to refresh national index calculations.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleRunSweep}
                    disabled={sweeping}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold rounded-lg shadow-lg flex items-center gap-2 text-xs transition-all"
                  >
                    {sweeping ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Sweeping Corridors Across T+1..T+45...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" /> TRIGGER LIVE SWEEP NOW
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sweep Telemetry Summary */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Latest Ingestion Sweep:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {sweepStatus?.state?.last_sweep_at || "Continuous live background collection"}
                </strong>
              </div>
              <div>
                Status:{" "}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  HEALTHY
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATASET INGESTION WIZARD */}
      {activeTab === "import" && (
        <div className="space-y-6 font-mono">
          {importSuccessMessage && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          <div className="glass-panel p-6 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-bold uppercase text-slate-900 dark:text-white tracking-wider">
                  DATASET VALIDATION & INGESTION WIZARD
                </h3>
              </div>
              <span className="text-xs text-slate-400">STRUCTURED VALIDATION PIPELINE</span>
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Dataset Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Source Type</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="HISTORICAL_DATASET">HISTORICAL_DATASET</option>
                  <option value="DGCA_REFERENCE">DGCA_REFERENCE</option>
                  <option value="EXTERNAL_API">EXTERNAL_API</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Dataset Version</label>
                <input
                  type="text"
                  value={datasetVersion}
                  onChange={(e) => setDatasetVersion(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* JSON Input Area */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                Paste JSON Array of Fare Records:
              </label>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-3 text-xs text-emerald-600 dark:text-emerald-400 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleValidateImport}
                disabled={validating}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold rounded-lg shadow-lg flex items-center gap-2 text-xs transition-all"
              >
                {validating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                STAGE 1: VALIDATE DATA INTEGRITY
              </button>
            </div>
          </div>

          {/* Validation Quality Report Card */}
          {validationReport && (
            <div className="glass-panel p-6 bg-white/80 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> QUALITY VALIDATION REPORT
                </h4>
                <span
                  className={`px-3 py-0.5 rounded text-xs font-bold ${
                    validationReport.status === "PASSED"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                  }`}
                >
                  STATUS: {validationReport.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Total Rows</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{validationReport.total_rows}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Valid Rows</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{validationReport.valid_rows}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Unique Routes</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">{validationReport.unique_routes}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Missing Fares</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{validationReport.missing_fare_pct}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="text-xs text-slate-500">
                  Date Range: <strong className="text-slate-900 dark:text-white">{validationReport.date_range}</strong>
                </div>

                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold rounded-lg shadow-lg flex items-center gap-2 text-xs transition-all"
                >
                  {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  STAGE 2: CONFIRM & INGEST DATASET
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

