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
} from "lucide-react";
import { calculateFairFare, fetchAllRoutesCurrent, RouteJevonsIndex, FairFareResponse } from "../../lib/api";

const POPULAR_CITIES = [
  { code: "DEL", name: "Delhi", city: "New Delhi (IGI)" },
  { code: "BOM", name: "Mumbai", city: "Mumbai (CSMI)" },
  { code: "BLR", name: "Bengaluru", city: "Bengaluru (Kempegowda)" },
  { code: "GOI", name: "Goa", city: "Goa (Dabolim / Mopa)" },
  { code: "CCU", name: "Kolkata", city: "Kolkata (Netaji Subhash)" },
  { code: "HYD", name: "Hyderabad", city: "Hyderabad (Rajiv Gandhi)" },
  { code: "MAA", name: "Chennai", city: "Chennai (Meenambakkam)" },
  { code: "PAT", name: "Patna", city: "Patna (Jay Prakash)" },
];

const HORIZONS = [
  { days: 1, label: "Tomorrow (Spot / Emergency)", desc: "1 day before flight", icon: "⚡" },
  { days: 7, label: "Next Week (7 Days out)", desc: "Standard weekly travel", icon: "📅" },
  { days: 15, label: "2 Weeks Advance (15 Days)", desc: "Planned vacation / work", icon: "✈️" },
  { days: 30, label: "1 Month Advance (30 Days)", desc: "Best value leisure planning", icon: "🏖️" },
];

