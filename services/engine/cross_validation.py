"""
services/engine/cross_validation.py
Independent secondary fare feed cross-validation engine.

Compares real-time fare observations gathered from Google Flights against
the secondary independent flight fare API feed (RapidAPI / GDS).
Provides transparent price-agreement metrics and discrepancy diagnostics.
"""

from __future__ import annotations

import statistics
from typing import Dict, List, Any, Optional
from datetime import datetime

from services.persistence.db import SessionLocal, FareObservation
from core.dgca_weights import ALL_CORRIDORS


def compute_cross_validation_report(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Computes price agreement statistics between primary Google Flights feed
    and the secondary flight search API.
    """
    session = SessionLocal()
    try:
        # Fetch primary observations (Google Flights)
        q_primary = session.query(FareObservation).filter(
            FareObservation.is_live == True,
            FareObservation.source.like("%Google Flights%"),
        )
        # Fetch secondary observations (RapidAPI / Secondary)
        q_secondary = session.query(FareObservation).filter(
            FareObservation.is_live == True,
            (
                FareObservation.source.like("%RapidAPI%")
                | FareObservation.portal.like("%Secondary%")
                | FareObservation.portal.like("%Amadeus%")
            ),
        )

        if origin:
            q_primary = q_primary.filter(FareObservation.origin == origin.upper())
            q_secondary = q_secondary.filter(FareObservation.origin == origin.upper())
        if destination:
            q_primary = q_primary.filter(FareObservation.destination == destination.upper())
            q_secondary = q_secondary.filter(FareObservation.destination == destination.upper())

        primary_obs = q_primary.all()
        secondary_obs = q_secondary.all()

        if not secondary_obs:
            return {
                "status": "AWAITING_SECONDARY_DATA",
                "message": (
                    "Secondary cross-validation feed is active but has zero recorded observations. "
                    "Set SECONDARY_FARE_API_KEY environment variable to enable scheduled cross-validation sweeps."
                ),
                "total_comparisons": 0,
                "overall_agreement_pct": 0.0,
                "validation_status": "PENDING_KEY",
                "corridor_breakdown": [],
            }

        # Index primary observations by (origin, destination, horizon_days)
        primary_by_key: Dict[tuple, List[float]] = {}
        for p in primary_obs:
            key = (p.origin, p.destination, p.horizon_days)
            primary_by_key.setdefault(key, []).append(p.total_fare)

        corridor_breakdown = []
        diffs = []
        within_5_cnt = 0
        within_10_cnt = 0

        # Compare matching keys
        for s in secondary_obs:
            key = (s.origin, s.destination, s.horizon_days)
            p_fares = primary_by_key.get(key)
            if not p_fares:
                continue

            primary_median = statistics.median(p_fares)
            sec_fare = s.total_fare

            abs_diff = abs(primary_median - sec_fare)
            pct_diff = round((abs_diff / primary_median) * 100.0, 2) if primary_median > 0 else 0.0
            diffs.append(pct_diff)

            if pct_diff <= 5.0:
                within_5_cnt += 1
            if pct_diff <= 10.0:
                within_10_cnt += 1

            corridor_breakdown.append({
                "corridor": f"{s.origin}-{s.destination}",
                "horizon_days": s.horizon_days,
                "booking_window": s.booking_window,
                "primary_median_fare": round(primary_median, 2),
                "secondary_observed_fare": round(sec_fare, 2),
                "absolute_diff_inr": round(abs_diff, 2),
                "difference_pct": pct_diff,
                "agreement_level": "EXACT" if pct_diff <= 2.0 else "CLOSE" if pct_diff <= 7.0 else "DIVERGENT",
            })

        if not diffs:
            return {
                "status": "NO_OVERLAPPING_WINDOWS",
                "message": "Primary and secondary observations do not yet share overlapping corridors/horizons.",
                "total_comparisons": 0,
                "overall_agreement_pct": 0.0,
                "validation_status": "PENDING_OVERLAP",
                "corridor_breakdown": [],
            }

        n = len(diffs)
        mean_diff = round(statistics.mean(diffs), 2)
        within_10_share = round((within_10_cnt / n) * 100.0, 1)

        val_status = "HIGH_CONFIRMATION" if within_10_share >= 75.0 else "MODERATE_CONFIRMATION" if within_10_share >= 50.0 else "DIVERGENT"

        return {
            "status": "VALIDATED",
            "total_comparisons": n,
            "mean_percentage_difference": mean_diff,
            "within_5pct_agreement_rate": round((within_5_cnt / n) * 100.0, 1),
            "within_10pct_agreement_rate": within_10_share,
            "overall_agreement_status": val_status,
            "summary_note": (
                f"Independent cross-validation across {n} observations shows a mean variance of {mean_diff}% "
                f"between Google Flights and the secondary fare API."
            ),
            "corridor_breakdown": corridor_breakdown[:20],
        }
    finally:
        session.close()
