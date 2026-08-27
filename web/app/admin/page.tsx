"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import {
  ShieldAlert,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Sliders,
  Database,
  Activity,
} from "lucide-react";
import {
  validateImportPayload,
  confirmImportPayload,
  fetchSweepStatus,
  triggerAdminSweep,
  ImportValidationReport,
} from "../../lib/api";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"sweep" | "import">("sweep");

  // Bulk Sweep Control State
  const [sweepStatus, setSweepStatus] = useState<any>(null);
  const [sweeping, setSweeping] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<number>(30);

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

  useEffect(() => {
    fetchSweepStatus().then(setSweepStatus);
  }, []);

  const handleRunSweep = async () => {
    setSweeping(true);
    const res = await triggerAdminSweep(frequency);
    setSweeping(false);
    fetchSweepStatus().then(setSweepStatus);
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
        "Admin imported historical tariff dataset",
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-rose-500" />
              <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
                SYSTEM ADMINISTRATION & INGESTION CONTROL PANEL
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Restricted management portal for bulk live sweeps, historical dataset imports, and collection frequency settings.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveTab("sweep")}
              className={`px-4 py-2 rounded-md font-bold transition-all ${
                activeTab === "sweep"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bulk Live Collection
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-4 py-2 rounded-md font-bold transition-all ${
                activeTab === "import"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Historical Data Import
            </button>
          </div>
        </div>

        {/* TAB 1: BULK LIVE COLLECTION PANEL */}
        {activeTab === "sweep" && (
          <div className="space-y-6 font-mono">
            {/* Status Summary */}
            {sweepStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-panel p-4 bg-slate-900/80 border-slate-800">
                  <div className="text-xs text-slate-400">Configured Corridors</div>
                  <div className="text-2xl font-bold text-blue-400 mt-1">
                    {sweepStatus.configured_routes_count} Routes
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Major Domestic Corridors</div>
                </div>

                <div className="glass-panel p-4 bg-slate-900/80 border-slate-800">
                  <div className="text-xs text-slate-400">Horizons Tracked</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">T-30, T-7, T-1</div>
                  <div className="text-[10px] text-slate-500 mt-1">Advance, Mid, Tatkal</div>
                </div>

                <div className="glass-panel p-4 bg-slate-900/80 border-slate-800">
                  <div className="text-xs text-slate-400">Total Sweeps / Jobs</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {sweepStatus.state.total_attempts} Jobs
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {sweepStatus.state.successful_jobs} Success | {sweepStatus.state.failed_jobs} Failed
                  </div>
                </div>

                <div className="glass-panel p-4 bg-slate-900/80 border-slate-800">
                  <div className="text-xs text-slate-400">Sweep Ingestion Speed</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {sweepStatus.state.avg_fetch_ms} ms
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Avg Fetch Duration</div>
                </div>
              </div>
            )}

            {/* Sweep Trigger & Frequency Configuration */}
            <div className="glass-panel p-6 bg-slate-900/80 border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                    PRODUCTION BULK LIVE SWEEP ENGINE
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Google Flights Live Pipeline</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-950/80 rounded border border-slate-800">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-blue-400" /> Live Ingestion Frequency
                  </div>
                  <div className="text-xs text-slate-400">
                    Configure scheduled sweep interval. Default recommended is 30 minutes.
                  </div>
                </div>

                <select
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="bg-slate-900 text-white border border-slate-700 rounded px-4 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value={15}>Every 15 Minutes</option>
                  <option value={30}>Every 30 Minutes (Recommended)</option>
                  <option value={60}>Every 1 Hour</option>
                  <option value={180}>Every 3 Hours</option>
                  <option value={360}>Every 6 Hours</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  Last Sweep Completed:{" "}
                  <strong className="text-white">
                    {sweepStatus?.state?.last_sweep_at || "Recently completed"}
                  </strong>
                </div>

                <button
                  onClick={handleRunSweep}
                  disabled={sweeping}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold rounded-lg shadow-lg shadow-emerald-900/40 flex items-center gap-2 text-xs transition-all"
                >
                  {sweeping ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Sweeping 22 Corridors Across T-30, T-7, T-1...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" /> RUN LIVE SWEEP NOW
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORICAL DATASET IMPORT WIZARD */}
        {activeTab === "import" && (
          <div className="space-y-6 font-mono">
            {importSuccessMessage && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            <div className="glass-panel p-6 bg-slate-900/80 border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                  <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                    HISTORICAL DATASET IMPORT & VALIDATION WIZARD
                  </h3>
                </div>
                <span className="text-xs text-slate-400">IMPORT → VALIDATE → NORMALIZE → STORE</span>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Dataset Name</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="HISTORICAL_DATASET">HISTORICAL_DATASET</option>
                    <option value="DGCA_REFERENCE">DGCA_REFERENCE</option>
                    <option value="EXTERNAL_API">EXTERNAL_API</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Dataset Version</label>
                  <input
                    type="text"
                    value={datasetVersion}
                    onChange={(e) => setDatasetVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* JSON/CSV Input Area */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Paste JSON Array of Fare Records:
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleValidateImport}
                  disabled={validating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold rounded-lg shadow-lg shadow-blue-900/40 flex items-center gap-2 text-xs transition-all"
                >
                  {validating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  STAGE 1: VALIDATE DATASET
                </button>
              </div>
            </div>

            {/* Validation Quality Report Preview Card */}
            {validationReport && (
              <div className="glass-panel p-6 bg-slate-900/90 border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold uppercase text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> IMPORT QUALITY VALIDATION REPORT
                  </h4>
                  <span
                    className={`px-3 py-0.5 rounded text-xs font-bold ${
                      validationReport.status === "PASSED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    }`}
                  >
                    STATUS: {validationReport.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                    <div className="text-slate-400">Total Rows</div>
                    <div className="text-lg font-bold text-white mt-0.5">{validationReport.total_rows}</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                    <div className="text-slate-400">Valid Rows</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">{validationReport.valid_rows}</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                    <div className="text-slate-400">Unique Routes</div>
                    <div className="text-lg font-bold text-blue-400 mt-0.5">{validationReport.unique_routes}</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                    <div className="text-slate-400">Missing Fares</div>
                    <div className="text-lg font-bold text-amber-400 mt-0.5">{validationReport.missing_fare_pct}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div className="text-xs text-slate-400">
                    Date Range: <strong className="text-white">{validationReport.date_range}</strong>
                  </div>

                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold rounded-lg shadow-lg shadow-emerald-900/40 flex items-center gap-2 text-xs transition-all"
                  >
                    {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    STAGE 2: CONFIRM & STORE DATASET
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
