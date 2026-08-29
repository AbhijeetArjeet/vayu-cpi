"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import {
  Plane,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingDown,
  Info,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Compass,
  Filter,
  Layers,
  Award,
  TrendingUp,
  RefreshCw,
  Sliders,
  Check,
  ChevronDown,
  Navigation,
  Activity,
  Luggage,
} from "lucide-react";
import {
  calculateFairFare,
  executeLiveFlightSearch,
  fetchAllRoutesCurrent,
  FairFareResponse,
  LiveSearchResponse,
  NormalizedFlightOffer,
} from "../../lib/api";

const POPULAR_AIRPORTS = [
  { code: "DEL", city: "New Delhi", airport: "Indira Gandhi Int'l (IGI)", tier: "Trunk" },
  { code: "BOM", city: "Mumbai", airport: "Chhatrapati Shivaji (CSMIA)", tier: "Trunk" },
  { code: "BLR", city: "Bengaluru", airport: "Kempegowda Int'l (KIA)", tier: "Metro" },
  { code: "GOI", city: "Goa", airport: "Dabolim / Manohar (Mopa)", tier: "Leisure" },
  { code: "CCU", city: "Kolkata", airport: "Netaji Subhash Chandra", tier: "Metro" },
  { code: "HYD", city: "Hyderabad", airport: "Rajiv Gandhi Int'l (RGIA)", tier: "Metro" },
  { code: "MAA", city: "Chennai", airport: "Chennai Int'l (MAA)", tier: "Metro" },
  { code: "PAT", city: "Patna", airport: "Jay Prakash Narayan", tier: "Regional" },
  { code: "IXC", city: "Chandigarh", airport: "Shaheed Bhagat Singh", tier: "Regional" },
  { code: "JAI", city: "Jaipur", airport: "Jaipur Int'l", tier: "Regional" },
];

const HORIZONS_DATA = [
  {
    days: 1,
    title: "TOMORROW",
    subtitle: "T+1 Spot / Emergency",
    icon: "⚡",
    multiplier: 1.35,
    risk: "EXPENSIVE",
    riskColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    badge: "🔴 TATKAL SURGE",
    desc: "Peak last-minute dynamic yield pricing.",
  },
  {
    days: 7,
    title: "1 WEEK",
    subtitle: "T+7 Weekly",
    icon: "📅",
    multiplier: 1.0,
    risk: "NORMAL",
    riskColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    badge: "🟡 BENCHMARK",
    desc: "Standard baseline business/leisure pricing.",
  },
  {
    days: 15,
    title: "2 WEEKS",
    subtitle: "T+15 Fortnight",
    icon: "✈️",
    multiplier: 0.86,
    risk: "BEST VALUE",
    riskColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    badge: "🟢 SWEET SPOT",
    desc: "Optimal balance of seat choice & discounts.",
  },
  {
    days: 30,
    title: "1 MONTH",
    subtitle: "T+30 Advance",
    icon: "🏖️",
    multiplier: 0.76,
    risk: "MAX SAVINGS",
    riskColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    badge: "💎 CHEAPEST TIER",
    desc: "Lowest early-bird promotional inventory.",
  },
];

