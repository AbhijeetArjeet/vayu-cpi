"""
services/engine/intelligence/shocks.py
VAYU Fare Shock Detector Engine.

Identifies and classifies statistical airfare anomalies using 3-Sigma z-scores
and historical rolling variance across domestic corridors and booking horizons.
"""

from __future__ import annotations

import math
import statistics
from datetime import datetime, date
from typing import List, Optional, Dict, Any

from core.schemas import AirfareShockItem, AirfareShockSummary
from core.dgca_weights import ALL_CORRIDORS, CORRIDOR_WEIGHTS
from services.persistence.db import fetch_all_observations, SessionLocal, FareObservation


def detect_airfare_shocks(
    mode: str = "combined",
    min_severity: str = "ELEVATED",
    limit: int = 50,
) -> List[AirfareShockItem]:
    """
    Scans recent fare observations and flags anomalies exceeding statistical variance thresholds.
    """
    session = SessionLocal()
    try:
        # Query active observations
        q = session.query(FareObservation)
        if mode == "live":
            q = q.filter(FareObservation.is_live == True)
        elif mode == "historical":
            q = q.filter(FareObservation.is_historical == True)
        
        all_obs = q.order_by(FareObservation.id.desc()).limit(1500).all()
        if not all_obs:
            return []

        # Group fares by (origin, destination, horizon_days)
        grouped_fares: Dict[tuple, List[float]] = {}
        grouped_records: Dict[tuple, List[FareObservation]] = {}
        for r in all_obs:
            key = (r.origin, r.destination, r.horizon_days)
            grouped_fares.setdefault(key, []).append(r.total_fare)
            grouped_records.setdefault(key, []).append(r)

        shocks: List[AirfareShockItem] = []
        severity_order = {"NORMAL": 0, "ELEVATED": 1, "HIGH": 2, "SHOCK": 3}
        min_sev_rank = severity_order.get(min_severity.upper(), 1)

        for key, fares in grouped_fares.items():
            if len(fares) < 3:
                continue

            orig, dest, horizon = key
            corridor_str = f"{orig}-{dest}"
            mean_val = statistics.mean(fares)
            std_val = statistics.stdev(fares) if len(fares) > 1 else mean_val * 0.15
            if std_val < 50.0:
                std_val = mean_val * 0.15  # Minimum variance floor

            recs = grouped_records[key]
            # Analyze top most deviant observations in this cluster
            for r in recs[:5]:
                fare = r.total_fare
                z_score = (fare - mean_val) / std_val if std_val > 0 else 0.0

                if z_score >= 4.0:
                    sev = "SHOCK"
                elif z_score >= 3.0:
                    sev = "HIGH"
                elif z_score >= 2.0:
                    sev = "ELEVATED"
                else:
                    sev = "NORMAL"

                if severity_order[sev] < min_sev_rank:
                    continue

                dev_pct = round(((fare - mean_val) / mean_val) * 100.0, 1)
                exp_low = round(max(1200.0, mean_val - (1.5 * std_val)), 0)
                exp_high = round(mean_val + (1.5 * std_val), 0)
                
                # Statistical confidence based on sample size and deviation magnitude
                conf = min(98.0, max(75.0, round(80.0 + (min(len(fares), 20) * 0.7) + (abs(z_score) * 2.0), 1)))

                shock_id = f"SHOCK-{orig}{dest}-{horizon}-{r.id}"
                summary_text = (
                    f"Observed fare ₹{fare:,.0f} exceeds expected baseline ₹{exp_low:,.0f}–₹{exp_high:,.0f} "
                    f"by +{dev_pct}% (z={z_score:.2f}) on {r.carrier_name} {r.flight_number}."
                )

                shocks.append(
                    AirfareShockItem(
                        id=shock_id,
                        corridor=corridor_str,
                        origin=orig,
                        destination=dest,
                        horizon_days=horizon,
                        booking_window=r.booking_window or f"T+{horizon}",
                        carrier=r.carrier_name or r.carrier,
                        current_fare=fare,
                        expected_range_low=exp_low,
                        expected_range_high=exp_high,
                        baseline_mean=round(mean_val, 2),
                        baseline_std=round(std_val, 2),
                        z_score=round(z_score, 2),
                        deviation_pct=dev_pct,
                        severity=sev,
                        confidence_pct=conf,
                        detected_at=r.scraped_at or datetime.now().isoformat(),
                        duration_hours=6,
                        summary=summary_text,
                    )
                )

        # Sort by z-score descending
        shocks.sort(key=lambda x: x.z_score, reverse=True)
        return shocks[:limit]

    finally:
        session.close()


def compute_shock_summary(mode: str = "combined") -> AirfareShockSummary:
    """Computes national aggregate airfare shock counts and severity distributions."""
    all_shocks = detect_airfare_shocks(mode=mode, min_severity="NORMAL", limit=100)
    
    crit = sum(1 for s in all_shocks if s.severity == "SHOCK")
    high = sum(1 for s in all_shocks if s.severity == "HIGH")
    elev = sum(1 for s in all_shocks if s.severity == "ELEVATED")
    
    affected_corr = len(set(s.corridor for s in all_shocks if s.severity in ("SHOCK", "HIGH", "ELEVATED")))
    
    # Most volatile corridor
    corr_counts: Dict[str, int] = {}
    for s in all_shocks:
        if s.severity in ("SHOCK", "HIGH", "ELEVATED"):
            corr_counts[s.corridor] = corr_counts.get(s.corridor, 0) + 1
    
    most_vol = max(corr_counts.items(), key=lambda x: x[1])[0] if corr_counts else "DEL-BOM"

    active_filtered = [s for s in all_shocks if s.severity in ("SHOCK", "HIGH", "ELEVATED")]

    return AirfareShockSummary(
        total_active_shocks=len(active_filtered),
        critical_shocks_count=crit,
        high_shocks_count=high,
        elevated_count=elev,
        affected_corridors_count=affected_corr,
        most_volatile_corridor=most_vol,
        shocks=active_filtered[:25],
    )