export default function PassengerPortalPage() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [horizonDays, setHorizonDays] = useState(7);
  const [enteredFare, setEnteredFare] = useState<string>("6500");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FairFareResponse | null>(null);
  const [popularRoutes, setPopularRoutes] = useState<RouteJevonsIndex[]>([]);

  // Evaluate fare on load or when parameters change
  const handleCheckFare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (origin === destination) return;
    setLoading(true);
    try {
      const fareNum = parseFloat(enteredFare) || undefined;
      const res = await calculateFairFare({
        origin,
        destination,
        horizon_days: horizonDays,
        current_fare: fareNum,
      });
      if (res) setResult(res);
    } catch (err) {
      console.error("Fair fare check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCheckFare();
    fetchAllRoutesCurrent("live", 30).then((data) => {
      if (data?.routes) setPopularRoutes(data.routes.slice(0, 6));
    });
  }, [origin, destination, horizonDays]);

  const swapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Status helper
  const getVerdictDetails = () => {
    if (!result) return null;
    const diff = result.difference_pct ?? 0;
    if (result.fare_status === "UNUSUALLY_CHEAP" || diff <= -15) {
      return {
        title: "Great Deal! Price is Below Average",
        badge: "GREAT DEAL",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        icon: TrendingDown,
        advice: "This ticket is significantly cheaper than usual. We recommend booking now before prices rise.",
      };
    }
    if (result.fare_status === "FAIR_NORMAL" || (diff > -15 && diff <= 15)) {
      return {
        title: "Normal & Fair Market Price",
        badge: "FAIR PRICE",
        color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
        icon: CheckCircle2,
        advice: "This price is typical for this route and booking horizon. You are paying a standard market fare.",
      };
    }
    if (result.fare_status === "ELEVATED" || (diff > 15 && diff <= 35)) {
      return {
        title: "Slightly Elevated / High Demand",
        badge: "ELEVATED FARE",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        icon: AlertTriangle,
        advice: "Prices are slightly higher than normal due to weekend or seasonal demand. Booking 1-2 weeks earlier could save money.",
      };
    }
    return {
      title: "High Surge Warning / Overpriced",
      badge: "SURGE ALERT",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      icon: Flame,
      advice: "This fare is surging heavily (+40%+ above typical price). If your travel dates are flexible, consider booking 15-30 days in advance.",
    };
  };

  const verdict = getVerdictDetails();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans">
      {/* 1. Friendly Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/10 text-blue-500 border border-blue-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>VAYU Passenger & Citizen Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Is Your Flight Ticket <span className="text-blue-600 dark:text-blue-400">Fairly Priced</span>?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          No complex economics jargon. Just select your route, enter the price you found, and we will tell you if you are getting a great deal or paying surge prices.
        </p>
      </div>

      {/* 2. Interactive Easy Fare Checker Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 shadow-xl space-y-6">
        <form onSubmit={handleCheckFare} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Origin */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🛫 From (Origin)</span>
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.code} value={c.code} disabled={c.code === destination}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🛬 To (Destination)</span>
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.code} value={c.code} disabled={c.code === origin}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Horizon Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>📅 When are you flying?</span>
            </label>
            <select
              value={horizonDays}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500"
            >
              {HORIZONS.map((h) => (
                <option key={h.days} value={h.days}>
                  {h.icon} {h.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Input & Button */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ₹ Price You Found (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="e.g. 5400"
                value={enteredFare}
                onChange={(e) => setEnteredFare(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all shrink-0"
              >
                {loading ? "Checking..." : "Check"}
              </button>
            </div>
          </div>
        </form>

        {/* 3. The Big Visual Verdict Box */}
        {result && verdict && (
          <div className={`p-6 rounded-2xl border transition-all ${verdict.color}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/10 shrink-0">
                  <verdict.icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-current">
                      {verdict.badge}
                    </span>
                    <span className="text-xs font-mono opacity-80">
                      {origin} ➔ {destination} ({HORIZONS.find((h) => h.days === horizonDays)?.label})
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-1">{verdict.title}</h3>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono">
                <span className="text-xs opacity-75 uppercase block">Fair / Expected Average</span>
                <span className="text-3xl font-black">₹{result.expected_fare.toLocaleString()}</span>
              </div>
            </div>

            <p className="mt-4 text-sm opacity-90 border-t border-current/20 pt-3">
              💡 <strong>Traveler Guidance:</strong> {verdict.advice}
            </p>
          </div>
        )}

        {/* 4. Normal Price Band Gauge */}
        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Typical Cheap Deal (10th–25th Percentile)
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{result.distribution.p10.toLocaleString()} – ₹{result.distribution.p25.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Normal Average Fare (Median)
              </span>
              <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                ₹{result.expected_fare.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                Peak Surge Threshold (90th Percentile)
              </span>
              <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                ₹{result.distribution.p90.toLocaleString()}+
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. "When is the Best Time to Book?" Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            When Should You Book to Save Money?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-500 uppercase">⚡ 1 Day (Tomorrow)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold">PRICIEST</span>
            </div>
            <h4 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              ₹{result ? Math.round(result.expected_fare * 1.35).toLocaleString() : "8,200"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Emergency spot fares. Airlines charge peak last-minute premiums.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-500 uppercase">📅 1 Week Out</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">MODERATE</span>
            </div>
            <h4 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              ₹{result ? result.expected_fare.toLocaleString() : "5,400"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standard business / weekly travel price band.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-500 uppercase">✈️ 2 Weeks Out</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-bold">SWEET SPOT</span>
            </div>
            <h4 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              ₹{result ? Math.round(result.expected_fare * 0.88).toLocaleString() : "4,750"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Best balance between price and schedule flexibility. Saves ~12%.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 uppercase">🏖️ 1 Month Advance</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">LOWEST FARE</span>
            </div>
            <h4 className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              ₹{result ? Math.round(result.expected_fare * 0.78).toLocaleString() : "4,200"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cheapest advance booking band. Saves up to 25% on average.
            </p>
          </div>
        </div>
      </div>

      {/* 6. "Where Does Your Ticket Money Go?" Transparent Fee Breakdown */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-indigo-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Where Does Your Ticket Money Go? (Statutory Fee Breakdown)
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Airline tickets are not just the flight cost. Here is what you actually pay for an average ₹6,000 domestic ticket:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">1. Airfare Base</span>
            <span className="text-lg font-bold text-blue-500">₹4,400</span>
            <span className="text-[10px] text-slate-500 block">Flight & Crew (73%)</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">2. Airport Fee (UDF)</span>
            <span className="text-lg font-bold text-indigo-500">₹650</span>
            <span className="text-[10px] text-slate-500 block">Airport Infra (11%)</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">3. Fuel Surcharge</span>
            <span className="text-lg font-bold text-amber-500">₹600</span>
            <span className="text-[10px] text-slate-500 block">Jet Fuel YQ (10%)</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">4. Govt GST</span>
            <span className="text-lg font-bold text-emerald-500">₹250</span>
            <span className="text-[10px] text-slate-500 block">Statutory Tax (4%)</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">5. Portal Fee</span>
            <span className="text-lg font-bold text-purple-500">₹300</span>
            <span className="text-[10px] text-slate-500 block">Convenience Fee</span>
          </div>
        </div>
      </div>

      {/* 7. Quick Popular Route Shortcuts */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Popular Domestic Routes Today
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { o: "DEL", d: "BOM", name: "Delhi ⇄ Mumbai", fare: "₹5,240", status: "Fair" },
            { o: "BLR", d: "DEL", name: "Bengaluru ⇄ Delhi", fare: "₹6,180", status: "Normal" },
            { o: "DEL", d: "GOI", name: "Delhi ⇄ Goa", fare: "₹6,890", status: "Slightly Elevated" },
            { o: "BOM", d: "GOI", name: "Mumbai ⇄ Goa", fare: "₹3,450", status: "Great Deal" },
            { o: "DEL", d: "CCU", name: "Delhi ⇄ Kolkata", fare: "₹5,620", status: "Fair" },
            { o: "DEL", d: "PAT", name: "Delhi ⇄ Patna", fare: "₹4,980", status: "Normal" },
          ].map((r) => (
            <button
              key={`${r.o}-${r.d}`}
              onClick={() => {
                setOrigin(r.o);
                setDestination(r.d);
                window.scrollTo({ top: 100, behavior: "smooth" });
              }}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-400 transition-colors">
                  {r.name}
                </span>
                <span className="text-[11px] text-slate-400 block">Typical ~{r.fare}</span>
              </div>
              <span className="text-xs font-mono text-blue-500 font-bold group-hover:translate-x-1 transition-transform">
                Check →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 8. Link to Advanced Macro Dashboard */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/20 to-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Are you a Researcher, Government Official, or Analyst?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch to the Advanced Econometric Command Center for DGCA weighting, 3-sigma anomaly detection, and index decomposition.
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md"
        >
          <span>Open Econometric Dashboard</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
