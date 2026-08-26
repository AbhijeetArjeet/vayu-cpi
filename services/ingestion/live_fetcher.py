"""
services/ingestion/live_fetcher.py
Primary live ingestion connector: queries Google Flights' live production
backend via the `fast-flights` library (no API key required, no scraping
sandbox limitations).

Install:
    pip install fast-flights

Notes on reliability (be upfront about these in the demo):
- `fast-flights` talks to Google Flights' internal search protocol. It can
  break if Google changes response formats -- wrap every call defensively
  and fail a single route/horizon combination without killing the run.
- Results don't always include a stable machine flight number for every
  offer; we fall back to a synthetic identifier when absent so downstream
  code always has a `flight_number`.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any, Optional

from core.dgca_weights import TRACKED_HORIZONS, TRACKED_ROUTES
from core.schemas import RawFareRecord

# Approximate statutory/airport fee slabs used to unbundle the all-in
# Google Flights price into base fare + fees. These are documented
# estimates (see PROJECT_SPEC section 2) -- Google Flights returns a
# single all-in price, not an itemized breakdown, so any unbundling of a
# scraped total fare is necessarily an approximation. Amadeus/GDS offers
# (when available) return real itemized `base` vs `total`, which is more
# accurate and should be preferred where the production API is usable.
_UDF_BY_ORIGIN = {
    "DEL": 650.0,
    "BOM": 650.0,
    "BLR": 580.0,
    "CCU": 480.0,
    "PAT": 350.0,
    "GOI": 400.0,
}
_DEFAULT_CONVENIENCE_FEE = 300.0
_DEFAULT_YQ_SURCHARGE = 600.0
_MIN_PLAUSIBLE_FARE = 1000.0  # filters out null/broken zero-price rows


def _parse_numeric_price(raw_val: Any) -> float:
    """Extracts a numeric INR price from whatever format fast-flights
    hands back (string with currency symbol, int, float, None)."""
    if not raw_val:
        return 0.0
    if isinstance(raw_val, (int, float)):
        return float(raw_val)
    cleaned = re.sub(r"[^\d.]", "", str(raw_val))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _unbundle_fare(total_fare: float, origin: str) -> dict:
    udf = _UDF_BY_ORIGIN.get(origin, 400.0)
    convenience = _DEFAULT_CONVENIENCE_FEE
    yq = _DEFAULT_YQ_SURCHARGE
    base_fare = max(100.0, round(total_fare - (udf + convenience + yq), 2))
    return {
        "base_fare": base_fare,
        "fuel_surcharge_yq": yq,
        "airport_fee_udf": udf,
        "convenience_fee": convenience,
    }


def fetch_route_horizon(
    origin: str, destination: str, horizon_days: int
) -> list[RawFareRecord]:
    """Fetches live economy fares for one route + one booking horizon.

    Returns an empty list (never raises) if the upstream query fails --
    callers should treat missing data as "no sample this run", not a
    crash, since a single flaky query shouldn't take down the pipeline.
    """
    try:
        from fast_flights import FlightQuery, create_query, get_flights
    except ImportError as e:
        raise RuntimeError(
            "fast-flights is not installed. Run: pip install fast-flights"
        ) from e

    now = datetime.now()
    dep_date = (now + timedelta(days=horizon_days)).strftime("%Y-%m-%d")
    records: list[RawFareRecord] = []

    try:
        query = create_query(
            flights=[
                FlightQuery(date=dep_date, from_airport=origin, to_airport=destination)
            ],
            seat="economy",
            trip="one-way",
            currency="INR",
        )
        result = get_flights(query)
    except Exception as e:
        print(f"[live_fetcher] FAILED {origin}->{destination} T-{horizon_days}: {e}")
        return records

    flights = getattr(result, "flights", None) or []
    for idx, flight in enumerate(flights):
        raw_price = getattr(flight, "price", None) or getattr(
            result, "current_price", None
        )
        total_fare = _parse_numeric_price(raw_price)
        if total_fare < _MIN_PLAUSIBLE_FARE:
            continue

        carrier_name = str(getattr(flight, "name", "Unknown"))
        flight_number = str(
            getattr(flight, "flight_number", None)
            or f"{origin}{destination}-{horizon_days}-{idx}"
        )
        # fast-flights doesn't reliably expose a 2-letter IATA carrier
        # code -- derive a best-effort code from the flight number, else
        # fall back to the first two letters of the carrier name.
        carrier_code = (
            flight_number.split("-")[0][:2].upper()
            if "-" in flight_number
            else carrier_name[:2].upper()
        )

        fees = _unbundle_fare(total_fare, origin)

        try:
            departure_time = datetime.fromisoformat(
                f"{dep_date}T{_parse_departure_clock(flight)}"
            )
        except ValueError:
            departure_time = datetime.fromisoformat(f"{dep_date}T10:00:00")

        record = RawFareRecord(
            portal="Google Flights (fast-flights live)",
            flight_number=flight_number,
            carrier_code=carrier_code or "XX",
            origin=origin,
            destination=destination,
            departure_time=departure_time,
            scraped_at=now,
            horizon_days=horizon_days,
            total_fare=round(total_fare, 2),
            **fees,
        )
        records.append(record)

    return records


def _parse_departure_clock(flight: Any) -> str:
    """Best-effort extraction of an HH:MM:SS departure clock time from a
    fast-flights flight object; defaults to 10:00:00 if unavailable."""
    raw = getattr(flight, "departure", None)
    if not raw:
        return "10:00:00"
    match = re.search(r"(\d{1,2}):(\d{2})", str(raw))
    if not match:
        return "10:00:00"
    hh, mm = match.groups()
    return f"{int(hh):02d}:{mm}:00"


def fetch_all_tracked_routes() -> list[RawFareRecord]:
    """Runs the full DGCA corridor x horizon sweep and returns every
    successfully-collected fare record. This is the function the
    scheduler calls on each cron tick."""
    all_records: list[RawFareRecord] = []
    now = datetime.now()
    print(f"[live_fetcher] Starting sweep at {now.isoformat()}")

    for route in TRACKED_ROUTES:
        origin, destination = route.split("-")
        for horizon in TRACKED_HORIZONS:
            recs = fetch_route_horizon(origin, destination, horizon)
            print(
                f"[live_fetcher] {origin}->{destination} T-{horizon}: "
                f"{len(recs)} fares collected"
            )
            all_records.extend(recs)

    print(f"[live_fetcher] Sweep complete: {len(all_records)} total fare records")
    return all_records


if __name__ == "__main__":
    import json

    data = fetch_all_tracked_routes()
    with open("live_airfare_feed.json", "w", encoding="utf-8") as f:
        json.dump([r.model_dump(mode="json") for r in data], f, indent=2, default=str)
    print(f"Saved {len(data)} records to live_airfare_feed.json")
