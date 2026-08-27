import re
import time
import logging
import traceback
from datetime import datetime, timedelta
from typing import Any, List, Dict

try:
    from primp import Client
    from fast_flights import FlightQuery, Passengers, create_query, get_flights
    from fast_flights.integrations import FetchIntegration
except Exception as _import_err:
    Client = FlightQuery = Passengers = create_query = get_flights = FetchIntegration = None
    FAST_FLIGHTS_IMPORT_ERROR = str(_import_err)

from core.schemas import RawFareRecord
from services.ingestion.unbundler import unbundle_fare

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vayu-cpi.ingestion")

TRACKED_CORRIDORS = [
    ("DEL", "BOM"),
    ("BOM", "DEL"),
    ("BLR", "DEL"),
    ("DEL", "CCU"),
    ("DEL", "PAT"),
    ("BOM", "GOI"),
]
TRACKED_HORIZONS = [30, 7, 1]


class GoogleConsentFetchIntegration(FetchIntegration if FetchIntegration else object):
    """
    Custom fetch integration that injects Google Consent cookies & headers
    to bypass consent page redirects on datacenter/cloud IPs (Railway, Render, AWS).
    """
    def fetch_html(self, q: Any) -> str:
        client = Client(
            impersonate="chrome_145",
            impersonate_os="macos",
            referer=True,
            cookie_store=True,
            headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Cookie": "SOCS=CAISHAgBEhJnd3NfMjAyNDA4MjctMF9SQzEaAmVuIAEaBgiAo_uuBg; CONSENT=YES+cb; GoogleConsent=1",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            }
        )
        params = q.params() if hasattr(q, "params") else {"q": q}
        res = client.get("https://www.google.com/travel/flights", params=params)
        return res.text


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


