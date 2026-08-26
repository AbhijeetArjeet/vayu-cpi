"""
services/api/routes_dgca.py
DGCA-facing endpoints.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from core.dgca_weights import HORIZON_ALPHA, ALL_CORRIDORS, get_route_weight, ROUTE_WEIGHTS
from services.engine.anomaly_detector import detect_surges
from services.persistence.db import fetch_observations

router = APIRouter(prefix="/api/v1/dgca", tags=["DGCA Regulatory Engine"])

@router.get("/surge-alerts")
async def get_surge_alerts(threshold_sigma: float = Query(3.0, ge=0.5, le=10.0)):
    # fetch all observations in the last 31 days
    now = datetime.now()
    since = now - timedelta(days=31)
    
    all_obs = []
    for origin, destination in ALL_CORRIDORS:
        for horizon in HORIZON_ALPHA.keys():
            obs = fetch_observations(origin, destination, horizon, since=since)
            all_obs.extend(obs)
            
    alerts = detect_surges(all_obs, rolling_window_days=30)
    
    # filter by threshold
    filtered = [a for a in alerts if a.sigma_deviation >= threshold_sigma]
    
    return {"threshold_sigma": threshold_sigma, "active_alerts": len(filtered), "alerts": [a.model_dump(mode="json") for a in filtered]}

@router.get("/decomposition")
async def get_fee_decomposition(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    horizon_days: int = Query(...),
):
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
    weights = [
        {"route": route, "weight": weight}
        for route, weight in ROUTE_WEIGHTS.items()
    ]
    hhi = sum((w["weight"] * 100) ** 2 for w in weights)
    
    if hhi >= 2500:
        concentration_label = "HIGH_CONCENTRATION"
    elif hhi >= 1500:
        concentration_label = "MODERATE_CONCENTRATION"
    else:
        concentration_label = "LOW_CONCENTRATION"

    return {
        "hhi": round(hhi, 1),
        "concentration_label": concentration_label,
        "routes": weights,
        "note": (
            "HHI computed over DGCA-derived route traffic weight shares "
            "among the 6 tracked corridors, not carrier-level market share."
        ),
    }
