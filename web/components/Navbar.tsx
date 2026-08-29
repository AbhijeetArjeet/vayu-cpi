"use client";

import React, { useState, useEffect, useRef } from "react";
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
  HelpCircle,
  ShieldAlert,
  Calculator,
  Database,
  Sparkles,
  ChevronDown,
  Layers,
} from "lucide-react";
import { triggerLiveSweep, fetchMarketCoverage, checkBackendHealth } from "../lib/api";
import SIHGuidedDemoModal from "./intelligence/SIHGuidedDemoModal";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, demoMode, setDemoMode, lastUpdated, setLastUpdated } = useVayuTheme();
  const [isSweeping, setIsSweeping] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [sihModalOpen, setSihModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
  let statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  let statusText = "ONLINE";
  let dotBg = "bg-emerald-400";

  if (backendStatus === "OFFLINE") {
    statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/30";
    statusText = "OFFLINE";
    dotBg = "bg-rose-400";
  } else if (backendStatus === "DEGRADED") {
    statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
    statusText = "DEGRADED";
    dotBg = "bg-amber-400";
  }

  // Primary visible links in navbar
  const primaryLinks = [
    { name: "Overview", href: "/", icon: Plane },
    { name: "Passenger Hub", href: "/passenger", icon: Sparkles, badge: "CITIZEN", glow: true },
    { name: "Explainer", href: "/explainer", icon: HelpCircle, badge: "WHY" },
    { name: "Live Scraper", href: "/scraper", icon: Search },
  ];

  // Secondary tools in dropdown
  const secondaryTools = [
    { name: "3-Sigma Shocks", href: "/shocks", icon: ShieldAlert, desc: "Surge & anomaly detector" },
    { name: "Fair Fare Engine", href: "/fair-fare", icon: Calculator, desc: "Empirical percentile bands" },
    { name: "Policy Simulator", href: "/policy", icon: Sliders, desc: "What-if scenario modeling" },
    { name: "Observatory", href: "/observatory", icon: Radar, desc: "Live terminal feeds" },
    { name: "Provenance Tree", href: "/provenance", icon: Database, desc: "100% audit trail" },
    { name: "MoSPI Index", href: "/mospi", icon: BarChart3, desc: "Official CPI benchmark" },
    { name: "DGCA Governance", href: "/dgca", icon: Shield, desc: "Corridor tariff monitoring" },
    { name: "Methodology", href: "/methodology", icon: BookOpen, desc: "Jevons-Laspeyres formula" },
    { name: "System Admin", href: "/admin", icon: Sliders, desc: "API config & telemetry" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Plane className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent font-mono">
                    VAYU
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                    CPI
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono hidden sm:inline -mt-0.5">
                  National Airfare Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Compact Primary Navigation (No Overflow) */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-slate-300 hover:text-cyan-300 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Dropdown Menu for Analytics & Tools */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  toolsDropdownOpen || secondaryTools.some((t) => t.href === pathname)
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span>More Tools</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${toolsDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-2xl grid grid-cols-1 gap-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    INTELLIGENCE & REGULATORY SUITE
                  </div>
                  {secondaryTools.map((tool) => {
                    const Icon = tool.icon;
                    const isToolActive = pathname === tool.href;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => setToolsDropdownOpen(false)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                          isToolActive
                            ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                            : "hover:bg-slate-900 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-900 text-cyan-400 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{tool.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{tool.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* 3. Status & Controls (Cleanly Aligned, Never Stretched) */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Live Indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono ${statusColor}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotBg}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotBg}`}></span>
              </span>
              <span className="font-bold">{statusText}</span>
            </div>

            {/* SIH 60s Guided Demo Button */}
            <button
              onClick={() => setSihModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:scale-105 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span>60s DEMO</span>
            </button>

            {/* Sweep Trigger Button */}
            <button
              onClick={handleManualSweep}
              disabled={isSweeping}
              title="Trigger live flight sweep"
              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSweeping ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            {/* Simulation Mode Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                demoMode
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              <Zap className={`h-3 w-3 ${demoMode ? "fill-amber-400 text-amber-400" : ""}`} />
              <span>SIM</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-300" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[...primaryLinks, ...secondaryTools].map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold ${
                    isActive ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 60s Guided Demo Modal */}
      <SIHGuidedDemoModal isOpen={sihModalOpen} onClose={() => setSihModalOpen(false)} />
    </header>
  );
}
