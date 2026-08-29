"""
services/engine/cross_validation.py
Independent secondary fare feed cross-validation engine.

Compares real-time fare observations gathered from Google Flights against
independent secondary flight fare API feeds (RapidAPI Secondary and Skyscanner via RapidAPI).
Provides transparent price-agreement metrics, source-specific breakdowns, and discrepancy diagnostics.
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
    source_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Computes price agreement statistics between primary Google Flights feed
    and secondary flight search APIs (RapidAPI Secondary and Skyscanner).
    """
    session = SessionLocal()
    try:
        # Fetch primary observations (Google Flights)
        q_primary = session.query(FareObservation).filter(
            FareObservation.is_live == True,
            FareObservation.source.like("%Google Flights%"),
        )
        # Fetch secondary & cross-validation observations (RapidAPI / Skyscanner / Amadeus)
        q_secondary = session.query(FareObservation).filter(
            FareObservation.is_live == True,
            (
                FareObservation.source.like("%RapidAPI%")
                | FareObservation.source.like("%Skyscanner%")
                | FareObservation.portal.like("%Secondary%")
                | FareObservation.portal.like("%Skyscanner%")
                | FareObservation.portal.like("%Amadeus%")
            ),
        )

        if origin:
            q_primary = q_primary.filter(FareObservation.origin == origin.upper())
            q_secondary = q_secondary.filter(FareObservation.origin == origin.upper())
        if destination:
            q_primary = q_primary.filter(FareObservation.destination == destination.upper())
            q_secondary = q_secondary.filter(FareObservation.destination == destination.upper())
        if source_filter:
            q_secondary = q_secondary.filter(
                (FareObservation.source.ilike(f"%{source_filter}%"))
                | (FareObservation.portal.ilike(f"%{source_filter}%"))
            )

        primary_obs = q_primary.all()
        secondary_obs = q_secondary.all()

        if not secondary_obs:
            return {
                "status": "AWAITING_SECONDARY_DATA",
                "message": (
                    "Cross-validation feeds (RapidAPI Secondary & Skyscanner) are configured but have zero recorded observations in this window. "
                    "Configure SECONDARY_FARE_API_KEY or SKYSCANNER_API_KEY to enable automated cross-validation sweeps."
                ),
                "total_comparisons": 0,
                "overall_agreement_pct": 0.0,
                "validation_status": "PENDING_KEY",
                "source_breakdown": {},
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

        # Per-source metric tracking
        source_diffs: Dict[str, List[float]] = {}
        source_within_5: Dict[str, int] = {}
        source_within_10: Dict[str, int] = {}

        # Compare matching keys
        for s in secondary_obs:
            key = (s.origin, s.destination, s.horizon_days)
            p_fares = primary_by_key.get(key)
            if not p_fares:
                continue

            # Identify source label
            src_label = "Skyscanner (RapidAPI)" if "Skyscanner" in (s.portal or "") or "Skyscanner" in (s.source or "") else "RapidAPI Secondary"

            primary_median = statistics.median(p_fares)
            sec_fare = s.total_fare

            abs_diff = abs(primary_median - sec_fare)
            pct_diff = round((abs_diff / primary_median) * 100.0, 2) if primary_median > 0 else 0.0
            diffs.append(pct_diff)

            source_diffs.setdefault(src_label, []).append(pct_diff)
            if pct_diff <= 5.0:
                within_5_cnt += 1
                source_within_5[src_label] = source_within_5.get(src_label, 0) + 1
            if pct_diff <= 10.0:
                within_10_cnt += 1
                source_within_10[src_label] = source_within_10.get(src_label, 0) + 1

            corridor_breakdown.append({
                "corridor": f"{s.origin}-{s.destination}",
                "source": src_label,
                "portal": s.portal,
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
                "message": "Primary and secondary/Skyscanner observations do not yet share overlapping corridors/horizons.",
                "total_comparisons": 0,
                "overall_agreement_pct": 0.0,
                "validation_status": "PENDING_OVERLAP",
                "source_breakdown": {},
                "corridor_breakdown": [],
            }

        n = len(diffs)
        mean_diff = round(statistics.mean(diffs), 2)
        within_10_share = round((within_10_cnt / n) * 100.0, 1)

        val_status = "HIGH_CONFIRMATION" if within_10_share >= 75.0 else "MODERATE_CONFIRMATION" if within_10_share >= 50.0 else "DIVERGENT"

        # Construct source breakdown
        source_summary: Dict[str, Any] = {}
        for src, s_diff_list in source_diffs.items():
            s_n = len(s_diff_list)
            s_mean = round(statistics.mean(s_diff_list), 2) if s_n > 0 else 0.0
            s_w5 = source_within_5.get(src, 0)
            s_w10 = source_within_10.get(src, 0)
            source_summary[src] = {
                "comparisons": s_n,
                "mean_percentage_difference": s_mean,
                "within_5pct_agreement_rate": round((s_w5 / s_n) * 100.0, 1) if s_n > 0 else 0.0,
                "within_10pct_agreement_rate": round((s_w10 / s_n) * 100.0, 1) if s_n > 0 else 0.0,
            }

        return {
            "status": "VALIDATED",
            "validation_status": val_status,
            "total_comparisons": n,
            "mean_percentage_difference": mean_diff,
            "within_5pct_agreement_rate": round((within_5_cnt / n) * 100.0, 1),
            "within_10pct_agreement_rate": within_10_share,
            "overall_agreement_status": val_status,
            "source_breakdown": source_summary,
            "summary_note": (
                f"Independent cross-validation across {n} observations shows a mean variance of {mean_diff}% "
                f"between Google Flights and secondary feeds (RapidAPI / Skyscanner)."
            ),
            "corridor_breakdown": corridor_breakdown[:30],
        }
    finally:
        session.close()
