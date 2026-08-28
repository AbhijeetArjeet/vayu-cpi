"use client";

import React, { useEffect, useState } from "react";

interface StressGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function StressGauge({
  score,
  size = 140,
  strokeWidth = 12,
  label = "AIRFARE STRESS",
}: StressGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = Math.min(Math.max(score, 0), 100);
    const duration = 800; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setAnimatedScore(Math.round(start + (end - start) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getStatusDetails = (val: number) => {
    if (val >= 80) {
      return { text: "CRITICAL SURGE", color: "#ef4444", bgClass: "text-rose-500" };
    } else if (val >= 65) {
      return { text: "HIGH STRESS", color: "#f97316", bgClass: "text-orange-500" };
    } else if (val >= 40) {
      return { text: "MODERATE STRESS", color: "#f59e0b", bgClass: "text-amber-500" };
    } else {
      return { text: "HEALTHY MARKET", color: "#10b981", bgClass: "text-emerald-500" };
    }
  };

  const status = getStatusDetails(score);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800"
            fill="transparent"
          />
          {/* Animated Value Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={status.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Number & Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {animatedScore}
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            / 100
          </span>
        </div>
      </div>

      <div className="mt-3 text-center space-y-0.5">
        <span className={`text-xs font-mono font-bold tracking-wider ${status.bgClass}`}>
          {status.text}
        </span>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {label}
        </p>
      </div>
    </div>
  );
}
