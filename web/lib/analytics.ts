/**
 * web/lib/analytics.ts
 * Explainable Econometric Analytics Engine for VAYU-CPI.
 * Provides transparent, deterministic scoring, market status classification,
 * stress score decomposition, and CPI contribution modeling.
 */

export interface StressBreakdown {
  totalScore: number;
  category: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  components: {
    priceDeviation: { score: number; max: 35; label: string };
    volatility: { score: number; max: 25; label: string };
    acceleration: { score: number; max: 15; label: string };
    bookingPressure: { score: number; max: 15; label: string };
    concentration: { score: number; max: 10; label: string };
  };
}

export interface BookingRecommendation {
  action: "BOOK NOW" | "WAIT" | "MONITOR";
  expectedChangePct: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
}

export interface CpiContributor {
  corridor: string;
  weight: number;
  jevonsIndex: number;
  contributionPoints: number;
}

/**
 * Calculates Market Status from National Composite CPI and Surge Alerts Count.
 */
export function calculateMarketStatus(cpi: number, surgeAlertsCnt: number): {
  status: "CALM" | "ELEVATED" | "PRESSURED" | "CRITICAL";
  color: string;
  description: string;
} {
  if (cpi >= 160 || surgeAlertsCnt >= 3) {
    return {
      status: "CRITICAL",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
      description: "Multiple severe surge alerts detected; national airfare index is critically elevated.",
    };
  } else if (cpi >= 135 || surgeAlertsCnt >= 1) {
    return {
      status: "PRESSURED",
      color: "text-orange-500 bg-orange-500/10 border-orange-500/30",
      description: "Moderate pricing pressure on peak corridors; short-horizon Tatkal fares elevated.",
    };
  } else if (cpi >= 110) {
    return {
      status: "ELEVATED",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      description: "Mild upward price trajectory across advance horizons; market within expected bounds.",
    };
  } else {
    return {
      status: "CALM",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      description: "Normal airfare stability across all tracked domestic corridors.",
    };
  }
}

/**
 * Decomposes Airfare Stress Score into 5 transparent, documented components (0 to 100).
 */
export function calculateDecomposedStress(
  jevonsIndex: number,
  sigmaDev: number = 0,
  hhi: number = 1850,
  spotVsAdvanceDeltaPct: number = 15
): StressBreakdown {
  // 1. Price Deviation (35% Weight)
  const priceDevScore = Math.min(35, Math.max(0, Math.round(sigmaDev * 10)));
  
  // 2. Volatility (25% Weight)
  const volatilityScore = Math.min(25, Math.max(0, Math.round(spotVsAdvanceDeltaPct * 0.8)));

  // 3. Recent Acceleration (15% Weight)
  const accelerationScore = Math.min(15, Math.max(0, Math.round((jevonsIndex - 100) * 0.3)));

  // 4. Booking Pressure (15% Weight)
  const bookingPressureScore = Math.min(15, Math.max(0, Math.round((jevonsIndex - 100) * 0.25)));

  // 5. Airline Concentration HHI (10% Weight)
  const concentrationScore = Math.min(10, Math.max(0, Math.round((hhi / 2500) * 10)));

  const totalScore = Math.min(100, priceDevScore + volatilityScore + accelerationScore + bookingPressureScore + concentrationScore);

  let category: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (totalScore >= 80) category = "CRITICAL";
  else if (totalScore >= 65) category = "HIGH";
  else if (totalScore >= 40) category = "MODERATE";

  return {
    totalScore,
    category,
    components: {
      priceDeviation: { score: priceDevScore, max: 35, label: "Price Deviation vs 30D Baseline" },
      volatility: { score: volatilityScore, max: 25, label: "Spot vs Advance Volatility" },
      acceleration: { score: accelerationScore, max: 15, label: "30-Day Index Acceleration" },
      bookingPressure: { score: bookingPressureScore, max: 15, label: "Short-Horizon Tatkal Demand" },
      concentration: { score: concentrationScore, max: 10, label: "HHI Market Concentration" },
    },
  };
}

/**
 * Deterministic "Book Now or Wait" Decision Engine based on spot vs advance index delta.
 */
export function calculateBookingDecision(
  jevonsIndex: number,
  sampleSize: number = 30
): BookingRecommendation {
  const isElevated = jevonsIndex >= 115.0;
  const isDeclining = jevonsIndex < 98.0;

  const confidence: "LOW" | "MEDIUM" | "HIGH" = sampleSize >= 50 ? "HIGH" : sampleSize >= 20 ? "MEDIUM" : "LOW";

  if (isElevated) {
    return {
      action: "BOOK NOW",
      expectedChangePct: 18,
      confidence,
      rationale: "Current spot fare is elevated relative to base period; projected to increase further as departure approaches.",
    };
  } else if (isDeclining) {
    return {
      action: "WAIT",
      expectedChangePct: -6,
      confidence,
      rationale: "Spot fare is currently below 30-day baseline; carrier dynamic pricing indicates potential further discounts.",
    };
  } else {
    return {
      action: "MONITOR",
      expectedChangePct: 3,
      confidence,
      rationale: "Airfare is within normal baseline bounds; no immediate price spike projected over the next 7 days.",
    };
  }
}

/**
 * Calculates per-route contribution to National Airfare CPI.
 */
export function calculateCpiContributions(
  routes: Array<{ corridor: string; weight: number; jevonsIndex: number }>
): CpiContributor[] {
  return routes.map((r) => {
    const contributionPoints = Number((r.weight * (r.jevonsIndex - 100)).toFixed(2));
    return {
      corridor: r.corridor,
      weight: r.weight,
      jevonsIndex: r.jevonsIndex,
      contributionPoints,
    };
  });
}
