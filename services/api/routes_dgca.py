"""
services/api/routes_dgca.py
DGCA-facing endpoints: statistical surge/anti-gouging detection against
each route's own 30-day rolling baseline, unbundled fee decomposition,
and a route concentration (HHI) indicator.
"""

from __future__ import annotations

import statistics
from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from core.dgca_weights import TRACKED_HORIZONS, TRACKED_ROUTES, get_route_weights
from core.schemas import SurgeAlert
from services.engine.normalizer import normalize
from services.persistence.db import fetch_observations

router = APIRouter(prefix="/api/v1/dgca", tags=["DGCA Regulatory Engine"])

_SEVERITY_BANDS = [
    (5.0, "CRITICAL_SURGE"),
    (4.0, "HIGH_SURGE"),
    (3.0, "ELEVATED_SURGE"),
]


def _severity_for_sigma(sigma: float) -> str | None:
    for threshold, label in _SEVERITY_BANDS:
        if sigma >= threshold:
            return label
    return None


def _detect_surge(
    origin: str, destination: str, horizon_days: int, threshold_sigma: float
) -> SurgeAlert | None:
    """Compares today's mean fare against a rolling 30-day baseline
    (days -31 to -1, excluding today so the baseline isn't
    self-referential) and flags a statistical anomaly if the deviation
    exceeds `threshold_sigma` standard deviations.

    Returns None if there isn't enough baseline history yet (need at
    least a handful of prior days) or no current-day sample -- a
    surge can't be meaningfully declared without both.
    """
    now = datetime.now()
    today_obs = fetch_observations(
        origin, destination, horizon_days, since=now - timedelta(days=1)
    )
    baseline_obs = fetch_observations(
        origin,
        destination,
        horizon_days,
        since=now - timedelta(days=31),
        until=now - timedelta(days=1),
    )

    today_prices = normalize(today_obs)
    baseline_prices = normalize(baseline_obs)

    if not today_prices or len(baseline_prices) < 5:
        return None

    current_avg = statistics.mean(today_prices)
    baseline_avg = statistics.mean(baseline_prices)
    baseline_std = statistics.pstdev(baseline_prices)

    if baseline_std == 0:
        return None

    sigma_deviation = round((current_avg - baseline_avg) / baseline_std, 2)
    severity = _severity_for_sigma(sigma_deviation)
    if severity is None or sigma_deviation < threshold_sigma:
        return None

    return SurgeAlert(
        route=f"{origin}-{destination}",
        origin=origin,
        destination=destination,
        current_avg_fare=round(current_avg, 2),
        baseline_30d_avg=round(baseline_avg, 2),
        baseline_30d_std=round(baseline_std, 2),
        sigma_deviation=sigma_deviation,
        severity=severity,
        reason=(
            f"Current T-{horizon_days} fare on {origin}-{destination} is "
            f"{sigma_deviation}sigma above its 30-day rolling baseline."
        ),
        flagged_at=now,
    )


@router.get("/surge-alerts")
async def get_surge_alerts(threshold_sigma: float = Query(3.0, ge=0.5, le=10.0)):
    """Evaluates every tracked route/horizon against its own 30-day
    rolling baseline and returns active price-gouging anomalies."""
    alerts = []
    for route in TRACKED_ROUTES:
        origin, destination = route.split("-")
        for horizon in TRACKED_HORIZONS:
            alert = _detect_surge(origin, destination, horizon, threshold_sigma)
            if alert is not None:
                alerts.append(alert.model_dump(mode="json"))
    return {"threshold_sigma": threshold_sigma, "active_alerts": len(alerts), "alerts": alerts}


@router.get("/fee-decomposition")
async def get_fee_decomposition(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    horizon_days: int = Query(...),
):
    """Returns average unbundled fee components (base / YQ / UDF /
    convenience) for the last 24h of observations on a route -- backs
    the stacked bar chart on the DGCA dashboard."""
    obs = fetch_observations(
        origin.upper(),
        destination.upper(),
        horizon_days,
        since=datetime.now() - timedelta(days=1),
    )
    if not obs:
        return {"error": "no_data", "route": f"{origin.upper()}-{destination.upper()}"}

    n = len(obs)
    return {
        "route": f"{origin.upper()}-{destination.upper()}",
        "horizon_days": horizon_days,
        "sample_count": n,
        "avg_base_fare": round(sum(o.base_fare for o in obs) / n, 2),
        "avg_fuel_surcharge_yq": round(sum(o.fuel_surcharge_yq for o in obs) / n, 2),
        "avg_airport_fee_udf": round(sum(o.airport_fee_udf for o in obs) / n, 2),
        "avg_convenience_fee": round(sum(o.convenience_fee for o in obs) / n, 2),
        "avg_total_fare": round(sum(o.total_fare for o in obs) / n, 2),
    }


@router.get("/route-concentration")
async def get_route_concentration():
    """Herfindahl-Hirschman Index of DGCA route traffic weight
    concentration across the tracked corridor set. HHI here measures
    concentration of *passenger volume across routes* (a proxy for how
    much national index movement any single corridor can drive) --
    not carrier market share within a route, since VAYU-CPI doesn't
    ingest per-carrier passenger counts.
    """
    weights = get_route_weights()
    hhi = sum((w.weight * 100) ** 2 for w in weights)  # weights as percentages, squared
    if hhi >= 2500:
        concentration_label = "HIGH_CONCENTRATION"
    elif hhi >= 1500:
        concentration_label = "MODERATE_CONCENTRATION"
    else:
        concentration_label = "LOW_CONCENTRATION"

    return {
        "hhi": round(hhi, 1),
        "concentration_label": concentration_label,
        "routes": [w.model_dump(mode="json") for w in weights],
        "note": (
            "HHI computed over DGCA-derived route traffic weight shares "
            "among the 6 tracked corridors, not carrier-level market share."
        ),
    }
