"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVayuTheme } from "./ThemeContext";
import {
  Plane,
  Radar,
  Navigation,
  BarChart3,
  Shield,
  Sun,
  Moon,
  TrendingUp,
  Zap,
  RefreshCw,
  BookOpen,
  Sliders,
  Menu,
  Compass,
  Search,
  X,
} from "lucide-react";
import { triggerLiveSweep, fetchMarketCoverage, checkBackendHealth } from "../lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, demoMode, setDemoMode, lastUpdated, setLastUpdated } = useVayuTheme();
  const [isSweeping, setIsSweeping] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check real backend health status
    const updateHealth = () => {
      checkBackendHealth().then((status) => {
        setBackendStatus(status);
      });
    };
    updateHealth();
    const interval = setInterval(updateHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSweep = async () => {
    setIsSweeping(true);
    try {
      await triggerLiveSweep();
      setLastUpdated(new Date().toLocaleTimeString());
      setBackendStatus('ONLINE');
    } catch (e) {
      console.error(e);
      setBackendStatus('DEGRADED');
    } finally {
      setIsSweeping(false);
    }
  };

  // Freshness & health thresholds
  let statusColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  let statusText = "ONLINE";
  let dotBg = "bg-emerald-500";

  if (backendStatus === "OFFLINE") {
    statusColor = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
    statusText = "OFFLINE";
    dotBg = "bg-rose-500";
  } else if (backendStatus === "DEGRADED") {
    statusColor = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    statusText = "DEGRADED";
    dotBg = "bg-amber-500";
  }

  const navLinks = [
    { name: "Overview", href: "/", icon: Plane },
    { name: "Observatory", href: "/observatory", icon: Radar, badge: "LIVE" },
    { name: "Live Scraper", href: "/scraper", icon: Search, badge: "NEW" },
    { name: "Skyview", href: "/skyview", icon: Compass, badge: "3D" },
    { name: "Routes", href: "/routes", icon: Navigation },
    { name: "Forecast", href: "/forecast", icon: TrendingUp },
    { name: "MoSPI", href: "/mospi", icon: BarChart3 },
    { name: "DGCA", href: "/dgca", icon: Shield },
    { name: "Historical", href: "/historical", icon: TrendingUp },
    { name: "Data", href: "/data", icon: Zap },
    { name: "Methodology", href: "/methodology", icon: BookOpen },
    { name: "System", href: "/admin", icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
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
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent font-mono">
                    VAYU
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                    PUBLIC
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  National Airfare Intelligence Platform • MoSPI & DGCA
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-blue-500/20 text-blue-500 dark:text-blue-300 rounded border border-blue-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Semi-compact Navigation for standard Laptop screens (lg) */}
          <nav className="hidden md:flex xl:hidden items-center space-x-1">
            {navLinks.slice(0, 6).map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <Link
              href="/admin"
              className="px-2 py-1.5 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-200"
            >
              More...
            </Link>
          </nav>

          {/* Status & Control Widgets */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Indicator with thresholds */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono ${statusColor}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotBg}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotBg}`}></span>
              </span>
              <span className="font-bold">{statusText}</span>
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

            {/* Simulation Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                demoMode
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${demoMode ? "fill-amber-400 text-amber-500" : ""}`} />
              <span>SIMULATE</span>
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

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 text-blue-500" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="ml-auto px-1.5 py-0.2 text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 rounded">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Last Updated: {lastUpdated}</span>
            <button
              onClick={() => {
                setDemoMode(!demoMode);
                setMobileMenuOpen(false);
              }}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-bold"
            >
              {demoMode ? "SIMULATION: ON" : "SIMULATION: OFF"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

