"""
services/api/routes_dgca.py
DGCA-facing endpoints.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Query

from core.dgca_weights import HORIZON_ALPHA, ALL_CORRIDORS, get_route_weight, ROUTE_WEIGHTS
from services.engine.anomaly_detector import detect_surges
from services.persistence.db import fetch_observations
from services.ingestion.unbundler import unbundle_fare

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
    
    return [a.model_dump(mode="json") for a in filtered]


@router.get("/decomposition")
async def get_fee_decomposition(
    origin: Optional[str] = Query(None, min_length=3, max_length=3),
    destination: Optional[str] = Query(None, min_length=3, max_length=3),
    horizon_days: Optional[int] = Query(None),
):
    if origin and destination:
        corridors_to_check = [(origin.upper(), destination.upper())]
    else:
        corridors_to_check = ALL_CORRIDORS

    h_days = horizon_days if horizon_days is not None else 7
    results = []

    for orig, dest in corridors_to_check:
        obs = fetch_observations(
            orig,
            dest,
            h_days,
            since=datetime.now() - timedelta(days=1),
        )
        if obs:
            n = len(obs)
            results.append({
                "route": f"{orig}-{dest}",
                "base_fare": round(sum(o.base_fare for o in obs) / n, 2),
                "fuel_surcharge_yq": round(sum(o.fuel_surcharge_yq for o in obs) / n, 2),
                "airport_fee_udf": round(sum(o.airport_fee_udf for o in obs) / n, 2),
                "convenience_fee": round(sum(o.convenience_fee for o in obs) / n, 2),
            })
        else:
            # Fallback unbundled estimate based on typical base fare
            default_total = 6500.0
            unbundled = unbundle_fare(default_total, orig, dest)
            results.append({
                "route": f"{orig}-{dest}",
                "base_fare": unbundled["base_fare"],
                "fuel_surcharge_yq": unbundled["fuel_surcharge_yq"],
                "airport_fee_udf": unbundled["airport_fee_udf"],
                "convenience_fee": unbundled["convenience_fee"],
            })

    return results


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
