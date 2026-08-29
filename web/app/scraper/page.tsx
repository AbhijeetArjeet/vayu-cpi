"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plane,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  ShieldCheck,
  Zap,
  Download,
  AlertCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Filter,
} from "lucide-react";
import {
  executeLiveFlightSearch,
  fetchSupportedCorridors,
  NormalizedFlightOffer,
  LiveSearchResponse,
} from "../../lib/api";

const PRIORITY_AIRPORTS = [
  { code: "DEL", city: "Delhi (DEL)" },
  { code: "BOM", city: "Mumbai (BOM)" },
  { code: "BLR", city: "Bengaluru (BLR)" },
  { code: "CCU", city: "Kolkata (CCU)" },
  { code: "HYD", city: "Hyderabad (HYD)" },
  { code: "MAA", city: "Chennai (MAA)" },
  { code: "AMD", city: "Ahmedabad (AMD)" },
  { code: "PNQ", city: "Pune (PNQ)" },
  { code: "GOI", city: "Goa (GOI)" },
  { code: "PAT", city: "Patna (PAT)" },
  { code: "COK", city: "Kochi (COK)" },
  { code: "JAI", city: "Jaipur (JAI)" },
  { code: "LKO", city: "Lucknow (LKO)" },
  { code: "GAU", city: "Guwahati (GAU)" },
];

const HORIZONS = [
  { days: 1, label: "T+1 (Spot)", desc: "1 Day Advance" },
  { days: 7, label: "T+7 (Week)", desc: "1 Week Advance" },
  { days: 15, label: "T+15 (Fortnight)", desc: "2 Weeks Advance" },
  { days: 30, label: "T+30 (Month)", desc: "1 Month Advance" },
  { days: 45, label: "T+45 (Long)", desc: "45 Days Advance" },
];

