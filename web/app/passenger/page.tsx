'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  Plane,
  AlertCircle,
  HelpCircle,
  Bell,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  Sun,
  Sunrise,
  Sunset,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  fetchFareCalendar,
  fetchPassengerFareScore,
  fetchBookingRecommendation,
  fetchMLPrediction,
  FareCalendarResponse,
  FareCalendarDay,
  FareScoreResponse,
  BookingRecommendationResponse,
  MLPredictionResponse,
} from '@/lib/api';

const CORRIDORS = [
  { orig: 'DEL', dest: 'BOM', label: 'Delhi ➔ Mumbai (Trunk)' },
  { orig: 'BOM', dest: 'DEL', label: 'Mumbai ➔ Delhi' },
  { orig: 'DEL', dest: 'BLR', label: 'Delhi ➔ Bengaluru' },
  { orig: 'BLR', dest: 'DEL', label: 'Bengaluru ➔ Delhi' },
  { orig: 'BOM', dest: 'GOI', label: 'Mumbai ➔ Goa (Leisure)' },
  { orig: 'DEL', dest: 'CCU', label: 'Delhi ➔ Kolkata' },
  { orig: 'DEL', dest: 'HYD', label: 'Delhi ➔ Hyderabad' },
  { orig: 'BLR', dest: 'BOM', label: 'Bengaluru ➔ Mumbai' },
  { orig: 'DEL', dest: 'PAT', label: 'Delhi ➔ Patna' },
];

