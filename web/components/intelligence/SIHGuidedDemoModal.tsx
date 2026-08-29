"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
  ShieldAlert,
  Dna,
  Sliders,
  Database,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function SIHGuidedDemoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "1. National Airfare Price Index (VAYU-CPI)",
      subtitle: "Collect → Clean → Measure",
      badge: "STEP 1 OF 6",
      icon: Layers,
      content:
        "VAYU-CPI continuously ingests live flight quotes across 22 domestic trunk corridors and unbundles statutory fees (UDF ₹650, Fuel Surcharge ₹600) to compute a pure Laspeyres-Jevons inflation index.",
      link: "/",
      cta: "Explore Home Overview",
    },
    {
      step: 2,
      title: "2. Why Did Airfare Change? (Explainer)",
      subtitle: "Explain the Movement",
      badge: "STEP 2 OF 6",
      icon: HelpCircle,
      content:
        "VAYU does not just report a number — it explains WHY the index changed. The attribution waterfall separates trunk corridor volume, spot vs advance spreads, carrier yield, and seasonality.",
      link: "/explainer",
      cta: "View Inflation Explainer",
    },
    {
      step: 3,
      title: "3. Automated 3-Sigma Shock Detector",
      subtitle: "Detect Market Anomalies",
      badge: "STEP 3 OF 6",
      icon: ShieldAlert,
      content:
        "The automated shock detector scans every route and booking horizon using 3-sigma z-scores to flag abnormal surges (🔴 SHOCK, 🟠 HIGH, 🟡 ELEVATED) with statistical confidence levels.",
      link: "/shocks",
      cta: "View Active Shocks",
    },
    {
      step: 4,
      title: "4. Fair Fare & Expected Fare Engine",
      subtitle: "Evaluate Consumer Tariffs",
      badge: "STEP 4 OF 6",
      icon: Sparkles,
      content:
        "Answers 'Is this fare normal?' for any passenger or regulator by evaluating real quotes against empirical 10th, 25th, median, 75th, and 90th percentile historical distributions.",
      link: "/fair-fare",
      cta: "Open Fair Fare Calculator",
    },
    {
      step: 5,
      title: "5. What-If CPI Scenario Simulator",
      subtitle: "Simulate Macroeconomic Shocks",
      badge: "STEP 5 OF 6",
      icon: Sliders,
      content:
        "Allows MoSPI and DGCA analysts to simulate demand shocks (±50%), fleet capacity shortages, and fuel price surges to forecast national and regional CPI transmission.",
      link: "/policy",
      cta: "Open Policy Simulator",
    },
    {
      step: 6,
      title: "6. Data Confidence & Complete Index Trace",
      subtitle: "Audit Every Published Number",
      badge: "STEP 6 OF 6",
      icon: Database,
      content:
        "Provides 100% provenance transparency. Click down from National CPI → Regional → Corridor → Carrier → Raw Scraped Quote with exact timestamps.",
      link: "/provenance",
      cta: "Audit Provenance Tree",
    },
  ];

  const s = steps[currentStep - 1];
  const StepIcon = s.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-blue-500/40 text-white shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <StepIcon className="h-6 w-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {s.badge}
            </span>
            <h3 className="text-xl font-bold tracking-tight mt-1">{s.title}</h3>
            <p className="text-xs text-slate-400">{s.subtitle}</p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed font-mono">
            {s.content}
          </p>
          <Link
            href={s.link}
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-blue-400 hover:text-blue-300 underline"
          >
            <span>👉 {s.cta}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Progress Bar & Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex gap-1.5">
            {steps.map((st) => (
              <div
                key={st.step}
                onClick={() => setCurrentStep(st.step)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  st.step === currentStep
                    ? "w-8 bg-blue-500"
                    : st.step < currentStep
                    ? "w-3 bg-emerald-500"
                    : "w-3 bg-slate-700"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center gap-1 border border-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}

            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-mono font-bold text-white flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-bold text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                Finish Demo <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
