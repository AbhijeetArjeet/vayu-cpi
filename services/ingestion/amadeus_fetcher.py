"""
services/ingestion/amadeus_fetcher.py
OPTIONAL secondary connector: real Amadeus GDS itemized fares.

Why this is optional, not primary:
Amadeus's free "test" environment only serves static/cached data from
roughly 2017-2021 and rejects dynamic near-term dates like T-7/T-30 --
it is NOT usable for a live demo. This connector is only useful if you
have (or obtain) an approved *production* Amadeus for Developers key,
which typically requires a business verification step. Kept here
because when production access IS available, Amadeus returns real
itemized `base` vs `total` fare data, which is strictly better than the
approximated fee-unbundling `live_fetcher.py` has to do on a scraped
all-in Google Flights price.

If you don't have production Amadeus credentials, use
`services/ingestion/live_fetcher.py` as the sole ingestion source.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

from core.schemas import RawFareRecord

_UDF_BY_ORIGIN = {"DEL": 650.0, "BOM": 650.0, "BLR": 580.0, "CCU": 480.0, "PAT": 350.0, "GOI": 400.0}
_DEFAULT_CONVENIENCE_FEE = 300.0


def fetch_live_gds_flights(
    origin: str, destination: str, horizon_days: int
) -> list[RawFareRecord]:
    """Fetches itemized fare offers from Amadeus's flight-offers-search
    endpoint. Requires AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET env vars
    pointed at a PRODUCTION (not test) hostname to return current data.
    Returns an empty list on any error, matching live_fetcher's
    fail-soft contract so the scheduler can mix both sources safely.
    """
    try:
        from amadeus import Client, ResponseError
    except ImportError as e:
        raise RuntimeError("Run: pip install amadeus") from e

    client_id = os.getenv("AMADEUS_CLIENT_ID")
    client_secret = os.getenv("AMADEUS_CLIENT_SECRET")
    hostname = os.getenv("AMADEUS_HOSTNAME", "test")  # "production" for real data

    if not client_id or not client_secret:
        print("[amadeus_fetcher] Missing credentials -- skipping.")
        return []
    if hostname != "production":
        print(
            "[amadeus_fetcher] hostname is not 'production' -- Amadeus will "
            "return stale sandbox data, not live fares. Skipping to avoid "
            "polluting the index with fake-looking-real data."
        )
        return []

    amadeus = Client(
        client_id=client_id, client_secret=client_secret, hostname=hostname
    )

    departure_date = (datetime.now() + timedelta(days=horizon_days)).strftime(
        "%Y-%m-%d"
    )
    records: list[RawFareRecord] = []

    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=departure_date,
            adults=1,
            currencyCode="INR",
            max=15,
        )
    except ResponseError as error:
        print(f"[amadeus_fetcher] API error {origin}->{destination}: {error}")
        return records

    now = datetime.now()
    for offer in response.data:
        try:
            itinerary = offer["itineraries"][0]["segments"][0]
            carrier = itinerary["carrierCode"]
            flight_num = f"{carrier}-{itinerary['number']}"
            dep_time_str = itinerary["departure"]["at"]

            total_price = float(offer["price"]["total"])
            base_price = float(offer["price"]["base"])
            taxes_fees = round(total_price - base_price, 2)

            udf = _UDF_BY_ORIGIN.get(origin, 400.0)
            convenience = _DEFAULT_CONVENIENCE_FEE
            yq = max(0.0, round(taxes_fees - (udf + convenience), 2))

            records.append(
                RawFareRecord(
                    portal="Amadeus GDS (Production)",
                    flight_number=flight_num,
                    carrier_code=carrier,
                    origin=origin,
                    destination=destination,
                    departure_time=datetime.fromisoformat(dep_time_str),
                    scraped_at=now,
                    horizon_days=horizon_days,
                    base_fare=base_price,
                    fuel_surcharge_yq=yq,
                    airport_fee_udf=udf,
                    convenience_fee=convenience,
                    total_fare=total_price,
                )
            )
        except (KeyError, IndexError, ValueError) as e:
            print(f"[amadeus_fetcher] Skipping malformed offer: {e}")
            continue

    return records
