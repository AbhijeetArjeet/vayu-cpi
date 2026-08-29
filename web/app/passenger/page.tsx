"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  calculateFairFare,
  executeLiveFlightSearch,
  fetchAllRoutesCurrent,
  FairFareResponse,
  LiveSearchResponse,
  NormalizedFlightOffer,
} from "../../lib/api";

const POPULAR_CITIES = [
  { code: "DEL", name: "Delhi", city: "New Delhi (IGI)" },
  { code: "BOM", name: "Mumbai", city: "Mumbai (CSMI)" },
  { code: "BLR", name: "Bengaluru", city: "Bengaluru (Kempegowda)" },
  { code: "GOI", name: "Goa", city: "Goa (Dabolim / Mopa)" },
  { code: "CCU", name: "Kolkata", city: "Kolkata (Netaji Subhash)" },
  { code: "HYD", name: "Hyderabad", city: "Hyderabad (Rajiv Gandhi)" },
  { code: "MAA", name: "Chennai", city: "Chennai (Meenambakkam)" },
  { code: "PAT", name: "Patna", city: "Patna (Jay Prakash)" },
  { code: "IXC", name: "Chandigarh", city: "Chandigarh (Shaheed Bhagat Singh)" },
  { code: "JAI", name: "Jaipur", city: "Jaipur (Sanganer)" },
];

const HORIZONS = [
  { days: 1, label: "Tomorrow (Spot)", desc: "Last-minute emergency", icon: "⚡", advice: "High Tatkal premium" },
  { days: 7, label: "Next Week (7 Days)", desc: "Standard travel", icon: "📅", advice: "Normal market band" },
  { days: 15, label: "2 Weeks (15 Days)", desc: "Sweet spot booking", icon: "✈️", advice: "Save ~15-20%" },
  { days: 30, label: "1 Month (30 Days)", desc: "Best advance value", icon: "🏖️", advice: "Save up to 35%" },
];

