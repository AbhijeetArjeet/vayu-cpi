import re
import logging
from datetime import datetime, timedelta
from typing import Any, List
from fast_flights import FlightQuery, Passengers, create_query, get_flights
from core.schemas import RawFareRecord
from services.ingestion.unbundler import unbundle_fare

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TRACKED_CORRIDORS = [
    ("DEL", "BOM"),
    ("BOM", "DEL"),
    ("BLR", "DEL"),
    ("DEL", "CCU"),
    ("DEL", "PAT"),
    ("BOM", "GOI"),
]
TRACKED_HORIZONS = [30, 7, 1]


def _parse_numeric_price(raw_val: Any) -> float:
    if not raw_val:
        return 0.0
    if isinstance(raw_val, (int, float)):
        return float(raw_val)
    cleaned = re.sub(r"[^\d.]", "", str(raw_val))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def fetch_route_horizon(origin: str, destination: str, horizon_days: int) -> List[RawFareRecord]:
    now = datetime.now()
    dep_date = (now + timedelta(days=horizon_days)).strftime("%Y-%m-%d")
    records: List[RawFareRecord] = []

    try:
        query_obj = create_query(
            flights=[FlightQuery(date=dep_date, from_airport=origin, to_airport=destination)],
            trip="one-way",
            seat="economy",
            currency="INR",
            passengers=Passengers(adults=1),
        )
        result = get_flights(query_obj)
    except Exception as e:
        logger.error(f"FAILED {origin}->{destination} T-{horizon_days}: {e}")
        return records

    if not result:
        return records

    for idx, flight_group in enumerate(result):
        try:
            total_fare = _parse_numeric_price(getattr(flight_group, "price", 0))
            if total_fare < 1000.0:
                continue

            airlines = getattr(flight_group, "airlines", [])
            carrier_name = airlines[0] if airlines else "Unknown Airline"
            carrier_code = str(getattr(flight_group, "type", "XX")).upper()

            # Parse departure time if present
            sub_flights = getattr(flight_group, "flights", [])
            departure_time_str = f"{dep_date} 10:00:00"
            flight_number = f"{carrier_code}-{100 + idx}"

            if sub_flights:
                first_sf = sub_flights[0]
                dep_dt = getattr(first_sf, "departure", None)
                if dep_dt and hasattr(dep_dt, "time"):
                    t_tuple = dep_dt.time
                    h = t_tuple[0] if len(t_tuple) > 0 else 10
                    m = t_tuple[1] if len(t_tuple) > 1 else 0
                    departure_time_str = f"{dep_date} {h:02d}:{m:02d}:00"

            unbundled = unbundle_fare(total_fare, origin, destination)
            scraped_at_str = now.isoformat()

            record = RawFareRecord(
                portal="Google Flights Live Feed",
                carrier_name=carrier_name,
                carrier_code=carrier_code or "XX",
                flight_number=flight_number,
                origin=origin,
                destination=destination,
                departure_time=departure_time_str,
                scraped_at=scraped_at_str,
                horizon_days=horizon_days,
                base_fare=unbundled["base_fare"],
                fuel_surcharge_yq=unbundled["fuel_surcharge_yq"],
                airport_fee_udf=unbundled["airport_fee_udf"],
                convenience_fee=unbundled["convenience_fee"],
                total_fare=unbundled["total_fare"],
            )
            records.append(record)
        except Exception as err:
            logger.warning(f"Error parsing flight offer: {err}")
            continue

    return records


def fetch_all_corridors() -> List[RawFareRecord]:
    all_records: List[RawFareRecord] = []
    now = datetime.now()
    logger.info(f"Starting Google Flights live sweep at {now.isoformat()}")

    for origin, destination in TRACKED_CORRIDORS:
        for horizon in TRACKED_HORIZONS:
            recs = fetch_route_horizon(origin, destination, horizon)
            logger.info(f"{origin}->{destination} T-{horizon}: {len(recs)} live fares collected")
            all_records.extend(recs)

    logger.info(f"Sweep complete: {len(all_records)} total live fare records collected")
    return all_records


if __name__ == "__main__":
    import json
    data = fetch_all_corridors()
    print(f"\n--- COLLECTED {len(data)} LIVE FARES ---")
    print(json.dumps([r.model_dump(mode="json") for r in data[:5]], indent=2, default=str))
