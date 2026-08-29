"""
services/engine/seed_base_2024.py
Base 2024 reference geometric mean prices across representative domestic corridors
and advance purchase horizons.

⚠️ IMPORTANT: These are assumed/illustrative base-period reference fares, NOT derived
from any official published base-period average fare data (e.g., DGCA, MoCA, or MoSPI).
They are hand-estimated values intended to provide a plausible denominator for the
Jevons index formula (I = current_geom_mean / base_geom_mean × 100) during the
prototype/demo phase.

To replace with a real base period:
1. Accumulate N months (recommended: 3–6) of live Google Flights observations
2. Compute the geometric mean fare for each (corridor, horizon) pair over that period
3. Replace the hardcoded BASE_FARES dict with those computed values
4. Document the base period dates and observation counts used
"""

from __future__ import annotations

# Illustrative base reference prices for T+7 (1-week advance) in Base Year 2024 (INR).
# These values are hand-estimated, not computed from observed data.
# See module docstring for how to replace with real base-period averages.
BASE_FARES = {
    "DEL-BOM": 4200.0,
    "BOM-DEL": 4100.0,
    "BLR-DEL": 5800.0,
    "DEL-BLR": 5700.0,
    "DEL-CCU": 4500.0,
    "CCU-DEL": 4400.0,
    "BOM-BLR": 3900.0,
    "BLR-BOM": 3800.0,
    "DEL-HYD": 4600.0,
    "HYD-DEL": 4500.0,
    "DEL-MAA": 4900.0,
    "MAA-DEL": 4800.0,
    "DEL-PAT": 5200.0,
    "BOM-GOI": 3800.0,
    "BOM-HYD": 3600.0,
    "HYD-BOM": 3500.0,
    "BOM-MAA": 4100.0,
    "MAA-BOM": 4000.0,
    "BLR-HYD": 3100.0,
    "HYD-BLR": 3000.0,
    "BLR-MAA": 2800.0,
    "MAA-BLR": 2700.0,
}

# Dynamic horizon tariff scaling relative to standard T+7 baseline
HORIZON_BASE_MULTIPLIERS = {
    45: 0.80,  # T+45 (Long Advance Purchase)
    30: 0.85,  # T+30 (1-Month Advance)
    15: 0.92,  # T+15 (Fortnight Advance)
    7: 1.00,   # T+7  (1-Week Standard)
    1: 1.35,   # T+1  (Spot / Tatkal)
}


def get_base_fare(origin: str, dest: str, horizon_days: int) -> float:
    """Returns 2024 Base Period Geometric Reference Fare in INR."""
    corridor = f"{origin.upper()}-{dest.upper()}"
    base_price = BASE_FARES.get(corridor, 4500.0)
    multiplier = HORIZON_BASE_MULTIPLIERS.get(horizon_days, 1.0)
    return round(base_price * multiplier, 2)
