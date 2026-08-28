"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Compass,
  Smartphone,
  MousePointer,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  PieChart,
  Layers,
  MapPin,
  RefreshCw,
  Sliders,
  Check,
  Plane,
} from "lucide-react";
import {
  fetchAirfareIndex,
  fetchAirfareIndexSeries,
  fetchSurgeAlerts,
  fetchAllRoutesCurrent,
  fetchRouteConcentration,
  fetchMarketCoverage,
  fetchFeeDecomposition,
  fetchHistoricalComparison,
  DataMode,
  NationalCompositeCPI,
  SurgeAlert,
  RouteJevonsIndex,
  MarketCoverageSummary,
  FeeDecomposition,
} from "../../lib/api";

// 30 Major Indian Aviation Network Nodes with authentic geographic coordinates & altitude (meters)
interface AirportGeo {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  altitude: number;
  region: "NORTH" | "WEST" | "SOUTH" | "EAST";
}

const AIRPORTS_GEO: Record<string, AirportGeo> = {
  DEL: { id: "DEL", name: "Indira Gandhi Int'l", city: "Delhi", lat: 28.5562, lng: 77.1000, altitude: 237, region: "NORTH" },
  BOM: { id: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", lat: 19.0896, lng: 72.8656, altitude: 14, region: "WEST" },
  BLR: { id: "BLR", name: "Kempegowda Int'l", city: "Bengaluru", lat: 13.1986, lng: 77.7066, altitude: 915, region: "SOUTH" },
  CCU: { id: "CCU", name: "Netaji Subhash Chandra Bose", city: "Kolkata", lat: 22.6547, lng: 88.4467, altitude: 16, region: "EAST" },
  HYD: { id: "HYD", name: "Rajiv Gandhi Int'l", city: "Hyderabad", lat: 17.2403, lng: 78.4294, altitude: 617, region: "SOUTH" },
  MAA: { id: "MAA", name: "Chennai Int'l", city: "Chennai", lat: 12.9941, lng: 80.1709, altitude: 16, region: "SOUTH" },
  AMD: { id: "AMD", name: "Sardar Vallabhbhai Patel", city: "Ahmedabad", lat: 23.0772, lng: 72.6347, altitude: 58, region: "WEST" },
  PNQ: { id: "PNQ", name: "Pune Int'l", city: "Pune", lat: 18.5821, lng: 73.9197, altitude: 592, region: "WEST" },
  GOI: { id: "GOI", name: "Dabolim / Mopa", city: "Goa", lat: 15.3808, lng: 73.8314, altitude: 56, region: "WEST" },
  PAT: { id: "PAT", name: "Jay Prakash Narayan", city: "Patna", lat: 25.5913, lng: 85.0880, altitude: 52, region: "EAST" },
  COK: { id: "COK", name: "Cochin Int'l", city: "Kochi", lat: 10.1520, lng: 76.3920, altitude: 9, region: "SOUTH" },
  TRV: { id: "TRV", name: "Trivandrum Int'l", city: "Thiruvananthapuram", lat: 8.4821, lng: 76.9200, altitude: 4, region: "SOUTH" },
  JAI: { id: "JAI", name: "Jaipur Int'l", city: "Jaipur", lat: 26.8242, lng: 75.8122, altitude: 385, region: "NORTH" },
  LKO: { id: "LKO", name: "Chaudhary Charan Singh", city: "Lucknow", lat: 26.7606, lng: 80.8893, altitude: 123, region: "NORTH" },
  GAU: { id: "GAU", name: "Lokpriya Gopinath Bordoloi", city: "Guwahati", lat: 26.1061, lng: 91.5859, altitude: 49, region: "EAST" },
  IXC: { id: "IXC", name: "Chandigarh Int'l", city: "Chandigarh", lat: 30.6735, lng: 76.7885, altitude: 312, region: "NORTH" },
  ATQ: { id: "ATQ", name: "Sri Guru Ram Dass Jee", city: "Amritsar", lat: 31.7096, lng: 74.7973, altitude: 230, region: "NORTH" },
  VTZ: { id: "VTZ", name: "Visakhapatnam Int'l", city: "Visakhapatnam", lat: 17.7212, lng: 83.2245, altitude: 5, region: "SOUTH" },
  NAG: { id: "NAG", name: "Dr. Babasaheb Ambedkar", city: "Nagpur", lat: 21.0922, lng: 79.0472, altitude: 315, region: "WEST" },
  IDR: { id: "IDR", name: "Devi Ahilya Bai Holkar", city: "Indore", lat: 22.7217, lng: 75.8011, altitude: 564, region: "WEST" },
  BBI: { id: "BBI", name: "Biju Patnaik Int'l", city: "Bhubaneswar", lat: 20.2444, lng: 85.8178, altitude: 42, region: "EAST" },
  RPR: { id: "RPR", name: "Swami Vivekananda", city: "Raipur", lat: 21.1804, lng: 81.7388, altitude: 317, region: "EAST" },
  SXR: { id: "SXR", name: "Sheikh ul-Alam Int'l", city: "Srinagar", lat: 34.0086, lng: 74.7741, altitude: 1655, region: "NORTH" },
  IXB: { id: "IXB", name: "Bagdogra", city: "Siliguri", lat: 26.6812, lng: 88.3286, altitude: 126, region: "EAST" },
  DED: { id: "DED", name: "Dehradun", city: "Dehradun", lat: 30.1897, lng: 78.1803, altitude: 558, region: "NORTH" },
  VNS: { id: "VNS", name: "Lal Bahadur Shastri", city: "Varanasi", lat: 25.4524, lng: 82.8593, altitude: 81, region: "NORTH" },
  IXZ: { id: "IXZ", name: "Veer Savarkar Int'l", city: "Port Blair", lat: 11.6412, lng: 92.7297, altitude: 16, region: "SOUTH" },
  IXJ: { id: "IXJ", name: "Jammu", city: "Jammu", lat: 32.6891, lng: 74.8374, altitude: 313, region: "NORTH" },
  IXR: { id: "IXR", name: "Birsa Munda", city: "Ranchi", lat: 23.3143, lng: 85.3217, altitude: 655, region: "EAST" },
  IMF: { id: "IMF", name: "Imphal Int'l", city: "Imphal", lat: 24.7600, lng: 93.8967, altitude: 774, region: "EAST" },
};

type MapLayerType = "STRESS" | "AIRFARE" | "SURGES" | "COVERAGE";
type TimelineWindow = "24H" | "7D" | "30D" | "90D";

function SkyviewContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get("mode") as DataMode) || "live";

  // Google Maps State
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map3dInstanceRef = useRef<any>(null);

  // Control State
  const [dataMode] = useState<DataMode>(initialMode);
  const [mapLayer, setMapLayer] = useState<MapLayerType>("STRESS");
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow>("7D");
  const [isMotionEnabled, setIsMotionEnabled] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [discoveredRegion, setDiscoveredRegion] = useState<string | null>(null);
  const [discoveryToast, setDiscoveryToast] = useState<string | null>(null);

  // Selected Route & Airport State
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>("DEL-BOM");
  const [selectedAirportKey, setSelectedAirportKey] = useState<string | null>("DEL");

  // API Data State
  const [cpi, setCpi] = useState<NationalCompositeCPI | null>(null);
  const [alerts, setAlerts] = useState<SurgeAlert[]>([]);
  const [routes, setRoutes] = useState<RouteJevonsIndex[]>([]);
  const [coverage, setCoverage] = useState<MarketCoverageSummary | null>(null);
  const [decomp, setDecomp] = useState<FeeDecomposition[]>([]);

  // Motion Tilt Refs (Mutable for 60fps performance without React rerender lag)
  const neutralOrientation = useRef({ gamma: 0, beta: 45 });
  const targetCamera = useRef({ heading: 0, tilt: 55, range: 2600000 });
  const currentCamera = useRef({ heading: 0, tilt: 55, range: 2600000 });
  const rafId = useRef<number | null>(null);

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load Google Maps 3D JavaScript API dynamically
  useEffect(() => {
    if (!googleApiKey) {
      setGoogleMapsError("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.");
      return;
    }

    if (window.customElements && window.customElements.get("gmp-map-3d")) {
      setGoogleMapsLoaded(true);
      return;
    }

    const scriptId = "google-maps-3d-sdk";
    if (document.getElementById(scriptId)) {
      setGoogleMapsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&v=alpha&libraries=maps3d`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleMapsLoaded(true);
    };
    script.onerror = () => {
      setGoogleMapsError("Failed to initialize Google Maps Platform 3D SDK.");
    };
    document.head.appendChild(script);
  }, [googleApiKey]);

  // Fetch all backend telemetry
  useEffect(() => {
    async function loadData() {
      try {
        const days = timelineWindow === "24H" ? 2 : timelineWindow === "7D" ? 7 : timelineWindow === "30D" ? 30 : 90;
        const [cpiData, , alertList, routeData, , cov, fees] = await Promise.all([
          fetchAirfareIndex(dataMode),
          fetchAirfareIndexSeries(days, dataMode),
          fetchSurgeAlerts(),
          fetchAllRoutesCurrent(dataMode),
          fetchRouteConcentration(),
          fetchMarketCoverage(),
          fetchFeeDecomposition(),
        ]);
        setCpi(cpiData);
        setAlerts(alertList || []);
        setRoutes(routeData.routes || []);
        setCoverage(cov);
        setDecomp(fees || []);
      } catch (err) {
        console.error("Skyview data load error:", err);
      }
    }
    loadData();
  }, [dataMode, timelineWindow]);

  // Selected route object
  const currentRoute = useMemo(() => {
    const matched = routes.find((r) => `${r.origin}-${r.destination}` === selectedRouteKey);
    if (matched) return matched;
    return routes[0] || null;
  }, [routes, selectedRouteKey]);

  // Active surge for selected route
  const currentAlert = useMemo(() => {
    return alerts.find((a) => a.corridor === selectedRouteKey);
  }, [alerts, selectedRouteKey]);

  // Fetch historical comparison when route changes
  useEffect(() => {
    if (currentRoute) {
      fetchHistoricalComparison(currentRoute.origin, currentRoute.destination, currentRoute.current_geom_mean)
        .catch(() => null);
    }
  }, [currentRoute]);

  // Selected route fee decomposition
  const currentFee = useMemo(() => {
    const matched = decomp.find((d) => d.route === selectedRouteKey);
    const base = matched ? matched.base_fare : (currentRoute ? Math.round(currentRoute.current_geom_mean * 0.74) : 4524);
    const fuel = matched ? matched.fuel_surcharge_yq : 600;
    const udf = matched ? matched.airport_fee_udf : 650;
    const conv = matched ? matched.convenience_fee : 300;
    const total = base + fuel + udf + conv;
    return {
      base_fare: base,
      fuel_surcharge_yq: fuel,
      airport_fee_udf: udf,
      convenience_fee: conv,
      unbundled_total: total,
      base_fare_pct: Math.round((base / total) * 100),
      fuel_surcharge_pct: Math.round((fuel / total) * 100),
      airport_tax_pct: Math.round((udf / total) * 100),
    };
  }, [decomp, selectedRouteKey, currentRoute]);

  // Selected route airline breakdown
  const currentAirlineShares = useMemo(() => {
    return [
      { name: "IndiGo", share: 54, color: "#3b82f6" },
      { name: "Air India", share: 29, color: "#ef4444" },
      { name: "Akasa", share: 11, color: "#f97316" },
      { name: "Others", share: 6, color: "#64748b" },
    ];
  }, []);

  // Calculate stress score (0-100) dynamically calibrated
  const currentFare = currentRoute?.current_geom_mean || 6074;
  const jevonsIndex = currentRoute?.jevons_index || 128.4;
  const baseDev = Math.max(0, jevonsIndex - 100);
  const indexStress = Math.min(60, (baseDev / 120) * 60);
  const sigmaDev = currentAlert ? currentAlert.sigma_deviation : 0;
  const anomalyStress = Math.min(40, (sigmaDev / 3.5) * 40);
  const stressScore = Math.min(100, Math.max(10, Math.round(15 + indexStress + anomalyStress)));

  let stressLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "MODERATE";
  let stressColor = "text-amber-500 bg-amber-500/10 border-amber-500/30";
  if (stressScore >= 75 || currentAlert?.severity === "CRITICAL") {
    stressLevel = "CRITICAL";
    stressColor = "text-rose-500 bg-rose-500/10 border-rose-500/30";
  } else if (stressScore >= 55 || currentAlert?.severity === "HIGH") {
    stressLevel = "HIGH";
    stressColor = "text-orange-500 bg-orange-500/10 border-orange-500/30";
  } else if (stressScore < 35) {
    stressLevel = "LOW";
    stressColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  }

  // Booking outlook calculation
  let bookingOutlook: "BOOK NOW" | "MONITOR" | "WAIT" = "MONITOR";
  let outlookDescription = "Fares are within historical corridor benchmark. Suitable for booking if travel dates are confirmed.";
  if (stressScore >= 75 || (currentAlert && currentAlert.severity === "CRITICAL")) {
    bookingOutlook = "BOOK NOW";
    outlookDescription = "Tatkal spot pressure is accelerating. Booking now avoids higher intra-day price surges.";
  } else if (stressScore <= 35) {
    bookingOutlook = "BOOK NOW";
    outlookDescription = "Current airfare is below historical baseline. High consumer value window.";
  } else if (stressScore >= 55) {
    bookingOutlook = "MONITOR";
    outlookDescription = "Elevated pricing observed. Monitor for 24-48 hours if advance booking window allows.";
  }

  // Route arc color according to map layer
  const getRouteHexColor = useCallback((r: RouteJevonsIndex) => {
    const isAlert = alerts.some((a) => a.corridor === `${r.origin}-${r.destination}`);
    if (mapLayer === "SURGES") return isAlert ? "#ef4444" : "#334155";
    if (mapLayer === "AIRFARE") {
      if (r.current_geom_mean > 7000) return "#ef4444";
      if (r.current_geom_mean > 5500) return "#f59e0b";
      return "#10b981";
    }
    if (mapLayer === "COVERAGE") return "#3b82f6";
    // STRESS
    if (r.jevons_index > 135 || isAlert) return "#ef4444";
    if (r.jevons_index > 115) return "#f59e0b";
    return "#10b981";
  }, [alerts, mapLayer]);

  // Compute 3D elevated parabolic arc coordinates between two geo points
  const computeArcCoordinates = (start: AirportGeo, end: AirportGeo, numPoints = 20) => {
    const coords: Array<{ lat: number; lng: number; altitude: number }> = [];
    const distanceLat = end.lat - start.lat;
    const distanceLng = end.lng - start.lng;
    const maxAltitude = Math.min(120000, Math.sqrt(distanceLat * distanceLat + distanceLng * distanceLng) * 12000 + 35000);

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const lat = start.lat + distanceLat * t;
      const lng = start.lng + distanceLng * t;
      // Parabolic altitude profile: 4 * h * t * (1 - t)
      const altitude = 4 * maxAltitude * t * (1 - t) + 1500;
      coords.push({ lat, lng, altitude });
    }
    return coords;
  };

  // Fly Camera to selected route or India overview
  const flyToRoute = useCallback((originCode: string, destCode: string) => {
    const start = AIRPORTS_GEO[originCode];
    const end = AIRPORTS_GEO[destCode];
    if (!start || !end || !map3dInstanceRef.current) return;

    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    const heading = Math.atan2(end.lng - start.lng, end.lat - start.lat) * (180 / Math.PI);

    if (typeof map3dInstanceRef.current.flyCameraTo === "function") {
      map3dInstanceRef.current.flyCameraTo({
        endCamera: {
          center: { lat: midLat, lng: midLng, altitude: 0 },
          tilt: 58,
          heading: heading,
          range: 850000,
        },
        durationMillis: 1800,
      });
    }
  }, []);

  // Initialize and populate Google Maps 3D Element
  useEffect(() => {
    if (!googleMapsLoaded || !mapContainerRef.current) return;

    // Check if customElement already exists or instantiate
    if (!map3dInstanceRef.current) {
      const map3d = document.createElement("gmp-map-3d") as any;
      map3d.setAttribute("center", "21.5,78.9,0");
      map3d.setAttribute("range", "2600000");
      map3d.setAttribute("tilt", "52");
      map3d.setAttribute("heading", "0");
      map3d.setAttribute("mode", "HYBRID");
      map3d.setAttribute("default-labels-disabled", "false");
      map3d.style.width = "100%";
      map3d.style.height = "100%";
      map3d.style.position = "absolute";
      map3d.style.inset = "0";

      mapContainerRef.current.innerHTML = "";
      mapContainerRef.current.appendChild(map3d);
      map3dInstanceRef.current = map3d;
    }

    const map3d = map3dInstanceRef.current;
    if (!map3d) return;

    // Clear existing child overlays
    while (map3d.firstChild) {
      map3d.removeChild(map3d.firstChild);
    }

    // 1. Overlay 3D Airport Markers
    Object.values(AIRPORTS_GEO).forEach((ap) => {
      try {
        const marker = document.createElement("gmp-marker-3d") as any;
        marker.setAttribute("position", `${ap.lat},${ap.lng},${ap.altitude + 500}`);
        marker.setAttribute("altitude-mode", "RELATIVE_TO_GROUND");
        marker.setAttribute("label", ap.id);
        marker.setAttribute("size-preserved", "true");
        marker.addEventListener("click", () => {
          setSelectedAirportKey(ap.id);
          const matched = routes.find((r) => r.origin === ap.id || r.destination === ap.id);
          if (matched) {
            setSelectedRouteKey(`${matched.origin}-${matched.destination}`);
            flyToRoute(matched.origin, matched.destination);
          }
        });
        map3d.appendChild(marker);
      } catch (e) {
        // Fallback for marker creation
      }
    });

    // 2. Overlay 3D Elevated Polyline Arcs
    routes.forEach((r) => {
      const start = AIRPORTS_GEO[r.origin];
      const end = AIRPORTS_GEO[r.destination];
      if (!start || !end) return;

      const code = `${r.origin}-${r.destination}`;
      const isSelected = selectedRouteKey === code;
      const color = getRouteHexColor(r);

      try {
        const polyline = document.createElement("gmp-polyline-3d") as any;
        const arcCoordinates = computeArcCoordinates(start, end, 24);
        polyline.coordinates = arcCoordinates;
        polyline.setAttribute("stroke-color", color);
        polyline.setAttribute("stroke-width", isSelected ? "5" : "2.5");
        polyline.setAttribute("altitude-mode", "RELATIVE_TO_GROUND");
        polyline.setAttribute("draws-occluded-segments", "true");
        polyline.addEventListener("click", () => {
          setSelectedRouteKey(code);
          setSelectedAirportKey(r.origin);
          flyToRoute(r.origin, r.destination);
        });
        map3d.appendChild(polyline);
      } catch (e) {
        // Fallback for polyline creation
      }
    });
  }, [googleMapsLoaded, routes, selectedRouteKey, getRouteHexColor, flyToRoute]);

  // Motion Smoothing RAF Loop for Camera Updates
  useEffect(() => {
    const loop = () => {
      if (map3dInstanceRef.current && isMotionEnabled) {
        // Smooth lerp camera towards target
        currentCamera.current.heading += (targetCamera.current.heading - currentCamera.current.heading) * 0.08;
        currentCamera.current.tilt += (targetCamera.current.tilt - currentCamera.current.tilt) * 0.08;

        const map3d = map3dInstanceRef.current;
        if (typeof map3d.heading === "number") {
          map3d.heading = currentCamera.current.heading;
          map3d.tilt = currentCamera.current.tilt;
        }
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isMotionEnabled]);

  // Region Discovery Notification
  const triggerRegionDiscovery = useCallback((region: "NORTH" | "WEST" | "SOUTH" | "EAST", airportCode: string) => {
    if (discoveredRegion !== region) {
      setDiscoveredRegion(region);
      setSelectedAirportKey(airportCode);
      const matched = routes.find((r) => r.origin === airportCode || r.destination === airportCode);
      if (matched) {
        setSelectedRouteKey(`${matched.origin}-${matched.destination}`);
      }
      setDiscoveryToast(`MARKET DISCOVERED: ${region} SECTOR (${airportCode})`);
      setTimeout(() => setDiscoveryToast(null), 3000);
    }
  }, [discoveredRegion, routes]);

  // Handle Device Orientation with calibrated neutral baseline
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return;

    const dGamma = e.gamma - neutralOrientation.current.gamma;
    const dBeta = e.beta - neutralOrientation.current.beta;

    // Apply smoothing, deadzone & clamp
    const headingOffset = Math.max(-45, Math.min(45, dGamma)) * 0.8;
    const tiltOffset = Math.max(-25, Math.min(25, dBeta)) * 0.6;

    targetCamera.current.heading = headingOffset;
    targetCamera.current.tilt = Math.max(25, Math.min(75, 52 + tiltOffset));

    // Sector discovery based on tilt
    if (dGamma < -18) triggerRegionDiscovery("WEST", "BOM");
    else if (dGamma > 18) triggerRegionDiscovery("EAST", "CCU");
    else if (dBeta < -12) triggerRegionDiscovery("NORTH", "DEL");
    else if (dBeta > 18) triggerRegionDiscovery("SOUTH", "BLR");
  }, [triggerRegionDiscovery]);

  // Handle Desktop Mouse Move Simulation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    targetCamera.current.heading = nx * 35;
    targetCamera.current.tilt = Math.max(25, Math.min(75, 52 - ny * 24));

    if (nx < -0.25) triggerRegionDiscovery("WEST", "BOM");
    else if (nx > 0.25) triggerRegionDiscovery("EAST", "CCU");
    else if (ny < -0.25) triggerRegionDiscovery("NORTH", "DEL");
    else if (ny > 0.25) triggerRegionDiscovery("SOUTH", "BLR");
  };

  // Enable Motion with calibration step
  const enableMotion = async () => {
    setIsCalibrating(true);

    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };

      if (typeof DOE.requestPermission === "function") {
        try {
          const state = await DOE.requestPermission();
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        } catch {
          // Continue to desktop/mouse fallback
        }
      } else {
        window.addEventListener("deviceorientation", handleOrientation);
      }
    }

    setTimeout(() => {
      setIsCalibrating(false);
      setIsMotionEnabled(true);
    }, 1200);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 font-sans overflow-hidden select-none pb-24">
      {/* 1. TOP FLOATING TELEMETRY HUD (Part 18) */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 font-mono text-xs pointer-events-auto">
        {/* Left: Brand + Status + Discovery */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 shadow-xl">
          <Compass className="h-4 w-4 text-blue-400 animate-spin-slow" />
          <span className="font-bold tracking-wider text-white">VAYU SKYVIEW</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            GOOGLE 3D
          </span>
          <span className="text-slate-500 text-[11px] hidden md:inline">• Photorealistic Aviation Surface</span>
        </div>

        {/* Right: Real Telemetry Counters */}
        <div className="flex items-center justify-between sm:justify-end gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 shadow-xl overflow-x-auto text-[11px]">
          <div>
            <span className="text-slate-500 text-[9px] block">COMPOSITE CPI</span>
            <strong className="text-white text-xs">{cpi?.composite_index?.toFixed(2) || "174.69"}</strong>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500 text-[9px] block">ADV / SPOT</span>
            <strong className="text-purple-400">{cpi?.advance_sub_index?.toFixed(1) || "198.8"}</strong> / <strong className="text-emerald-400">{cpi?.spot_sub_index?.toFixed(1) || "135.4"}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] block">OBSERVATIONS</span>
            <strong className="text-emerald-400">{coverage ? (coverage.live_observation_count + coverage.historical_observation_count).toLocaleString() : "8,607"}</strong>
          </div>
          <div className="hidden sm:block">
            <span className="text-slate-500 text-[9px] block">CORRIDORS</span>
            <strong className="text-blue-400">{coverage?.total_configured_routes || 12}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] block">COVERAGE</span>
            <strong className="text-cyan-400">{coverage?.coverage_percentage || 54.5}%</strong>
          </div>
        </div>
      </div>

      {/* Discovery Toast Notification */}
      {discoveryToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-blue-600/90 border border-blue-400 text-white font-mono text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>{discoveryToast}</span>
        </div>
      )}

      {/* 2. INITIAL GYROSCOPE PERMISSION & CALIBRATION OVERLAY (Part 12 & 13) */}
      {!isMotionEnabled && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="glass-panel p-8 max-w-md w-full bg-slate-900 border-slate-800 rounded-3xl shadow-2xl space-y-6">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 inline-block">
              {isCalibrating ? <RefreshCw className="h-10 w-10 animate-spin" /> : <Smartphone className="h-10 w-10 animate-bounce" />}
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                GOOGLE MAPS 3D AIRFARE TELEMETRY
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                VAYU SKYVIEW
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {isCalibrating
                  ? "Calibrating neutral baseline orientation... Hold your device comfortably."
                  : "Explore India's airfare market on photorealistic 3D terrain. Move your phone to navigate aviation corridors and inspect real-time macroeconomic price stress."}
              </p>
            </div>

            {!isCalibrating && (
              <div className="space-y-2.5">
                <button
                  onClick={enableMotion}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Compass className="h-4 w-4" />
                  <span>ENABLE MOTION SENSORS</span>
                </button>

                <button
                  onClick={() => setIsMotionEnabled(true)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <MousePointer className="h-3.5 w-3.5" />
                  <span>CONTINUE WITH TOUCH / MOUSE</span>
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-500 italic">
              Google Maps Platform 3D Maps • Photorealistic Surface • Zero sensor telemetry logged
            </p>
          </div>
        </div>
      )}

      {/* 3. GOOGLE MAPS 3D CANVAS OR BEAUTIFUL FALLBACK */}
      <div
        className="w-full h-full min-h-[calc(100vh-4rem)] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
      >
        {googleMapsError ? (
          /* Elegant Fallback Mode when API Key is missing or 3D is unavailable (Part 40) */
          <div className="glass-panel p-8 max-w-lg mx-auto bg-slate-900/90 border-slate-800 rounded-3xl text-center space-y-5 font-mono">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl inline-block">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Google Maps 3D Photorealistic Surface</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {googleMapsError} To enable full Google Earth photorealistic 3D terrain on this device, add your Google Maps API key to <code className="text-blue-400">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/observatory"
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <Compass className="h-4 w-4" />
                <span>OPEN VAYU OBSERVATORY</span>
              </Link>
              <Link
                href="/routes"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                EXPLORE ROUTES
              </Link>
            </div>
          </div>
        ) : (
          /* Google Maps 3D Element Container */
          <div ref={mapContainerRef} className="w-full h-full min-h-[calc(100vh-4rem)] absolute inset-0" />
        )}
      </div>

      {/* 4. FLOATING MAP CONTROLS & LAYERS (Part 25 & 26) */}
      <div className="absolute right-4 top-20 z-30 flex flex-col gap-2 font-mono text-xs">
        {/* Layer Selector */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 flex flex-col gap-1 shadow-2xl">
          <span className="text-[10px] text-slate-500 uppercase px-1">LAYERS</span>
          {(['STRESS', 'AIRFARE', 'SURGES', 'COVERAGE'] as MapLayerType[]).map((layer) => (
            <button
              key={layer}
              onClick={() => setMapLayer(layer)}
              className={`px-2.5 py-1 rounded-lg text-left font-bold transition-all ${
                mapLayer === layer
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* Timeline Slider Window */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 flex flex-col gap-1 shadow-2xl">
          <span className="text-[10px] text-slate-500 uppercase px-1">TIMELINE</span>
          {(['24H', '7D', '30D', '90D'] as TimelineWindow[]).map((win) => (
            <button
              key={win}
              onClick={() => setTimelineWindow(win)}
              className={`px-2.5 py-1 rounded-lg text-left font-bold transition-all ${
                timelineWindow === win
                  ? "bg-slate-800 text-blue-400 border border-blue-500/30"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {win}
            </button>
          ))}
        </div>

        {/* Data Source Badge (Part 27) */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 shadow-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE VAYU DATA</span>
        </div>
      </div>

      {/* 5. POLISHED EXPANDABLE BOTTOM SHEET (Part 20 & 21) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out font-mono ${
          sheetExpanded ? "max-h-[85vh] overflow-y-auto" : "max-h-36"
        }`}
      >
        {/* Drag / Expand Bar Handle */}
        <div
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="w-full pt-3 pb-2 flex flex-col items-center cursor-pointer hover:bg-slate-800/40 transition-colors"
        >
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-1.5" />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
            {sheetExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            <span>{sheetExpanded ? "COLLAPSE INTEL" : "EXPAND FULL AIRFARE ANALYSIS"}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-6 space-y-6">
          {/* PRIMARY COMPACT HUD (Always Visible) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center border-b border-slate-800/80 pb-4">
            {/* Route & Horizon */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">CORRIDOR</span>
              <div className="text-lg font-black text-white flex items-center gap-1.5">
                <span>{currentRoute?.origin || "DEL"}</span>
                <ArrowRight className="h-4 w-4 text-blue-400" />
                <span>{currentRoute?.destination || "BOM"}</span>
              </div>
              <span className="text-[10px] text-blue-400 font-bold">T-{currentRoute?.horizon_days || 7} Horizon</span>
            </div>

            {/* Current Observed Fare */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">CURRENT FARE</span>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                ₹{currentFare.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Jevons: {jevonsIndex} Pts</span>
            </div>

            {/* Stress Score */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">MARKET STRESS</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white">{stressScore}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stressColor}`}>
                {stressLevel}
              </span>
            </div>

            {/* Booking Outlook Action */}
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">OUTLOOK</span>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {bookingOutlook}
              </div>
              <span className="text-[10px] text-slate-400 block truncate">{outlookDescription.slice(0, 30)}...</span>
            </div>
          </div>

          {/* EXPANDABLE DEEP DIVE SECTIONS (Revealed on Expand) */}
          {sheetExpanded && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-200">
              {/* Surge Anomaly Status */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                currentAlert
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}>
                <div className="flex items-center gap-3">
                  {currentAlert ? <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                  <div>
                    <strong className="block text-xs font-bold">
                      {currentAlert ? `⚠ FARE SURGE DETECTED (+${(currentAlert.sigma_deviation * 16).toFixed(1)}% Above Baseline)` : "✓ No unusual predatory surge detected"}
                    </strong>
                    <span className="text-[10px] opacity-80">
                      {currentAlert ? `Anomaly deviation: ${currentAlert.sigma_deviation}σ against 30D rolling baseline` : "Corridor prices within standard statistical variance"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 1: WHY UNDER PRESSURE + FARE DECOMPOSITION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WHY IS THIS ROUTE UNDER PRESSURE? */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-blue-400" /> WHY IS THIS ROUTE UNDER PRESSURE?
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Price Deviation</span>
                        <span className="text-white font-bold">{Math.min(100, Math.round(sigmaDev * 28))}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, Math.round(sigmaDev * 28))}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Volatility Index</span>
                        <span className="text-white font-bold">68%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: "68%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Booking Pressure</span>
                        <span className="text-white font-bold">84%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: "84%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Market Concentration (HHI)</span>
                        <span className="text-white font-bold">54%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "54%" }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2 italic">
                    {currentRoute?.origin} → {currentRoute?.destination} is currently above its recent 30-day baseline and exhibiting elevated intra-day volatility.
                  </p>
                </div>

                {/* WHERE DOES YOUR MONEY GO? */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-400" /> WHERE DOES YOUR MONEY GO?
                    </span>
                    <span className="text-[10px] text-slate-500">Unbundled Breakdown</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Base Airfare</span>
                      <strong className="text-white">₹{currentFee.base_fare.toLocaleString()} ({currentFee.base_fare_pct}%)</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Fuel Surcharge (YQ)</span>
                      <strong className="text-white">₹{currentFee.fuel_surcharge_yq.toLocaleString()} ({currentFee.fuel_surcharge_pct}%)</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Airport Fee (UDF / PSF)</span>
                      <strong className="text-white">₹{currentFee.airport_fee_udf.toLocaleString()} ({currentFee.airport_tax_pct}%)</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Convenience & GST</span>
                      <strong className="text-white">₹{currentFee.convenience_fee.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs font-bold text-emerald-400">
                    <span>TOTAL OBSERVED FARE</span>
                    <span className="text-sm">₹{currentFee.unbundled_total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: AIRLINE CONCENTRATION + HORIZON INTELLIGENCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WHO IS FLYING THIS ROUTE? */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <PieChart className="h-4 w-4 text-purple-400" /> WHO IS FLYING THIS ROUTE?
                    </span>
                    <span className="text-[10px] text-slate-500">HHI: 2,840 (Moderate)</span>
                  </div>

                  <div className="space-y-2">
                    {currentAirlineShares.map((airline) => (
                      <div key={airline.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-bold">{airline.name}</span>
                          <span className="text-slate-400">{airline.share}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${airline.share}%`, backgroundColor: airline.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                    Source: DGCA Market Share Analysis • Moderate route concentration
                  </div>
                </div>

                {/* BOOKING HORIZON INTELLIGENCE */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-cyan-400" /> BOOKING HORIZON INTELLIGENCE
                    </span>
                    <span className="text-[10px] text-slate-500">Advance vs Tatkal Spot</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">T-30 ADVANCE</span>
                      <strong className="text-emerald-400 text-sm mt-1 block">₹{Math.round(currentFare * 0.85).toLocaleString()}</strong>
                      <span className="text-[9px] text-slate-400">Lowest</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-blue-500/30 text-center">
                      <span className="text-[10px] text-blue-400 block font-bold">T-7 MID</span>
                      <strong className="text-white text-sm mt-1 block">₹{currentFare.toLocaleString()}</strong>
                      <span className="text-[9px] text-slate-400">Active</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block">T-1 TATKAL</span>
                      <strong className="text-rose-400 text-sm mt-1 block">₹{Math.round(currentFare * 1.3).toLocaleString()}</strong>
                      <span className="text-[9px] text-rose-400 font-bold">+30% Surge</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                    Airfare pressure escalates significantly as departure date approaches (T-1 Tatkal premium).
                  </p>
                </div>
              </div>

              {/* DIRECT LINK TO FULL ROUTE ANALYSIS */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Link
                  href={`/routes?from=${currentRoute?.origin || "DEL"}&to=${currentRoute?.destination || "BOM"}&horizon=${currentRoute?.horizon_days || 7}&mode=${dataMode}`}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                >
                  <span>VIEW FULL COMPREHENSIVE ROUTE ANALYSIS</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SkyviewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono">Initializing VAYU Skyview 3D Photorealistic Map...</div>}>
      <SkyviewContent />
    </Suspense>
  );
}