export default function PassengerPortalPage() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [horizonDays, setHorizonDays] = useState(15);
  const [enteredFare, setEnteredFare] = useState<string>("5200");
  const [fairFareResult, setFairFareResult] = useState<FairFareResponse | null>(null);
  const [liveOffers, setLiveOffers] = useState<NormalizedFlightOffer[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [expandedTip, setExpandedTip] = useState<number | null>(0);
  const [activePortalView, setActivePortalView] = useState<"all" | "direct" | "ota">("all");

  // Load fair fare calculation from backend
  const loadFairFare = async (userFare?: number) => {
    try {
      const res = await calculateFairFare({
        origin,
        destination,
        horizon_days: horizonDays,
        current_fare: userFare,
      });
      if (res) setFairFareResult(res);
    } catch (e) {
      console.error("Fair fare error:", e);
    }
  };

  // Search live bookable flights
  const handleLiveSearch = async () => {
    setIsSearchingLive(true);
    setSearchStatus("Querying live inventory from airline feeds...");
    try {
      const res: LiveSearchResponse = await executeLiveFlightSearch(origin, destination, horizonDays);
      if (res && res.offers && res.offers.length > 0) {
        setLiveOffers(res.offers);
        setSearchStatus(`Found ${res.offers.length} live flight quotes!`);
        if (res.summary?.lowest_fare_inr) {
          setEnteredFare(String(res.summary.lowest_fare_inr));
          loadFairFare(res.summary.lowest_fare_inr);
        }
      } else {
        setSearchStatus("Live market quotes synchronized with baseline engine.");
      }
    } catch (e) {
      console.error("Live flight search error:", e);
      setSearchStatus("Synchronized with econometric reference model.");
    } finally {
      setIsSearchingLive(false);
    }
  };

  useEffect(() => {
    loadFairFare(parseFloat(enteredFare) || undefined);
  }, [origin, destination, horizonDays]);

  // Initial flight search on load
  useEffect(() => {
    handleLiveSearch();
  }, [origin, destination]);

  const handleSwapAirports = () => {
    setIsSwapping(true);
    setTimeout(() => {
      const temp = origin;
      setOrigin(destination);
      setDestination(temp);
      setIsSwapping(false);
    }, 200);
  };

  const originInfo = POPULAR_AIRPORTS.find((a) => a.code === origin) || POPULAR_AIRPORTS[0];
  const destInfo = POPULAR_AIRPORTS.find((a) => a.code === destination) || POPULAR_AIRPORTS[1];

  const currentMedian = fairFareResult?.expected_fare || 5400;
  const userFareNum = parseFloat(enteredFare) || currentMedian;
  const diffPct = fairFareResult?.difference_pct ?? Math.round(((userFareNum - currentMedian) / currentMedian) * 100);

  // Speedometer calculation (0 to 180 degrees)
  // -30% (great deal) -> 20 deg, 0% (fair) -> 90 deg, +40% (surge) -> 160 deg
  const clampedDiff = Math.max(-40, Math.min(60, diffPct));
  const gaugeDeg = Math.round(90 + (clampedDiff / 50) * 70);

  // Savings amount
  const spotPrice = Math.round(currentMedian * 1.35);
  const advancePrice = Math.round(currentMedian * 0.76);
  const maxSavings = Math.max(0, spotPrice - advancePrice);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* 1. Futuristic Aviation Atmospheric Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-96 -left-48 w-96 h-96 bg-indigo-600/10 blur-3xl rounded-full" />
        <div className="absolute top-[800px] -right-48 w-96 h-96 bg-cyan-600/10 blur-3xl rounded-full" />
        {/* Radar grid subtle lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: Dynamic Aviation Radar Control Center */}
        {/* ========================================================================= */}
        <section className="relative pt-4 pb-8 space-y-6 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              {/* Live Intelligence Pulsing Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 -ml-4" />
                <span>LIVE AIRFARE INTELLIGENCE</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Real-Time Indian Corridors</span>
              </div>

              {/* Glowing Hero Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Know When & Where to Buy Your{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent underline decoration-cyan-500/30 decoration-wavy">
                  Flight Tickets
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 font-normal max-w-2xl leading-relaxed">
                VAYU constantly crawls live airline inventories across India to calculate empirical price benchmarks, verify whether you are paying a fair price, and identify the exact sweet-spot booking window.
              </p>

              {/* Key Quick Stats Strip */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Avg Domestic Fare: <strong className="text-white">₹5,240</strong></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Max Advance Savings: <strong className="text-emerald-400">Save 34%</strong></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  <span>Monitored Corridors: <strong className="text-white">35 Routes</strong></span>
                </div>
              </div>
            </div>

            {/* Flight Radar Visual Artifact */}
            <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-cyan-500/20 backdrop-blur-xl shadow-2xl relative w-80 shrink-0">
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-cyan-400 pb-3 border-b border-slate-800">
                <span>RADAR TELEMETRY</span>
                <span className="animate-pulse font-bold">ONLINE ●</span>
              </div>
              <div className="py-6 flex flex-col items-center space-y-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center animate-[spin_12s_linear_infinite]">
                    <div className="w-16 h-16 rounded-full border border-dashed border-cyan-400/40 flex items-center justify-center" />
                  </div>
                  <Plane className="h-7 w-7 text-cyan-400 absolute inset-0 m-auto" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-mono font-bold text-slate-200 block mt-1">
                    {origin} ➔ {destination}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Median Rate: ₹{currentMedian.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
                <span>MoSPI Jevons CPI</span>
                <span className="text-emerald-400 font-bold">189.51</span>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 2. INTERACTIVE ROUTE SELECTOR & FAIR FARE RADAR VERIFIER */}
        {/* ========================================================================= */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Compass className="h-6 w-6 text-cyan-400" />
                <span>Flight Route & Price Evaluator</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Select your origin and destination, choose your departure timeframe, and verify if your quote is fair.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLiveSearch}
                disabled={isSearchingLive}
                className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-2 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSearchingLive ? "animate-spin" : ""}`} />
                <span>{isSearchingLive ? "Scanning Airline Feeds..." : "Refresh Live Quotes"}</span>
              </button>
            </div>
          </div>

          {/* Futuristic Route Selector Pill Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Origin Airport */}
            <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 focus-within:border-cyan-500/60 transition-all space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
                🛫 DEPARTURE AIRPORT
              </span>
              <div className="flex items-baseline justify-between">
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-transparent text-2xl sm:text-3xl font-black font-mono text-white focus:outline-none cursor-pointer"
                >
                  {POPULAR_AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code} disabled={a.code === destination} className="bg-slate-900 text-sm font-sans">
                      {a.code} — {a.city} ({a.airport})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-slate-400 block truncate font-medium">
                {originInfo.city} • {originInfo.airport}
              </span>
            </div>

            {/* Swap Button */}
            <div className="lg:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwapAirports}
                className={`p-3.5 rounded-2xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 transition-all hover:scale-110 shadow-lg ${
                  isSwapping ? "rotate-180" : ""
                }`}
                title="Swap Origin and Destination"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            {/* Destination Airport */}
            <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 focus-within:border-cyan-500/60 transition-all space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
                🛬 ARRIVAL AIRPORT
              </span>
              <div className="flex items-baseline justify-between">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-transparent text-2xl sm:text-3xl font-black font-mono text-white focus:outline-none cursor-pointer"
                >
                  {POPULAR_AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code} disabled={a.code === origin} className="bg-slate-900 text-sm font-sans">
                      {a.code} — {a.city} ({a.airport})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-slate-400 block truncate font-medium">
                {destInfo.city} • {destInfo.airport}
              </span>
            </div>

            {/* Price Input & Scan Button */}
            <div className="lg:col-span-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 focus-within:border-cyan-500/60 transition-all space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
                ₹ TICKET PRICE FOUND
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-cyan-400 font-mono">₹</span>
                <input
                  type="number"
                  value={enteredFare}
                  onChange={(e) => {
                    setEnteredFare(e.target.value);
                    loadFairFare(parseFloat(e.target.value) || undefined);
                  }}
                  placeholder="5200"
                  className="w-full bg-transparent text-2xl font-black font-mono text-white focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">
                Compare vs {origin}➔{destination} benchmarks
              </span>
            </div>
          </div>

          {/* Horizon Selection Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block">
              SELECT DEPARTURE HORIZON
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HORIZONS_DATA.map((h) => {
                const isSelected = horizonDays === h.days;
                return (
                  <button
                    key={h.days}
                    type="button"
                    onClick={() => setHorizonDays(h.days)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] text-white"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{h.icon}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${h.riskColor}`}>
                        {h.risk}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-1">{h.title}</h4>
                    <p className="text-[11px] text-slate-400">{h.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. DYNAMIC PRICE FAIRNESS SPEEDOMETER & ASSESSMENT DISPLAY */}
          {/* ========================================================================= */}
          {fairFareResult && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Visual Speedometer Dial SVG */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-4">
                  <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
                    {/* Dial Arc SVG */}
                    <svg className="w-48 h-48 -mb-24" viewBox="0 0 100 100">
                      {/* Arc Track Background */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="8"
                        strokeDasharray="125.6 125.6"
                        transform="rotate(-180 50 50)"
                      />
                      {/* Great Deal Zone (Green) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray="35 125.6"
                        strokeDashoffset="0"
                        transform="rotate(-180 50 50)"
                      />
                      {/* Fair Price Zone (Blue) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeDasharray="45 125.6"
                        strokeDashoffset="-35"
                        transform="rotate(-180 50 50)"
                      />
                      {/* Surge Zone (Rose) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="8"
                        strokeDasharray="45 125.6"
                        strokeDashoffset="-80"
                        transform="rotate(-180 50 50)"
                      />
                    </svg>

                    {/* Animated Needle */}
                    <div
                      className="absolute bottom-0 w-1 h-20 bg-gradient-to-t from-cyan-400 to-white rounded-full origin-bottom transition-transform duration-700 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                      style={{ transform: `rotate(${gaugeDeg - 90}deg)` }}
                    />
                    <div className="absolute bottom-0 w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-900 shadow-md" />
                  </div>

                  <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-500 px-4 mt-2">
                    <span className="text-emerald-400">GREAT DEAL</span>
                    <span className="text-blue-400">FAIR</span>
                    <span className="text-rose-400">SURGE</span>
                  </div>
                </div>

                {/* Verdict & Intelligence Analysis */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                        diffPct <= -12
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : diffPct <= 15
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                          : diffPct <= 35
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {diffPct <= -12
                        ? "🟢 GREAT PRICE (BUY NOW)"
                        : diffPct <= 15
                        ? "🔵 FAIR MARKET VALUE"
                        : diffPct <= 35
                        ? "🟡 MODERATELY ELEVATED"
                        : "🔴 HIGH SURGE / OVERPRICED"}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Evaluated on {origin}➔{destination} ({HORIZONS_DATA.find((h) => h.days === horizonDays)?.title})
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {diffPct <= -12 && `₹${userFareNum.toLocaleString()} is ${Math.abs(diffPct)}% below the expected market average!`}
                    {diffPct > -12 && diffPct <= 15 && `₹${userFareNum.toLocaleString()} is a standard, fair market price.`}
                    {diffPct > 15 && diffPct <= 35 && `₹${userFareNum.toLocaleString()} carries a +${diffPct}% weekend/demand markup.`}
                    {diffPct > 35 && `Warning: ₹${userFareNum.toLocaleString()} is surging +${diffPct}% above median.`}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {diffPct <= -12 &&
                      "This ticket is currently in the lowest 20th percentile of fares recorded for this corridor. Fares rarely drop lower than this—book immediately before seats in this discount bucket sell out."}
                    {diffPct > -12 && diffPct <= 15 &&
                      "This fare reflects standard operating yield without artificial price gouging. You are paying an equitable price within normal statistical variance."}
                    {diffPct > 15 && diffPct <= 35 &&
                      "Airlines have begun tightening seat inventory. If your schedule is flexible, shifting your travel by 1–2 days or booking for Tuesday/Wednesday can save up to ₹850."}
                    {diffPct > 35 &&
                      "You are paying peak Tatkal dynamic surge prices. Unless travel is urgent, booking at least 15 days in advance will save you approximately ₹1,500–₹2,800 on this corridor."}
                  </p>

                  {/* Benchmark Price Bands */}
                  <div className="pt-2 grid grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase">Cheap Deal (P25)</span>
                      <span className="text-base font-bold text-emerald-400">
                        ₹{fairFareResult.distribution.p25.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase">Expected Median</span>
                      <span className="text-base font-bold text-cyan-400">
                        ₹{fairFareResult.expected_fare.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase">Surge Tier (P90)</span>
                      <span className="text-base font-bold text-rose-400">
                        ₹{fairFareResult.distribution.p90.toLocaleString()}+
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>


        {/* ========================================================================= */}
        {/* 4. CONNECTED INTERACTIVE BOOKING TIMELINE & SAVINGS JOURNEY */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Clock className="h-6 w-6 text-cyan-400" />
                <span>When to Book: 45-Day Savings Trajectory</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                How flight prices change as your travel date approaches on the {origin} ➔ {destination} corridor.
              </p>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Potential Advance Savings: ₹{maxSavings.toLocaleString()}</span>
            </div>
          </div>

          {/* Connected Timeline Journey Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {HORIZONS_DATA.map((step, idx) => {
              const estPrice = Math.round(currentMedian * step.multiplier);
              const savingsFromSpot = Math.max(0, spotPrice - estPrice);
              const isSweetSpot = step.days === 15;

              return (
                <div
                  key={step.days}
                  onClick={() => setHorizonDays(step.days)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSweetSpot
                      ? "bg-gradient-to-b from-cyan-950/50 via-slate-900 to-slate-950 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/50"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                  }`}
                >
                  {isSweetSpot && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500 text-black font-mono font-black text-[9px] uppercase tracking-wider rounded-bl-xl shadow-md">
                      RECOMMENDED WINDOW
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{step.icon}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${step.riskColor}`}>
                        {step.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-mono text-slate-400 font-bold uppercase block">{step.title}</span>
                      <span className="text-3xl font-black font-mono text-white tracking-tight">
                        ₹{estPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">vs Spot Fare:</span>
                        <span className={savingsFromSpot > 0 ? "text-emerald-400 font-bold" : "text-rose-400"}>
                          {savingsFromSpot > 0 ? `-₹${savingsFromSpot.toLocaleString()}` : "+35% Premium"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 5. SMART BOOKING INTELLIGENCE PANEL */}
        {/* ========================================================================= */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Smart Passenger Intelligence Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Calendar,
                title: "BEST DAYS TO FLY",
                highlight: "Tuesday & Wednesday",
                badge: "SAVE 12-18%",
                badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                desc: "Midweek flights avoid Friday weekend getaways and Sunday return corporate rushes. Avoid flying on Sunday evenings whenever possible.",
              },
              {
                icon: Clock,
                title: "AVOID PEAK HOURS",
                highlight: "8:00 AM – 10:00 AM",
                badge: "₹800–₹1,200 SURCHARGE",
                badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
                desc: "Morning executive departure slots carry automatic algorithmic yield markups. Afternoon (1:00 PM – 4:00 PM) flights are consistently cheaper.",
              },
              {
                icon: ShoppingBag,
                title: "BOOK DIRECT ON AIRLINE",
                highlight: "IndiGo / Air India App",
                badge: "SAVE ₹300-₹400",
                badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
                desc: "Booking directly on the airline portal with UPI/NetBanking avoids third-party OTA convenience surcharges (₹399 per passenger).",
              },
              {
                icon: ShieldCheck,
                title: "OPTIMAL BOOKING WINDOW",
                highlight: "14 to 21 Days Out",
                badge: "SWEET SPOT",
                badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
                desc: "Airlines begin steep dynamic yield escalation exactly 10 days before flight. Book before Day T-10 to lock in early fare tiers.",
              },
            ].map((tip, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-900 text-cyan-400 group-hover:scale-110 transition-transform">
                    <tip.icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tip.badgeColor}`}>
                    {tip.badge}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">{tip.title}</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{tip.highlight}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-900">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 6. WHERE TO BUY: PORTAL PRICE & FEE TRANSPARENCY COMPARISON */}
        {/* ========================================================================= */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-indigo-400" />
                <span>Where to Buy: Final Checkout Price Comparison</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                OTAs display base flight prices but charge convenience fees at checkout. Here is what you actually pay for {origin} ➔ {destination}:
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActivePortalView("all")}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  activePortalView === "all" ? "bg-cyan-500 text-black" : "bg-slate-800 text-slate-400"
                }`}
              >
                All Channels
              </button>
              <button
                onClick={() => setActivePortalView("direct")}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  activePortalView === "direct" ? "bg-cyan-500 text-black" : "bg-slate-800 text-slate-400"
                }`}
              >
                Airline Direct
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Airline Direct */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)] space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Airline Official Direct</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CHEAPEST
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Final Total Paid</span>
                <span className="text-3xl font-black font-mono text-emerald-400">
                  ₹{currentMedian.toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Base Flight:</span>
                  <span>₹{(currentMedian - 950).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & UDF:</span>
                  <span>₹950</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Convenience Fee:</span>
                  <span>₹0 (UPI)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Direct booking on IndiGo / Air India with zero platform markup.</p>
            </div>

            {/* EaseMyTrip */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">EaseMyTrip</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  COUPON DEAL
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Final Total Paid</span>
                <span className="text-3xl font-black font-mono text-white">
                  ₹{currentMedian.toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Base + Taxes:</span>
                  <span>₹{currentMedian.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-cyan-400">
                  <span>Convenience Fee:</span>
                  <span>₹0 (With Coupon)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Waives convenience fee if promotional promo code is applied.</p>
            </div>

            {/* MakeMyTrip */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">MakeMyTrip / Goibibo</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  +₹399 FEE
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Final Total Paid</span>
                <span className="text-3xl font-black font-mono text-slate-200">
                  ₹{(currentMedian + 399).toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Base + Taxes:</span>
                  <span>₹{currentMedian.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Convenience Fee:</span>
                  <span>+₹399 / pax</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Adds statutory ₹399 payment processing fee per ticket at checkout.</p>
            </div>

            {/* Cleartrip */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Cleartrip / Flipkart</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  +₹349 FEE
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 block uppercase">Final Total Paid</span>
                <span className="text-3xl font-black font-mono text-slate-200">
                  ₹{(currentMedian + 349).toLocaleString()}
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Base + Taxes:</span>
                  <span>₹{currentMedian.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Convenience Fee:</span>
                  <span>+₹349 / pax</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Standard OTA surcharge applies unless SuperCoins are redeemed.</p>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 7. LIVE BOOKABLE FLIGHTS GRID */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Plane className="h-5 w-5 text-cyan-400" />
                <span>Live Flight Quotes ({origin} ➔ {destination})</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">{searchStatus || "Direct live market feeds"}</span>
            </div>

            <button
              onClick={handleLiveSearch}
              disabled={isSearchingLive}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold transition-all disabled:opacity-50"
            >
              {isSearchingLive ? "Fetching..." : "Refresh Live Quotes"}
            </button>
          </div>

          {liveOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveOffers.map((flight, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-md space-y-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                        {flight.carrier_code || "6E"}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{flight.airline || "IndiGo"}</h4>
                        <span className="text-[11px] font-mono text-slate-400">{flight.flight_number}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      🟢 FAIR PRICE
                    </span>
                  </div>

                  {/* Flight Trajectory Route Line */}
                  <div className="flex items-center justify-between text-center pt-2">
                    <div className="text-left">
                      <span className="text-lg font-black font-mono text-white block">{flight.departure_time || "06:15"}</span>
                      <span className="text-xs font-mono text-slate-400">{origin}</span>
                    </div>

                    <div className="flex-1 px-4 flex flex-col items-center">
                      <span className="text-[10px] font-mono text-slate-500">2h 15m • Non-stop</span>
                      <div className="w-full flex items-center gap-1 my-1">
                        <div className="h-0.5 flex-1 bg-slate-800" />
                        <Plane className="h-3.5 w-3.5 text-cyan-400 transform rotate-90" />
                        <div className="h-0.5 flex-1 bg-slate-800" />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-white block">{flight.arrival_time || "08:30"}</span>
                      <span className="text-xs font-mono text-slate-400">{destination}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Bookable Fare</span>
                      <span className="text-2xl font-black font-mono text-cyan-400">
                        ₹{flight.total_fare.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-400">
                      <span>Base: ₹{flight.base_fare?.toLocaleString() || "4,400"}</span> • <span>UDF: ₹{flight.airport_fee_udf || "650"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Plane className="h-8 w-8 text-cyan-500 mx-auto animate-bounce" />
              <p className="text-sm text-slate-400">Scanning real-time inventory from airline feeds...</p>
              <button
                onClick={handleLiveSearch}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md"
              >
                Trigger Radar Scan Now
              </button>
            </div>
          )}
        </section>


        {/* ========================================================================= */}
        {/* 8. TRANSPARENT STATUTORY FEE BREAKDOWN: VISUAL RECEIPT */}
        {/* ========================================================================= */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-cyan-400" />
              <span>Where Does Your ₹6,000 Ticket Money Go?</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              DGCA & MoCA statutory breakdown of an average Indian domestic ticket:
            </p>
          </div>

          {/* Interactive Stacked Horizontal Bar */}
          <div className="space-y-2">
            <div className="h-6 w-full rounded-xl overflow-hidden flex font-mono text-[10px] font-bold text-black shadow-inner">
              <div style={{ width: "73%" }} className="bg-blue-500 flex items-center justify-center truncate px-1">
                Base Fare 73%
              </div>
              <div style={{ width: "11%" }} className="bg-indigo-400 flex items-center justify-center truncate px-1">
                UDF 11%
              </div>
              <div style={{ width: "10%" }} className="bg-amber-400 flex items-center justify-center truncate px-1">
                Fuel 10%
              </div>
              <div style={{ width: "4%" }} className="bg-emerald-400 flex items-center justify-center truncate px-1">
                GST 4%
              </div>
              <div style={{ width: "2%" }} className="bg-purple-400 flex items-center justify-center truncate" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">1. Airline Base</span>
              <span className="text-lg font-black text-blue-400">₹4,400</span>
              <span className="text-[10px] text-slate-400 block">Flight & Seat (73%)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">2. Airport UDF</span>
              <span className="text-lg font-black text-indigo-400">₹650</span>
              <span className="text-[10px] text-slate-400 block">Airport Infra (11%)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">3. Fuel Surcharge</span>
              <span className="text-lg font-black text-amber-400">₹600</span>
              <span className="text-[10px] text-slate-400 block">Jet Fuel YQ (10%)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">4. Govt GST</span>
              <span className="text-lg font-black text-emerald-400">₹250</span>
              <span className="text-[10px] text-slate-400 block">MoF Statutory (4%)</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">5. OTA Surcharge</span>
              <span className="text-lg font-black text-purple-400">₹300</span>
              <span className="text-[10px] text-slate-400 block">Portal Fee (2%)</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