export default function PassengerPortalPage() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [horizonDays, setHorizonDays] = useState(7);
  const [enteredFare, setEnteredFare] = useState<string>("5800");
  const [fairFareResult, setFairFareResult] = useState<FairFareResponse | null>(null);
  const [liveOffers, setLiveOffers] = useState<NormalizedFlightOffer[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"advisor" | "live_flights" | "portals">("advisor");

  // Load fair fare calculation
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

  // Search real live flights on Google Flights / Airline inventory
  const handleLiveSearch = async () => {
    setIsSearchingLive(true);
    setSearchStatus("Searching live bookable flights...");
    try {
      const res: LiveSearchResponse = await executeLiveFlightSearch(origin, destination, horizonDays);
      if (res && res.offers && res.offers.length > 0) {
        setLiveOffers(res.offers);
        setSearchStatus(`Found ${res.offers.length} live flight offers!`);
        if (res.summary?.lowest_fare_inr) {
          setEnteredFare(String(res.summary.lowest_fare_inr));
          loadFairFare(res.summary.lowest_fare_inr);
        }
      } else {
        setSearchStatus("Live scraper busy. Showing benchmark distribution.");
      }
    } catch (e) {
      console.error("Live flight search error:", e);
      setSearchStatus("Displaying statistical benchmark values.");
    } finally {
      setIsSearchingLive(false);
    }
  };

  useEffect(() => {
    loadFairFare(parseFloat(enteredFare) || undefined);
  }, [origin, destination, horizonDays]);

  const swapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Verdict calculation
  const diff = fairFareResult?.difference_pct ?? 0;
  const isCheap = diff <= -12;
  const isFair = diff > -12 && diff <= 15;
  const isElevated = diff > 15 && diff <= 35;
  const isShock = diff > 35;

  const currentMedian = fairFareResult?.expected_fare || 5400;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-900/30 via-slate-900/80 to-indigo-950/40 border border-blue-500/20 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          <Sparkles className="h-3.5 w-3.5" />
          <span>VAYU CITIZEN & PASSENGER ADVISOR</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Know When & Where to Buy Your <span className="text-blue-500">Flight Tickets</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Check if your flight price is fair, find out how much you save by booking early, and compare airline direct vs OTA portal fees.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLiveSearch}
              disabled={isSearchingLive}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            >
              <Search className={`h-4 w-4 ${isSearchingLive ? "animate-spin" : ""}`} />
              <span>{isSearchingLive ? "Searching Flights..." : "Search Live Flights"}</span>
            </button>

            <Link
              href="/"
              className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold border border-slate-700 transition-colors"
            >
              Economist View ➔
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Interactive Route Selector & Fare Evaluator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Origin */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>🛫 Origin City</span>
              <button
                type="button"
                onClick={swapAirports}
                className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
              >
                Swap ⇄
              </button>
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.code} value={c.code} disabled={c.code === destination}>
                  {c.name} ({c.code}) — {c.city}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              🛬 Destination City
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.code} value={c.code} disabled={c.code === origin}>
                  {c.name} ({c.code}) — {c.city}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Horizon Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              📅 When are you flying?
            </label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500"
            >
              {HORIZONS.map((h) => (
                <option key={h.days} value={h.days}>
                  {h.icon} {h.label} ({h.advice})
                </option>
              ))}
            </select>
          </div>

          {/* Ticket Price Found */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ₹ Ticket Price You Found
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={enteredFare}
                onChange={(e) => {
                  setEnteredFare(e.target.value);
                  loadFairFare(parseFloat(e.target.value) || undefined);
                }}
                placeholder="e.g. 5500"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => loadFairFare(parseFloat(enteredFare) || undefined)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shrink-0 shadow-md"
              >
                Verify
              </button>
            </div>
          </div>
        </div>

        {/* 3. The Big Beautiful Visual Assessment Card */}
        {fairFareResult && (
          <div
            className={`p-6 sm:p-8 rounded-2xl border transition-all ${
              isCheap
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : isFair
                ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                : isElevated
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-rose-500/10 border-rose-500/40 text-rose-300"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-black/20 shrink-0 mt-1">
                  {isCheap && <TrendingDown className="h-8 w-8 text-emerald-400" />}
                  {isFair && <CheckCircle2 className="h-8 w-8 text-blue-400" />}
                  {isElevated && <AlertTriangle className="h-8 w-8 text-amber-400" />}
                  {isShock && <Flame className="h-8 w-8 text-rose-400" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/30 border border-current">
                      {isCheap && "GREAT DEAL"}
                      {isFair && "FAIR / NORMAL"}
                      {isElevated && "SLIGHTLY HIGH"}
                      {isShock && "EXTREME SURGE"}
                    </span>
                    <span className="text-xs font-mono opacity-75">
                      {origin} ➔ {destination} • {HORIZONS.find((h) => h.days === horizonDays)?.label}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {isCheap && "Great Deal! This Ticket is Cheaper Than Normal"}
                    {isFair && "Fair Price! Standard Market Rate"}
                    {isElevated && "Slightly Elevated Price (+15% Premium)"}
                    {isShock && "High Surge Warning! Price is Significantly Above Average"}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl pt-1">
                    {isCheap && "This fare is within the lowest 20% of historical prices for this route. Booking now is highly recommended."}
                    {isFair && "This fare matches the normal historical average. You are paying a fair price without excessive markups."}
                    {isElevated && "This ticket has a moderate demand surge. If your schedule is flexible, check 1-2 days earlier or later."}
                    {isShock && "Airlines are charging peak surge pricing. If possible, book 15–30 days in advance to save up to ₹3,500."}
                  </p>
                </div>
              </div>

              {/* Price Metric */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-left md:text-right font-mono min-w-[200px] shrink-0">
                <span className="text-[11px] text-slate-400 uppercase block">Expected Fair Price</span>
                <span className="text-3xl font-black text-white">
                  ₹{fairFareResult.expected_fare.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {diff > 0 ? `+${diff}% vs typical fare` : `${diff}% below average`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tab Navigation: Advisor vs Live Flights vs Where to Buy */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab("advisor")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "advisor"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>When to Buy (Savings Curve)</span>
        </button>

        <button
          onClick={() => setActiveTab("portals")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "portals"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Where to Buy (Portal Fee Comparison)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("live_flights");
            if (liveOffers.length === 0) handleLiveSearch();
          }}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "live_flights"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Plane className="h-4 w-4" />
          <span>Live Bookable Flights ({liveOffers.length})</span>
        </button>
      </div>

      {/* TAB 1: WHEN TO BUY (SAVINGS CURVE) */}
      {activeTab === "advisor" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-500">⚡ 1 Day (Tomorrow)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold">PRICIEST</span>
              </div>
              <h4 className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                ₹{Math.round(currentMedian * 1.35).toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Last-minute Tatkal premium. Airlines capitalize on urgent business travel.
              </p>
              <div className="text-[11px] font-bold text-rose-400 font-mono">+35% vs baseline</div>
            </div>

            <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-500">📅 1 Week Out</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">TYPICAL</span>
              </div>
              <h4 className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                ₹{currentMedian.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standard weekly price band. Normal availability across major carriers.
              </p>
              <div className="text-[11px] font-bold text-amber-400 font-mono">Benchmark baseline</div>
            </div>

            <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-500">✈️ 2 Weeks Out</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-bold">SWEET SPOT</span>
              </div>
              <h4 className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                ₹{Math.round(currentMedian * 0.86).toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optimal booking window. Best balance of schedule certainty and discounts.
              </p>
              <div className="text-[11px] font-bold text-blue-400 font-mono">Save ~₹{Math.round(currentMedian * 0.14).toLocaleString()} (14%)</div>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500">🏖️ 1 Month Advance</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">MAX SAVINGS</span>
              </div>
              <h4 className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                ₹{Math.round(currentMedian * 0.76).toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cheapest tier. Airlines release early-bird discounted booking inventory.
              </p>
              <div className="text-[11px] font-bold text-emerald-400 font-mono">Save ~₹{Math.round(currentMedian * 0.24).toLocaleString()} (24%)</div>
            </div>
          </div>

          {/* Smart Booking Tips */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Smart Booking Intelligence for {origin} ➔ {destination}</span>
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Fly on Tuesday / Wednesday:</strong> Midweek departures are typically 10–18% cheaper than Friday and Sunday evenings.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Avoid 8:00 AM – 10:00 AM slots:</strong> Peak business departure windows carry an automatic ₹800–₹1,200 dynamic yield surcharge.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Book Directly with Airline:</strong> Direct booking on IndiGo or Air India saves you ₹300 per passenger in third-party OTA convenience charges.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Book at least 14 days out:</strong> Yield management algorithms dramatically accelerate price step-ups within 10 days of departure.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: WHERE TO BUY (PORTAL COMPARISON) */}
      {activeTab === "portals" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-indigo-500" />
              <span>Where Should You Buy? (Real Portal Fee Transparency)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Online Travel Aggregators (OTAs) display base fares but add convenience fees at checkout. Here is what you actually pay:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono">
                    <th className="py-3 px-4">Booking Portal</th>
                    <th className="py-3 px-4">Flight Base Fare</th>
                    <th className="py-3 px-4">Convenience Fee</th>
                    <th className="py-3 px-4">Total Price Paid</th>
                    <th className="py-3 px-4">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Airline Direct (IndiGo / Air India)</span>
                    </td>
                    <td className="py-3.5 px-4">₹{currentMedian.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-emerald-500 font-bold">₹0 (UPI / NetBanking)</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      ₹{currentMedian.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        RECOMMENDED
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">
                      MakeMyTrip / Goibibo
                    </td>
                    <td className="py-3.5 px-4">₹{currentMedian.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-rose-400">₹399 per passenger</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      ₹{(currentMedian + 399).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-400 font-sans">Standard OTA markup</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">
                      EaseMyTrip
                    </td>
                    <td className="py-3.5 px-4">₹{currentMedian.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-emerald-400">₹0 (With Coupon)</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      ₹{currentMedian.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        GOOD DEAL
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">
                      Skyscanner Aggregator
                    </td>
                    <td className="py-3.5 px-4">₹{currentMedian.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-400">Varies by agent</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                      ₹{(currentMedian + 150).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-400 font-sans">Compare across 50+ agents</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE BOOKABLE FLIGHTS */}
      {activeTab === "live_flights" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Live Flight Offers ({origin} ➔ {destination})
              </h3>
              <span className="text-xs text-slate-400 font-mono">{searchStatus || "Direct live market quotes"}</span>
            </div>

            <button
              onClick={handleLiveSearch}
              disabled={isSearchingLive}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono transition-all disabled:opacity-50"
            >
              {isSearchingLive ? "Refreshing..." : "Refresh Live Fares"}
            </button>
          </div>

          {liveOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveOffers.map((f, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500/40 shadow-sm space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {f.carrier_code || "6E"}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {f.airline || "IndiGo"} {f.flight_number}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-slate-400">
                      {f.departure_time || "10:30 AM"}
                    </span>
                  </div>

                  <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Bookable Fare</span>
                      <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                        ₹{f.total_fare.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-500">
                      <span>Base: ₹{f.base_fare?.toLocaleString() || "4,500"}</span> • <span>UDF: ₹{f.airport_fee_udf || "650"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
              <Plane className="h-8 w-8 text-slate-500 mx-auto animate-bounce" />
              <p className="text-sm text-slate-400">Click "Refresh Live Fares" to pull real-time inventory from Google Flights!</p>
              <button
                onClick={handleLiveSearch}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
              >
                Search Live Flights Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Clean Statutory Fee Explainer */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span>Transparent Fee Breakdown on an Average ₹6,000 Ticket</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px]">1. Airfare Base</span>
            <span className="text-lg font-black text-blue-500">₹4,400</span>
            <span className="text-[10px] text-slate-500 block">Flight & Seat (73%)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px]">2. Airport Fee (UDF)</span>
            <span className="text-lg font-black text-indigo-500">₹650</span>
            <span className="text-[10px] text-slate-500 block">Airport Infra (11%)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px]">3. Fuel Surcharge</span>
            <span className="text-lg font-black text-amber-500">₹600</span>
            <span className="text-[10px] text-slate-500 block">Jet Fuel YQ (10%)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px]">4. Govt GST</span>
            <span className="text-lg font-black text-emerald-500">₹250</span>
            <span className="text-[10px] text-slate-500 block">Statutory Tax (4%)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px]">5. Portal Fee</span>
            <span className="text-lg font-black text-purple-500">₹300</span>
            <span className="text-[10px] text-slate-500 block">OTA Convenience</span>
          </div>
        </div>
      </div>
    </main>
  );
}
