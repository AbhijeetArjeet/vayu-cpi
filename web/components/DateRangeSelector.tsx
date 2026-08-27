"use client";

import React from "react";
import { Calendar } from "lucide-react";

export type DateRangeDays = 1 | 7 | 30 | 90 | 365;

interface DateRangeSelectorProps {
  selectedDays: DateRangeDays;
  onRangeChange: (days: DateRangeDays) => void;
}

export default function DateRangeSelector({ selectedDays, onRangeChange }: DateRangeSelectorProps) {
  const options: { label: string; days: DateRangeDays }[] = [
    { label: "24h", days: 1 },
    { label: "7 Days", days: 7 },
    { label: "30 Days", days: 30 },
    { label: "90 Days", days: 90 },
    { label: "1 Year", days: 365 },
  ];

  return (
    <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-lg border border-slate-800 text-xs font-mono">
      <div className="flex items-center gap-1.5 px-2 text-slate-400">
        <Calendar className="h-3.5 w-3.5 text-blue-400" />
        <span className="hidden sm:inline">Analysis Period:</span>
      </div>

      <div className="flex items-center gap-1">
        {options.map((opt) => (
          <button
            key={opt.days}
            onClick={() => onRangeChange(opt.days)}
            className={`px-2.5 py-1 rounded transition-colors font-bold ${
              selectedDays === opt.days
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
