BASE_FARES = {
    "DEL-BOM": 4200,
    "BOM-DEL": 4100,
    "BLR-DEL": 5800,
    "DEL-CCU": 4500,
    "DEL-PAT": 5200,
    "BOM-GOI": 3800
}

def get_base_fare(origin: str, dest: str, horizon_days: int) -> float:
    corridor = f"{origin}-{dest}"
    if corridor not in BASE_FARES:
        return 0.0
    
    base_price = BASE_FARES[corridor]
    if horizon_days == 30:
        return base_price * 0.85
    elif horizon_days == 7:
        return base_price * 1.0
    elif horizon_days == 1:
        return base_price * 1.35
    return base_price
