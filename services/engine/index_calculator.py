"""
services/engine/index_calculator.py
The econometric core of VAYU-CPI:

1. Route-level Jevons micro-index (unweighted geometric mean of price
   relatives vs. a base period), per corridor and booking horizon.
2. National volume-weighted composite CPI (Laspeyres-type aggregation
   across corridors and horizons using DGCA traffic weights + alpha
   horizon blend), Base 2024 = 100.

See PROJECT_SPEC section 6 for the underlying formulas.
"""

from __future__ import annotations

import math
from datetime import date, datetime, timedelta

from core.dgca_weights import HORIZON_ALPHA, TRACKED_HORIZONS, TRACKED_ROUTES, get_weight_for_route
from core.schemas import NationalCompositeCPI, RouteJevonsIndex
from services.engine.normalizer import normalize
from services.persistence.db import fetch_observations

BASE_PERIOD_YEAR = 2024


def _geometric_mean(values: list[float]) -> float:
    if not values:
        return 0.0
    log_sum = sum(math.log(v) for v in values if v > 0)
    n = len([v for v in values if v > 0])
    if n == 0:
        return 0.0
    return math.exp(log_sum / n)


def compute_route_jevons_index(
    origin: str,
    destination: str,
    horizon_days: int,
    calculation_date: date | None = None,
    current_window_days: int = 1,
) -> RouteJevonsIndex | None:
    """Computes the Jevons micro-index for one route/horizon:

        I = geomean(current period prices) / geomean(base period prices)

    "Current period" = observations from the last `current_window_days`.
    "Base period" = all observations scraped in BASE_PERIOD_YEAR for the
    same route + horizon (the fixed 2024 reference basket).

    Returns None if either the base or current sample is empty -- an
    index with no base period isn't defined, and callers (the national
    aggregator) should skip rather than silently treat it as 0 or 100.
    """
    calculation_date = calculation_date or date.today()
    now = datetime.combine(calculation_date, datetime.min.time())

    current_obs = fetch_observations(
        origin, destination, horizon_days, since=now - timedelta(days=current_window_days)
    )
    base_obs = fetch_observations(
        origin,
        destination,
        horizon_days,
        since=datetime(BASE_PERIOD_YEAR, 1, 1),
        until=datetime(BASE_PERIOD_YEAR, 12, 31, 23, 59, 59),
    )

    current_prices = normalize(current_obs)
    base_prices = normalize(base_obs)

    if not current_prices or not base_prices:
        return None

    current_geom = _geometric_mean(current_prices)
    base_geom = _geometric_mean(base_prices)
    if base_geom == 0:
        return None

    micro_index = (current_geom / base_geom) * 100.0

    return RouteJevonsIndex(
        calculation_date=calculation_date,
        origin=origin,
        destination=destination,
        horizon_days=horizon_days,
        jevons_micro_index=round(micro_index, 2),
        current_geom_mean=round(current_geom, 2),
        base_geom_mean=round(base_geom, 2),
        sample_count=len(current_prices),
    )


def compute_national_composite_cpi(
    calculation_date: date | None = None,
) -> NationalCompositeCPI:
    """Aggregates every tracked route's per-horizon Jevons index into the
    national composite CPI:

        I_National = sum_r( W_r * sum_h( alpha_h * I_r,h ) )

    Routes/horizons with no computable micro-index (no base-period or
    current-period sample yet) are excluded from the sum and their
    weight is proportionally redistributed across the routes that DO
    have data, so early in the project's life (thin base-period data)
    the index still returns a meaningful number rather than silently
    collapsing to 0.
    """
    calculation_date = calculation_date or date.today()

    route_results: dict[str, dict[int, RouteJevonsIndex]] = {}
    for route in TRACKED_ROUTES:
        origin, destination = route.split("-")
        route_results[route] = {}
        for horizon in TRACKED_HORIZONS:
            idx = compute_route_jevons_index(
                origin, destination, horizon, calculation_date
            )
            if idx is not None:
                route_results[route][horizon] = idx

    # Per-route blended index: sum_h( alpha_h * I_r,h ), renormalizing
    # alpha across only the horizons that have data for that route.
    route_blended: dict[str, float] = {}
    for route, horizon_map in route_results.items():
        if not horizon_map:
            continue
        alpha_total = sum(HORIZON_ALPHA[h] for h in horizon_map)
        blended = sum(
            (HORIZON_ALPHA[h] / alpha_total) * v.jevons_micro_index
            for h, v in horizon_map.items()
        )
        route_blended[route] = blended

    if not route_blended:
        # No data anywhere yet -- return a neutral placeholder rather
        # than raising, so the API stays up during initial data
        # collection instead of 500ing every request.
        return NationalCompositeCPI(
            calculation_date=calculation_date,
            composite_index=100.0,
            advance_sub_index=100.0,
            spot_sub_index=100.0,
            routes_tracked=0,
            dgca_traffic_coverage_pct=0.0,
        )

    # Renormalize DGCA weights across only the routes with data.
    raw_weights = {r: get_weight_for_route(*r.split("-")) for r in route_blended}
    weight_total = sum(raw_weights.values())
    covered_weight_share = weight_total  # weights already sum to ~1.0 across all 6 routes

    composite = sum(
        (raw_weights[r] / weight_total) * blended
        for r, blended in route_blended.items()
    )

    # Sub-indices: same weighting, but using only the T-30 (advance) or
    # T-1 (spot/tatkal) micro-index per route, when available.
    def _sub_index(horizon: int) -> float:
        contributing = {
            r: route_results[r][horizon].jevons_micro_index
            for r in route_results
            if horizon in route_results[r]
        }
        if not contributing:
            return composite  # fall back to composite if this horizon has no data yet
        sub_weights = {r: get_weight_for_route(*r.split("-")) for r in contributing}
        sub_total = sum(sub_weights.values())
        return sum((sub_weights[r] / sub_total) * v for r, v in contributing.items())

    return NationalCompositeCPI(
        calculation_date=calculation_date,
        composite_index=round(composite, 2),
        advance_sub_index=round(_sub_index(30), 2),
        spot_sub_index=round(_sub_index(1), 2),
        routes_tracked=len(route_blended),
        dgca_traffic_coverage_pct=round(covered_weight_share * 100, 1),
    )
