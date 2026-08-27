"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVayuTheme } from "./ThemeContext";
import {
  Plane,
  BarChart3,
  Shield,
  Sun,
  Moon,
  TrendingUp,
  Zap,
  RefreshCw,
} from "lucide-react";
import { triggerLiveSweep } from "../lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, demoMode, setDemoMode, lastUpdated, setLastUpdated } = useVayuTheme();
  const [isSweeping, setIsSweeping] = useState(false);
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleManualSweep = async () => {
    setIsSweeping(true);
    try {
      const res = await triggerLiveSweep();
      setLastUpdated(new Date().toLocaleTimeString());
      setMinutesAgo(0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSweeping(false);
    }
  };

  // Freshness thresholds
  let statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  let statusText = "LIVE";
  let dotBg = "bg-emerald-500";

  if (minutesAgo >= 360 && minutesAgo < 1440) {
    statusColor = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    statusText = "STALE (6H+)";
    dotBg = "bg-amber-500";
  } else if (minutesAgo >= 1440) {
    statusColor = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
    statusText = "OFFLINE (24H+)";
    dotBg = "bg-rose-500";
  }

  const navLinks = [
    { name: "Overview", href: "/", icon: Plane },
    { name: "MoSPI Portal", href: "/mospi", icon: BarChart3 },
    { name: "DGCA Matrix", href: "/dgca", icon: Shield },
    { name: "Traveller Forecast", href: "/forecast", icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-500 group-hover:scale-105 transition-transform">
                <Plane className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    VAYU-CPI
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full">
                    SIH26056
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  National Airfare Price Index • Ministry of Statistics & DGCA
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Status & Control Widgets */}
          <div className="flex items-center space-x-3">
            {/* Live Indicator with thresholds */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono ${statusColor}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotBg}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotBg}`}></span>
              </span>
              <span className="font-semibold">{statusText}</span>
              <span className="text-[10px] opacity-70 border-l border-current pl-2">
                {minutesAgo === 0 ? "Just now" : `${minutesAgo}m ago`}
              </span>
            </div>

            {/* Sweep Trigger Button */}
            <button
              onClick={handleManualSweep}
              disabled={isSweeping}
              title="Trigger live Google Flights ingestion sweep"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSweeping ? "animate-spin text-blue-500" : ""}`} />
            </button>

            {/* SIH Demo Mode Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                demoMode
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${demoMode ? "fill-amber-400 text-amber-500" : ""}`} />
              <span className="hidden lg:inline">DEMO MODE</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
