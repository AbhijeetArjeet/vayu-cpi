"""
services/engine/intelligence/weather.py
Airfare Weather & Regional Pressure Engine.

Provides an intuitive macro-visualization layer for citizens and policymakers,
translating complex econometric indices into regional airfare weather indicators:
- North, West, South, East, Northeast
- Pressure Levels: NORMAL, ELEVATED, HIGH, SHOCK
- Weather Icons: SUNNY, PARTLY_CLOUDY, RAINY, THUNDERSTORM
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Dict
from core.schemas import AirfareWeatherReport, RegionalWeatherItem
from services.engine.index_calculator import compute_national_composite_cpi, compute_route_jevons_index
from services.engine.intelligence.shocks import detect_airfare_shocks


def compute_airfare_weather_report() -> AirfareWeatherReport:
    """
    Computes regional airfare pressure indices and translates them into weather states.
    """
    cpi_res = compute_national_composite_cpi(mode="live", period_days=30)
    nat_cpi = cpi_res.composite_index
    shocks = detect_airfare_shocks(mode="combined", min_severity="ELEVATED")

    # Region definitions with primary corridors and hubs
    region_defs = [
        {
            "code": "NORTH",
            "name": "Northern Region",
            "hub": "Delhi (DEL)",
            "corridors": [("DEL", "BOM"), ("DEL", "BLR"), ("DEL", "CCU"), ("DEL", "PAT"), ("BLR", "DEL")],
        },
        {
            "code": "WEST",
            "name": "Western Region",
            "hub": "Mumbai (BOM)",
            "corridors": [("BOM", "DEL"), ("BOM", "GOI"), ("BOM", "BLR"), ("DEL", "BOM")],
        },
        {
            "code": "SOUTH",
            "name": "Southern Region",
            "hub": "Bengaluru (BLR)",
            "corridors": [("BLR", "DEL"), ("DEL", "BLR"), ("BOM", "BLR")],
        },
        {
            "code": "EAST",
            "name": "Eastern Region",
            "hub": "Kolkata (CCU)",
            "corridors": [("DEL", "CCU"), ("DEL", "PAT")],
        },
        {
            "code": "NORTHEAST",
            "name": "Northeastern Region",
            "hub": "Guwahati (GAU)",
            "corridors": [("DEL", "PAT")],
        },
    ]

    regional_items: List[RegionalWeatherItem] = []

    for r_def in region_defs:
        route_cpis = []
        for orig, dest in r_def["corridors"]:
            r_res = compute_route_jevons_index(orig, dest, 7, mode="live", period_days=30)
            idx = r_res.jevons_index if (r_res and getattr(r_res, 'sample_size', 0) > 0) else 0.0
            if idx > 0:
                route_cpis.append(idx)
        
        avg_cpi = (sum(route_cpis) / len(route_cpis)) if route_cpis else nat_cpi
        
        # Count active shocks in this region
        hub_orig = r_def["hub"][:3]
        reg_shocks = [s for s in shocks if s.origin == hub_orig or s.destination == hub_orig]

        # Determine pressure level & weather icon
        if avg_cpi >= 170.0 or len(reg_shocks) >= 3:
            pressure = "SHOCK"
            icon = "THUNDERSTORM"
        elif avg_cpi >= 140.0 or len(reg_shocks) >= 1:
            pressure = "HIGH"
            icon = "RAINY"
        elif avg_cpi >= 115.0:
            pressure = "ELEVATED"
            icon = "PARTLY_CLOUDY"
        else:
            pressure = "NORMAL"
            icon = "SUNNY"

        regional_items.append(
            RegionalWeatherItem(
                region_code=r_def["code"],
                region_name=r_def["name"],
                pressure_level=pressure,
                weather_icon=icon,
                average_route_cpi=round(avg_cpi, 2),
                primary_hub=r_def["hub"],
                corridors_monitored=len(r_def["corridors"]),
                active_shocks_count=len(reg_shocks),
            )
        )

    # National macro weather summary
    high_count = sum(1 for r in regional_items if r.pressure_level in ("HIGH", "SHOCK"))
    if high_count >= 3:
        nat_pressure = "HIGH"
        nat_summary = "Turbulent airfare pressure observed across trunk corridors with active spot surge clusters."
    elif high_count >= 1:
        nat_pressure = "MODERATE"
        nat_summary = "Moderate airfare pressure with isolated tariff surges in Western & Northern hubs."
    else:
        nat_pressure = "STABLE"
        nat_summary = "Calm airfare weather across primary Indian domestic corridors."

    return AirfareWeatherReport(
        national_weather_summary=nat_summary,
        national_pressure_level=nat_pressure,
        weather_timestamp=datetime.now().strftime("%Y-%m-%d %H:%M IST"),
        regions=regional_items,
    )
