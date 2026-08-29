"use client";

import React, { useState, useEffect } from "react";
import { fetchAirfareWeather, AirfareWeatherReport } from "../../lib/api";
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Compass,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function AirfareWeatherMap() {
  const [weather, setWeather] = useState<AirfareWeatherReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchAirfareWeather().then((res) => {
      if (isMounted) {
        setWeather(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case "THUNDERSTORM":
        return <CloudLightning className="h-6 w-6 text-rose-500 animate-bounce" />;
      case "RAINY":
        return <CloudRain className="h-6 w-6 text-amber-500" />;
      case "PARTLY_CLOUDY":
        return <CloudSun className="h-6 w-6 text-yellow-500" />;
      default:
        return <Sun className="h-6 w-6 text-emerald-500" />;
    }
  };

  const getPressureBadge = (p: string) => {
    switch (p) {
      case "SHOCK":
        return "bg-rose-500/20 text-rose-500 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      case "ELEVATED":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
      default:
        return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
    }
  };

  if (loading || !weather) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              ✈️ VAYU AIRFARE WEATHER (INDIA REGIONAL PULSE)
            </h3>
            <p className="text-xs text-slate-500">{weather.national_weather_summary}</p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {weather.weather_timestamp}
        </span>
      </div>

      {/* 5 Regional Weather Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {weather.regions.map((reg) => (
          <div
            key={reg.region_code}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {reg.region_name.replace(" Region", "")}
              </span>
              {getWeatherIcon(reg.weather_icon)}
            </div>

            <div className="font-mono space-y-1">
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {reg.average_route_cpi.toFixed(1)}
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${getPressureBadge(reg.pressure_level)}`}>
                {reg.pressure_level}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <span>Hub: {reg.primary_hub.split(" ")[0]}</span>
              {reg.active_shocks_count > 0 && (
                <span className="text-rose-500 font-bold">{reg.active_shocks_count} shock</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
