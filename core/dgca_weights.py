ROUTE_WEIGHTS = {
    "DEL-BOM": 0.26,
    "BOM-DEL": 0.24,
    "BLR-DEL": 0.20,
    "DEL-CCU": 0.14,
    "DEL-PAT": 0.09,
    "BOM-GOI": 0.07
}

HORIZON_ALPHA = {
    30: 0.35,
    7: 0.45,
    1: 0.20
}

ALL_CORRIDORS = [
    ("DEL", "BOM"),
    ("BOM", "DEL"),
    ("BLR", "DEL"),
    ("DEL", "CCU"),
    ("DEL", "PAT"),
    ("BOM", "GOI")
]

def get_route_weight(origin: str, dest: str) -> float:
    return ROUTE_WEIGHTS.get(f"{origin}-{dest}", 0.0)

def get_horizon_alpha(horizon_days: int) -> float:
    return HORIZON_ALPHA.get(horizon_days, 0.0)