export default function LiveScraperPage() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [horizonDays, setHorizonDays] = useState(7);
  const [saveToDb, setSaveToDb] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<LiveSearchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAirlineFilter, setSelectedAirlineFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"price" | "time" | "airline">("price");

  // Initial fetch on page mount
  useEffect(() => {
    handleExecuteScrape("DEL", "BOM", 7);
  }, []);

  const handleExecuteScrape = async (orig = origin, dest = destination, horizon = horizonDays) => {
    if (orig === dest) {
      setErrorMessage("Origin and Destination cannot be the same airport.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await executeLiveFlightSearch(orig, dest, horizon, undefined, saveToDb);
      setSearchResult(data);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to execute live flight scraping. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!searchResult) return;
    const blob = new Blob([JSON.stringify(searchResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flight_scrape_${origin}_${destination}_T${horizonDays}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!searchResult || !searchResult.offers.length) return;
    const headers = [
      "Airline",
      "CarrierCode",
      "FlightNumber",
      "Origin",
      "Destination",
      "DepartureDate",
      "DepartureTime",
      "BaseFare",
      "Taxes",
      "UDF",
      "ConvenienceFee",
      "TotalFare",
      "BookingWindow",
      "Source",
      "DirectOTA",
    ];
    const rows = searchResult.offers.map((o) => [
      o.airline,
      o.carrier_code,
      o.flight_number,
      o.origin,
      o.destination,
      o.departure_date,
      o.departure_time,
      o.base_fare,
      o.taxes,
      o.airport_fee_udf,
      o.convenience_fee,
      o.total_fare,
      o.booking_window,
      o.source,
      o.is_ota_direct ? "TRUE" : "FALSE",
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flight_scrape_${origin}_${destination}_T${horizonDays}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter and sort offers
  const filteredOffers = (searchResult?.offers || []).filter((o) => {
    if (selectedAirlineFilter === "ALL") return true;
    return o.carrier_code === selectedAirlineFilter || o.airline.toLowerCase().includes(selectedAirlineFilter.toLowerCase());
  });

  filteredOffers.sort((a, b) => {
    if (sortBy === "price") return a.total_fare - b.total_fare;
    if (sortBy === "time") return a.departure_time.localeCompare(b.departure_time);
    if (sortBy === "airline") return a.airline.localeCompare(b.airline);
    return 0;
  });

  // Unique airlines in current results
  const uniqueCarriers = Array.from(new Set((searchResult?.offers || []).map((o) => o.airline)));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <Zap className="h-4 w-4" /> Live Multi-Carrier Inspection Engine
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Automated Flight Scraper & Price Inspector
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Trigger real-time multi-carrier flight scraping, unbundle fee components, and inspect live market pricing across domestic Indian city pairs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              disabled={!searchResult?.offers.length}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={handleExportJson}
              disabled={!searchResult?.offers.length}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
            >
              <Download className="h-4 w-4" /> Export JSON
            </button>
          </div>
        </div>

        {/* Interactive Query & Control Form */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Origin Airport */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Origin Hub
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {PRIORITY_AIRPORTS.map((a) => (
                  <option key={`orig-${a.code}`} value={a.code}>
                    {a.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Airport */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Destination Hub
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {PRIORITY_AIRPORTS.map((a) => (
                  <option key={`dest-${a.code}`} value={a.code}>
                    {a.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Advance Horizon */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Advance Booking Horizon
              </label>
              <select
                value={horizonDays}
                onChange={(e) => setHorizonDays(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {HORIZONS.map((h) => (
                  <option key={`h-${h.days}`} value={h.days}>
                    {h.label} — {h.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Trigger Scraping Button */}
            <div>
              <button
                onClick={() => handleExecuteScrape()}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl py-2.5 px-4 shadow-md transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Scraping Live Fares...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" /> Trigger Live Scrape
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Horizon Quick Chips & Options */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium mr-1">Quick Horizons:</span>
              {HORIZONS.map((h) => (
                <button
                  key={`chip-${h.days}`}
                  onClick={() => {
                    setHorizonDays(h.days);
                    handleExecuteScrape(origin, destination, h.days);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    horizonDays === h.days
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToDb}
                onChange={(e) => setSaveToDb(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>Auto-Sync to National CPI Database</span>
            </label>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Summary Metrics Banner */}
        {searchResult && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">Offers Scraped</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {searchResult.summary.total_offers_scraped}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                {searchResult.diagnostics.elapsed_ms}ms latency
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">Lowest Fare</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{searchResult.summary.lowest_fare_inr.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">All-in spot price</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">Median Fare</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₹{searchResult.summary.median_fare_inr.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Market midpoint</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">Highest Fare</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                ₹{searchResult.summary.highest_fare_inr.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Peak flexi tier</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">Cheapest Airline</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
                {searchResult.summary.cheapest_carrier}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Lowest base yield</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase">Database Status</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Synced
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                +{searchResult.diagnostics.saved_to_db_records} observations
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Toolbar */}
        {searchResult && searchResult.offers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Airline Filter:
              </span>
              <button
                onClick={() => setSelectedAirlineFilter("ALL")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                  selectedAirlineFilter === "ALL"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                All Carriers ({searchResult.offers.length})
              </button>
              {uniqueCarriers.map((airline) => (
                <button
                  key={`filter-${airline}`}
                  onClick={() => setSelectedAirlineFilter(airline)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                    selectedAirlineFilter === airline
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {airline}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium"
              >
                <option value="price">Price: Low to High</option>
                <option value="time">Departure Time</option>
                <option value="airline">Airline Name</option>
              </select>
            </div>
          </div>
        )}

        {/* Detailed Scraped Offers Grid */}
        {searchResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Real-Time Scraped Offers ({filteredOffers.length})</span>
              <span>Corridor: {origin} → {destination}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOffers.map((offer, idx) => (
                <div
                  key={`offer-${offer.flight_number}-${idx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl p-5 shadow-sm transition group"
                >
                  {/* Airline & Flight Number Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                        {offer.carrier_code}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          {offer.airline}
                          <span className="text-xs font-normal text-slate-500">({offer.flight_number})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {offer.departure_date} • {offer.booking_window}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                        ₹{offer.total_fare.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Total All-Inclusive
                      </div>
                    </div>
                  </div>

                  {/* Flight Timing & Stops */}
                  <div className="grid grid-cols-3 gap-2 py-4 items-center text-center">
                    <div className="text-left">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {offer.departure_time}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">{offer.origin}</div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="text-[11px] font-medium text-slate-500">{offer.duration}</div>
                      <div className="w-full flex items-center justify-center gap-1 my-1">
                        <div className="h-0.5 flex-1 bg-slate-300 dark:bg-slate-700" />
                        <Plane className="h-3.5 w-3.5 text-blue-500 transform rotate-90" />
                        <div className="h-0.5 flex-1 bg-slate-300 dark:bg-slate-700" />
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                        {offer.stops === 0 ? "Non-Stop" : `${offer.stops} Stop`}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {offer.arrival_time}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">{offer.destination}</div>
                    </div>
                  </div>

                  {/* Unbundled Fare Decomposition Breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Base Fare:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{offer.base_fare.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Airport Fee (UDF):</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{offer.airport_fee_udf.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Taxes & GST:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{offer.taxes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Convenience Fee:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{offer.convenience_fee.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Source: {offer.source}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          offer.is_ota_direct
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {offer.is_ota_direct ? "Direct Feed" : "Aggregated Feed"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