def fetch_route_horizon_with_diagnostics(
    origin: str, destination: str, horizon_days: int
) -> Dict[str, Any]:
    """
    Executes flight fetch for a single route + horizon and returns full diagnostic stage metrics:
    - fetch_stage: status, elapsed_ms, raw flight_groups count, error details
    - parse_stage: records generated count, error details
    - records: List[RawFareRecord]
    """
    now = datetime.now()
    dep_date = (now + timedelta(days=horizon_days)).strftime("%Y-%m-%d")
    
    diag: Dict[str, Any] = {
        "origin": origin,
        "destination": destination,
        "horizon_days": horizon_days,
        "departure_date": dep_date,
        "request_timestamp": now.isoformat(),
        "fetch_stage": {"status": "pending", "elapsed_ms": 0, "flight_groups": 0, "error": None},
        "parse_stage": {"status": "pending", "records_generated": 0, "skipped_offers": 0, "error": None},
        "records": [],
    }

    logger.info(
        f"\n[FETCH_START]\n"
        f"  Route          : {origin} -> {destination}\n"
        f"  Horizon        : T-{horizon_days}\n"
        f"  Target Date    : {dep_date}\n"
        f"  Timestamp (Local): {now.isoformat()}"
    )

    if get_flights is None:
        err_msg = f"fast-flights module not loaded: {FAST_FLIGHTS_IMPORT_ERROR}"
        logger.error(f"[FETCH_FAILED] {err_msg}")
        diag["fetch_stage"].update({"status": "failed", "error": {"type": "ImportError", "message": err_msg}})
        return diag

    start_time = time.perf_counter()
    result = None
    try:
        query_obj = create_query(
            flights=[FlightQuery(date=dep_date, from_airport=origin, to_airport=destination)],
            trip="one-way",
            seat="economy",
            currency="INR",
            passengers=Passengers(adults=1),
        )
        
        # Try standard get_flights first
        try:
            result = get_flights(query_obj)
        except AttributeError as attr_err:
            if "'NoneType' object has no attribute 'text'" in str(attr_err):
                logger.warning(
                    f"[FETCH_RETRY] Standard fetch hit Google Consent redirect on cloud IP for {origin}->{destination}. "
                    "Retrying with GoogleConsentFetchIntegration..."
                )
                result = get_flights(query_obj, integration=GoogleConsentFetchIntegration())
            else:
                raise

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        flight_groups_cnt = len(result) if result else 0
        diag["fetch_stage"].update({
            "status": "success" if result is not None else "empty_response",
            "elapsed_ms": elapsed_ms,
            "flight_groups": flight_groups_cnt,
        })
        
        logger.info(
            f"\n[FETCH_RESPONSE]\n"
            f"  Route          : {origin} -> {destination} T-{horizon_days}\n"
            f"  Status         : HTTP 200 (Success)\n"
            f"  Elapsed        : {elapsed_ms} ms\n"
            f"  Flight Groups  : {flight_groups_cnt}"
        )
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        exc_type = type(exc).__name__
        exc_msg = str(exc)
        tb_str = traceback.format_exc()
        
        logger.error(
            f"\n[FETCH_FAILED]\n"
            f"  Route          : {origin} -> {destination} T-{horizon_days}\n"
            f"  Elapsed        : {elapsed_ms} ms\n"
            f"  Exception Type : {exc_type}\n"
            f"  Message        : {exc_msg}\n"
            f"  Traceback      :\n{tb_str}"
        )
        diag["fetch_stage"].update({
            "status": "failed",
            "elapsed_ms": elapsed_ms,
            "error": {"type": exc_type, "message": exc_msg, "traceback": tb_str},
        })
        return diag

    if not result:
        logger.warning(f"[PARSE_SKIPPED] Zero flight groups returned for {origin}->{destination} T-{horizon_days}")
        diag["parse_stage"].update({"status": "completed", "records_generated": 0})
        return diag

    # Parsing stage
    records: List[RawFareRecord] = []
    skipped_cnt = 0
    
    for idx, flight_group in enumerate(result):
        try:
            total_fare = _parse_numeric_price(getattr(flight_group, "price", 0))
            if total_fare < 1000.0:
                skipped_cnt += 1
                continue

            airlines = getattr(flight_group, "airlines", [])
            carrier_name = str(airlines[0]) if (airlines and len(airlines) > 0) else "Unknown Airline"
            carrier_code = str(getattr(flight_group, "type", "XX")).upper()

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
            skipped_cnt += 1
            logger.warning(
                f"[PARSE_ERROR] Failed parsing flight offer idx {idx} on {origin}->{destination}: {err}\n"
                f"{traceback.format_exc()}"
            )

    diag["parse_stage"].update({
        "status": "success",
        "records_generated": len(records),
        "skipped_offers": skipped_cnt,
    })
    diag["records"] = records

    logger.info(
        f"\n[PARSE_RESULT]\n"
        f"  Route          : {origin} -> {destination} T-{horizon_days}\n"
        f"  Flight Groups  : {len(result)}\n"
        f"  Records Parsed : {len(records)}\n"
        f"  Offers Skipped : {skipped_cnt}"
    )

    return diag


def fetch_route_horizon(origin: str, destination: str, horizon_days: int) -> List[RawFareRecord]:
    """Backwards-compatible wrapper returning List[RawFareRecord]."""
    diag = fetch_route_horizon_with_diagnostics(origin, destination, horizon_days)
    return diag.get("records", [])


def fetch_all_corridors() -> List[RawFareRecord]:
    all_records: List[RawFareRecord] = []
    now = datetime.now()
    logger.info(f"Starting full Google Flights live sweep across {len(TRACKED_CORRIDORS)} corridors at {now.isoformat()}")

    for origin, destination in TRACKED_CORRIDORS:
        for horizon in TRACKED_HORIZONS:
            recs = fetch_route_horizon(origin, destination, horizon)
            all_records.extend(recs)

    logger.info(f"Sweep complete: {len(all_records)} total live fare records collected across all corridors.")
    return all_records


if __name__ == "__main__":
    import json
    data = fetch_all_corridors()
    print(f"\n--- COLLECTED {len(data)} LIVE FARES ---")
    print(json.dumps([r.model_dump(mode="json") for r in data[:3]], indent=2, default=str))
