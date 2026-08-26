import re
import logging
from datetime import datetime, timedelta
from typing import Any, List
from fast_flights import FlightData, Passengers, create_filter, get_flights
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
        filter_args = create_filter(
            flight_data=[FlightData(date=dep_date, from_airport=origin, to_airport=destination)],
            trip="One-way",
            seat="Economy",
            passengers=Passengers(adults=1, children=0, infants_in_seat=0, infants_on_lap=0),
        )
        result = get_flights(filter_args)
    except Exception as e:
        logger.error(f"FAILED {origin}->{destination} T-{horizon_days}: {e}")
        return records

    flights = getattr(result, "flights", None) or []
    for idx, flight in enumerate(flights):
        raw_price = getattr(flight, "price", None)
        total_fare = _parse_numeric_price(raw_price)
        if total_fare < 1000.0:
            continue

        carrier_name = str(getattr(flight, "name", "Unknown"))
        flight_number = str(getattr(flight, "flight_number", None) or getattr(flight, "flight", None) or f"{origin}{destination}-{horizon_days}-{idx}")
        
        carrier_code = (
            flight_number.split("-")[0][:2].upper()
            if "-" in flight_number
            else carrier_name[:2].upper()
        )

        unbundled = unbundle_fare(total_fare, origin, destination)

        # parse time
        raw_dep = getattr(flight, "departure", "10:00 AM")
        try:
            parsed_time = datetime.strptime(str(raw_dep), "%I:%M %p").strftime("%H:%M:%S")
            departure_time_str = f"{dep_date} {parsed_time}"
        except Exception:
            departure_time_str = f"{dep_date} 10:00:00"

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

    return records

def fetch_all_corridors() -> List[RawFareRecord]:
    all_records: List[RawFareRecord] = []
    now = datetime.now()
    logger.info(f"Starting sweep at {now.isoformat()}")

    for origin, destination in TRACKED_CORRIDORS:
        for horizon in TRACKED_HORIZONS:
            recs = fetch_route_horizon(origin, destination, horizon)
            logger.info(f"{origin}->{destination} T-{horizon}: {len(recs)} fares collected")
            all_records.extend(recs)

    logger.info(f"Sweep complete: {len(all_records)} total fare records")
    return all_records

if __name__ == "__main__":
    import json
    data = fetch_all_corridors()
    print(json.dumps([r.model_dump(mode="json") for r in data], indent=2, default=str))
