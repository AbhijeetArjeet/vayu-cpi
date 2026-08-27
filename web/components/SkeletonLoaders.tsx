"use client";

import React from "react";

export function HeroPulseSkeleton() {
  return (
    <div className="glass-panel p-6 md:p-8 space-y-6 animate-pulse bg-slate-900/60 border-slate-800">
      <div className="h-6 w-1/3 bg-slate-800 rounded-md" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-slate-800 rounded" />
          <div className="h-12 w-48 bg-slate-800 rounded-xl" />
        </div>
        <div className="h-16 bg-slate-800/80 rounded-xl" />
        <div className="h-16 bg-slate-800/80 rounded-xl" />
      </div>
      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-slate-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-slate-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="glass-panel p-6 space-y-4 animate-pulse min-h-[460px] bg-slate-900/60 border-slate-800">
      <div className="flex justify-between items-center">
        <div className="h-5 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-24 bg-slate-800 rounded" />
      </div>
      <div className="h-[360px] w-full bg-slate-800/40 rounded-xl" />
    </div>
  );
}