export default function PassengerIntelligencePage() {
  const [origin, setOrigin] = useState<string>('DEL');
  const [destination, setDestination] = useState<string>('BOM');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Intelligence states
  const [calendarData, setCalendarData] = useState<FareCalendarResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<FareCalendarDay | null>(null);
  const [fareScore, setFareScore] = useState<FareScoreResponse | null>(null);
  const [recommendation, setRecommendation] = useState<BookingRecommendationResponse | null>(null);
  const [mlOutlook, setMlOutlook] = useState<MLPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);

  // Local storage state for Alerts & Saved Routes
  const [savedRoutes, setSavedRoutes] = useState<string[]>([]);
  const [alertTargetFare, setAlertTargetFare] = useState<string>('5000');
  const [alertSet, setAlertSet] = useState<boolean>(false);

  // Load Saved Routes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vayu_saved_routes');
      if (saved) setSavedRoutes(JSON.parse(saved));
    } catch {
      // safe fallback
    }
  }, []);

  const toggleSaveRoute = (corridor: string) => {
    let updated = [...savedRoutes];
    if (updated.includes(corridor)) {
      updated = updated.filter((c) => c !== corridor);
    } else {
      updated.push(corridor);
    }
    setSavedRoutes(updated);
    try {
      localStorage.setItem('vayu_saved_routes', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Fetch all passenger intelligence when corridor or date changes
  const loadPassengerData = async () => {
    setLoading(true);
    try {
      const calRes = await fetchFareCalendar(origin, destination, selectedYear, selectedMonth);
      setCalendarData(calRes);

      if (calRes && calRes.days.length > 0) {
        // Pick mid-month or first available day as default
        const defDay = calRes.days.find((d) => d.is_cheapest) || calRes.days[14] || calRes.days[0];
        setSelectedDay(defDay);

        const [scoreRes, recRes, mlRes] = await Promise.all([
          fetchPassengerFareScore(origin, destination, defDay.fare, defDay.booking_horizon_days),
          fetchBookingRecommendation(origin, destination, defDay.date, defDay.fare, defDay.booking_horizon_days),
          fetchMLPrediction({
            origin,
            destination,
            departure_date: defDay.date,
            booking_horizon: defDay.booking_horizon_days,
            current_fare: defDay.fare,
          }),
        ]);

        setFareScore(scoreRes);
        setRecommendation(recRes);
        setMlOutlook(mlRes);
      }
    } catch (err) {
      console.error('Failed to load passenger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengerData();
  }, [origin, destination, selectedMonth, selectedYear]);

  // When user clicks a different date on the calendar
  const handleSelectDay = async (day: FareCalendarDay) => {
    setSelectedDay(day);
    try {
      const [scoreRes, recRes, mlRes] = await Promise.all([
        fetchPassengerFareScore(origin, destination, day.fare, day.booking_horizon_days),
        fetchBookingRecommendation(origin, destination, day.date, day.fare, day.booking_horizon_days),
        fetchMLPrediction({
          origin,
          destination,
          departure_date: day.date,
          booking_horizon: day.booking_horizon_days,
          current_fare: day.fare,
        }),
      ]);
      setFareScore(scoreRes);
      setRecommendation(recRes);
      setMlOutlook(mlRes);
    } catch (err) {
      console.error('Failed updating date intelligence:', err);
    }
  };

  const currentCorridorStr = `${origin}-${destination}`;
  const isCurrentSaved = savedRoutes.includes(currentCorridorStr);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  VAYU Passenger Intelligence Hub
                </span>
                <span className="text-xs text-slate-400">MoSPI Econometric Yield Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {origin} ➔ {destination} Fare Intelligence
              </h1>
            </div>

            {/* Corridor Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={`${origin}-${destination}`}
                onChange={(e) => {
                  const [o, d] = e.target.value.split('-');
                  setOrigin(o);
                  setDestination(d);
                }}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                {CORRIDORS.map((c) => (
                  <option key={`${c.orig}-${c.dest}`} value={`${c.orig}-${c.dest}`}>
                    {c.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => toggleSaveRoute(currentCorridorStr)}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                  isCurrentSaved
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title={isCurrentSaved ? 'Route Saved' : 'Save Route'}
              >
                {isCurrentSaved ? <BookmarkCheck className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
                <span className="hidden sm:inline">{isCurrentSaved ? 'Saved' : 'Save Route'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* SMART DATE RECOMMENDATIONS STRIP */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Best Days to Fly & Savings Recommendation
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Cheapest Date: <span className="text-emerald-400">{calendarData?.cheapest_date || 'Tuesday'}</span> at{' '}
                <span className="text-emerald-400 font-extrabold">₹{calendarData?.cheapest_fare.toLocaleString()}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Booking on this date saves approximately <strong className="text-emerald-400">₹{calendarData?.max_savings.toLocaleString()}</strong> compared to peak weekend fares on this corridor.
              </p>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Optimal Window</div>
                <div className="text-xs font-extrabold text-cyan-300 mt-0.5">{calendarData?.best_departure_window || 'Tue & Wed Midweek'}</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Sweet-Spot Horizon</div>
                <div className="text-xs font-extrabold text-emerald-300 mt-0.5">{calendarData?.best_booking_horizon || 'T+14 to T+21 Days'}</div>
              </div>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Typical Range</div>
                <div className="text-xs font-extrabold text-slate-200 mt-0.5">{calendarData?.typical_fare_range || '₹4,200 – ₹6,800'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* DECISION LAYER: SHOULD I BOOK NOW + FARE SCORE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: SHOULD I BOOK NOW? */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Decision Engine</span>
              </div>
              <span className="text-xs text-slate-400">
                Departure: <strong className="text-slate-200">{selectedDay?.date || 'Selected Date'}</strong>
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Recommended Passenger Action</div>
                <div className="text-2xl sm:text-3xl font-black mt-1 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-lg sm:text-xl font-extrabold tracking-wide ${
                      recommendation?.recommendation === 'BOOK NOW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : recommendation?.recommendation === 'WAIT & WATCH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      recommendation?.recommendation === 'BOOK NOW' ? 'bg-emerald-400' : recommendation?.recommendation === 'WAIT & WATCH' ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                    {recommendation?.recommendation || 'BOOK NOW'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
                <div className="text-xs text-slate-400">Quoted Selected Fare</div>
                <div className="text-2xl font-black text-cyan-400">
                  ₹{selectedDay ? selectedDay.fare.toLocaleString() : '5,820'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Expected Trend: <span className="font-bold text-slate-200">{recommendation?.expected_short_term_movement_pct}%</span>
                </div>
              </div>
            </div>

            {/* Reason text & "WHY?" Button */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                {recommendation?.primary_reason || 'Loading corridor yield assessment...'}
              </p>
              <button
                onClick={() => setShowWhyModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30 transition shrink-0 self-start sm:self-auto"
              >
                <HelpCircle className="w-4 h-4" />
                Why? (Model Factors)
              </button>
            </div>
          </div>

          {/* Card 2: FARE SCORE (0-100) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Passenger Fare Score</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  0–100 Scale
                </span>
              </div>

              {/* Big Score Dial Display */}
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {fareScore?.fare_score || 64}
                </span>
                <span className="text-lg font-bold text-slate-500">/ 100</span>
                <span className={`ml-auto px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${
                  (fareScore?.fare_score || 64) <= 30
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : (fareScore?.fare_score || 64) <= 50
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : (fareScore?.fare_score || 64) <= 70
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    : (fareScore?.fare_score || 64) <= 85
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {fareScore?.rating || 'Normal'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    (fareScore?.fare_score || 64) <= 50
                      ? 'bg-emerald-400'
                      : (fareScore?.fare_score || 64) <= 70
                      ? 'bg-cyan-400'
                      : 'bg-rose-400'
                  }`}
                  style={{ width: `${fareScore?.fare_score || 64}%` }}
                />
              </div>

              <div className="text-xs text-slate-300 mt-4 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Typical Baseline Fare:</span>
                  <span className="font-bold text-slate-200">₹{fareScore?.typical_fare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Percentile:</span>
                  <span className="font-bold text-slate-200">{fareScore?.percentile}th percentile</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deviation from Normal:</span>
                  <span className={`font-bold ${((fareScore?.deviation_pct || 0) >= 0) ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(fareScore?.deviation_pct || 0) > 0 ? `+${fareScore?.deviation_pct}%` : `${fareScore?.deviation_pct}%`}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic mt-4 pt-3 border-t border-slate-800">
              {fareScore?.recommendation_text || 'Standard market price based on historical corridor distributions.'}
            </p>
          </div>
        </div>

        {/* FARE CALENDAR HEATMAP */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                Fare Calendar Heatmap ({calendarData?.month_name || 'September'} {selectedYear})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any date to see exact fare intelligence, booking recommendations, and price scores.
              </p>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMonth(selectedMonth === 1 ? 12 : selectedMonth - 1)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-200 px-2">
                {calendarData?.month_name} {selectedYear}
              </span>
              <button
                onClick={() => setSelectedMonth(selectedMonth === 12 ? 1 : selectedMonth + 1)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Names Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData?.days.map((day) => {
              const isSelected = selectedDay?.date === day.date;
              return (
                <div
                  key={day.date}
                  onClick={() => handleSelectDay(day)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {day.is_cheapest && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950 uppercase tracking-tight shadow">
                      Cheapest
                    </span>
                  )}
                  <div className="text-[11px] font-semibold text-slate-400">
                    {new Date(day.date).getDate()}
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-white mt-1">
                    ₹{day.fare.toLocaleString()}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        day.status === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : day.status === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-cyan-500/10 text-cyan-300'
                      }`}
                    >
                      {day.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> 🟢 LOW (Save up to 30%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> 🟡 NORMAL (Standard fare)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> 🔴 HIGH (Weekend / Surge)
              </span>
            </div>
            <span className="italic">{calendarData?.disclaimer}</span>
          </div>
        </div>

        {/* ADVANCE BOOKING HORIZON MATRIX (T+1 to T+45) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Advance Purchase Horizon Curve ({origin} ➔ {destination})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Historical empirical fare trajectory across booking lead times.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Sweet Spot: T+14 to T+21
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { h: 'T+1', days: 'Tomorrow (Tatkal)', mult: 1.35, note: 'Peak Last-Minute Surcharge' },
              { h: 'T+7', days: '1 Week Out', mult: 1.05, note: 'Business Travel Window' },
              { h: 'T+15', days: '2 Weeks Out', mult: 0.88, isSweet: true, note: '★ Historical Sweet Spot' },
              { h: 'T+30', days: '1 Month Out', mult: 0.82, note: 'Early Bird Discount Tier' },
              { h: 'T+45', days: '1.5 Months Out', mult: 0.80, note: 'Base Inventory Baseline' },
            ].map((hz) => {
              const estFare = roundToTens((fareScore?.typical_fare || 5400) * hz.mult);
              return (
                <div
                  key={hz.h}
                  className={`p-4 rounded-xl border transition ${
                    hz.isSweet
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">{hz.h}</span>
                    {hz.isSweet && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500 text-slate-950 uppercase">
                        Sweet Spot
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{hz.days}</div>
                  <div className="text-lg font-black text-cyan-300 mt-2">₹{estFare.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{hz.note}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WHERE TO BUY CHECKOUT TRANSPARENCY & PRICE ALERTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Where to Buy Transparency */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Where to Buy: Checkout Fee Transparency
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              OTAs display low initial fares but add mandatory platform convenience fees at final payment checkout.
            </p>

            <div className="space-y-3">
              {/* Airline Direct */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-white flex items-center gap-2">
                    Airline Official Direct (IndiGo / Air India)
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-slate-950 uppercase">
                      Cheapest
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Convenience Fee: ₹0 (UPI / Net Banking)</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm text-emerald-400">
                    ₹{selectedDay ? selectedDay.fare.toLocaleString() : '5,820'}
                  </div>
                  <div className="text-[10px] text-emerald-300 font-semibold">Zero Markup</div>
                </div>
              </div>

              {/* EaseMyTrip */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-200">EaseMyTrip</div>
                  <div className="text-xs text-slate-400 mt-0.5">Convenience Fee: ₹0 (With Promo Coupon)</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-100">
                    ₹{selectedDay ? selectedDay.fare.toLocaleString() : '5,820'}
                  </div>
                  <div className="text-[10px] text-slate-400">Coupon Match</div>
                </div>
              </div>

              {/* MakeMyTrip */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-200">MakeMyTrip / Goibibo</div>
                  <div className="text-xs text-slate-400 mt-0.5">Convenience Fee: +₹399 / pax at checkout</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-rose-400">
                    ₹{selectedDay ? (selectedDay.fare + 399).toLocaleString() : '6,219'}
                  </div>
                  <div className="text-[10px] text-rose-400 font-semibold">+₹399 Fee</div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Alert Simulator (Local/Demo) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                Set Passenger Price Alert
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Receive an instant on-screen alert if airfares for {origin} ➔ {destination} on {selectedDay?.date || 'this date'} drop below your target price.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Target Fare Threshold (₹)</label>
                  <input
                    type="number"
                    value={alertTargetFare}
                    onChange={(e) => setAlertTargetFare(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="5000"
                  />
                </div>

                <button
                  onClick={() => setAlertSet(true)}
                  className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  {alertSet ? '✓ Alert Active (Local Simulator)' : 'Set Price Alert'}
                </button>
              </div>
            </div>

            {alertSet && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Price alert set locally for {origin} ➔ {destination} below ₹{alertTargetFare}.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "WHY THIS PREDICTION?" EXPLAINABILITY MODAL */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowWhyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Model Explainability</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Why this recommendation for {origin} ➔ {destination}?
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              VAYU&apos;s Time-Series Gradient Boosted regressor evaluates real-time market microstructure variance, booking window lead times, and empirical route percentiles:
            </p>

            <div className="space-y-2.5 mb-6">
              {recommendation?.top_factors.map((factor, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>Model Confidence: <strong className="text-cyan-400">{Math.round((recommendation?.confidence_score || 0.82) * 100)}%</strong></span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/ai?q=Why should I ${recommendation?.recommendation} for ${origin} to ${destination} on ${selectedDay?.date}?`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5 transition border border-cyan-500/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask VAYU AI Analyst
                </Link>
                <button
                  onClick={() => setShowWhyModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roundToTens(val: number): number {
  return Math.round(val / 10) * 10;
}
