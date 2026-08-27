"use client";

import React from "react";
import { useVayuTheme } from "./ThemeContext";
import { Zap, Play, RotateCcw, Award, CheckCircle, ShieldAlert } from "lucide-react";
import confetti from "canvas-confetti";

export default function DemoModeModal() {
  const { demoMode, setDemoMode, setSelectedCorridor } = useVayuTheme();

  if (!demoMode) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleSimulateSurge = () => {
    setSelectedCorridor("DEL-BOM");
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 glass-panel p-4 bg-slate-900/95 border-amber-500/40 text-white shadow-2xl space-y-3 font-mono animate-bounce-short">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <Zap className="h-4 w-4 fill-amber-400" />
          <span>SYSTEM SIMULATION CONTROL</span>
        </div>
        <button
          onClick={() => setDemoMode(false)}
          className="text-slate-400 hover:text-white text-xs"
        >
          ✕ Close
        </button>
      </div>

      <p className="text-[11px] text-slate-300">
        Interactive control panel for index verification and real-time stress testing:
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={handleSimulateSurge}
          className="p-2 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1 font-bold"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Simulate Surge
        </button>

        <button
          onClick={triggerConfetti}
          className="p-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1 font-bold"
        >
          <Award className="h-3.5 w-3.5" />
          Verify Pipeline 🎉
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
        <span>MoSPI & DGCA Pipeline</span>
        <button
          onClick={() => setSelectedCorridor(null)}
          className="text-blue-400 underline flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" /> Reset View
        </button>
      </div>
    </div>
  );
}
