"""
core/dgca_weights.py
DGCA-derived route passenger volume weights used for the national
Laspeyres-type aggregation of route-level Jevons micro-indices.

IMPORTANT (be honest about this in the demo/report):
DGCA publishes city-pair domestic passenger traffic in its periodic
"Traffic Data" and "Airline-wise/Sector-wise" reports (available at
dgca.gov.in), but not as a single clean machine-readable weight table at
this route-pair granularity. The figures below are approximate shares
derived from DGCA's most recent published domestic sector traffic
reports for the tracked high-density corridors, normalized so they sum
to 1.0 across the 6 tracked routes. Treat these as documented estimates,
not an official DGCA index -- re-derive them from the latest DGCA
"Domestic Airline Traffic Report" before any real submission, and cite
the report/quarter used as `source_note`.
"""

from core.schemas import RouteWeight

DGCA_SOURCE_NOTE = (
    "Estimated share of the 6 tracked corridors' combined domestic "
    "passenger traffic, derived from DGCA's published sector-wise "
    "traffic reports (dgca.gov.in). Re-verify against the latest "
    "quarterly report before official use."
)

# Raw relative traffic shares among the 6 tracked corridors (not the full
# national network -- these are normalized to sum to 1.0 across just the
# routes VAYU-CPI tracks, matching the aggregation formula in the spec).
_RAW_ROUTE_WEIGHTS = {
    "DEL-BOM": 0.24,
    "BOM-DEL": 0.24,
    "BLR-DEL": 0.18,
    "DEL-CCU": 0.14,
    "DEL-PAT": 0.10,
    "BOM-GOI": 0.10,
}

_ROUTE_META = {
    "DEL-BOM": ("DEL", "BOM"),
    "BOM-DEL": ("BOM", "DEL"),
    "BLR-DEL": ("BLR", "DEL"),
    "DEL-CCU": ("DEL", "CCU"),
    "DEL-PAT": ("DEL", "PAT"),
    "BOM-GOI": ("BOM", "GOI"),
}


def get_route_weights(normalize: bool = True) -> list[RouteWeight]:
    """Returns DGCA-derived route weights for the tracked corridor set.

    Args:
        normalize: if True (default), rescales weights so they sum to
            1.0 across the returned routes. Set False to inspect raw
            shares before normalization.
    """
    total = sum(_RAW_ROUTE_WEIGHTS.values()) if normalize else 1.0

    weights = []
    for route, raw_w in _RAW_ROUTE_WEIGHTS.items():
        origin, dest = _ROUTE_META[route]
        w = raw_w / total if normalize else raw_w
        weights.append(
            RouteWeight(
                route=route,
                origin=origin,
                destination=dest,
                weight=round(w, 6),
                source_note=DGCA_SOURCE_NOTE,
            )
        )
    return weights


def get_weight_for_route(origin: str, destination: str) -> float:
    """Convenience lookup: weight for a single origin/destination pair.
    Returns 0.0 if the route isn't in the tracked corridor set."""
    route_key = f"{origin.upper()}-{destination.upper()}"
    for rw in get_route_weights():
        if rw.route == route_key:
            return rw.weight
    return 0.0


# Horizon blending weights (alpha) from the spec's national aggregation
# formula: I_National = sum_r( W_r * sum_h( alpha_h * I_r,h ) )
HORIZON_ALPHA = {
    30: 0.35,  # Advance bookings
    7: 0.45,   # Standard / mid-window
    1: 0.20,   # Urgent / Tatkal
}

TRACKED_ROUTES = list(_RAW_ROUTE_WEIGHTS.keys())
TRACKED_HORIZONS = list(HORIZON_ALPHA.keys())
