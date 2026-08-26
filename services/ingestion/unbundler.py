def unbundle_fare(total_fare: float, origin: str, destination: str) -> dict:
    udf_map = {"DEL": 650.0, "BOM": 650.0, "BLR": 580.0, "CCU": 480.0, "PAT": 350.0, "GOI": 390.0}
    udf = udf_map.get(origin, 400.0)
    convenience_fee = 300.0
    fuel_surcharge_yq = 600.0
    
    base_fare = total_fare - (udf + convenience_fee + fuel_surcharge_yq)
    
    if base_fare < 0:
        base_fare = total_fare * 0.60
        remaining = total_fare - base_fare
        total_fees = udf + convenience_fee + fuel_surcharge_yq
        if total_fees > 0:
            udf = (udf / total_fees) * remaining
            convenience_fee = (convenience_fee / total_fees) * remaining
            fuel_surcharge_yq = (fuel_surcharge_yq / total_fees) * remaining

    return {
        "base_fare": round(base_fare, 2),
        "fuel_surcharge_yq": round(fuel_surcharge_yq, 2),
        "airport_fee_udf": round(udf, 2),
        "convenience_fee": round(convenience_fee, 2),
        "total_fare": round(total_fare, 2)
    }
