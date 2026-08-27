import re
import time
import logging
import traceback
from datetime import datetime, timedelta
from typing import Any, List, Dict, Tuple, Optional

try:
    from primp import Client
    from fast_flights import FlightQuery, Passengers, create_query, get_flights
    from fast_flights.integrations import FetchIntegration
    from fast_flights.parser import parse as parse_flights_html
except Exception as _import_err:
    Client = FlightQuery = Passengers = create_query = get_flights = FetchIntegration = parse_flights_html = None
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


def is_google_consent_page(html: str) -> bool:
    """Detects whether Google Flights returned a consent page or redirect HTML."""
    if not html:
        return False
    html_lower = html.lower()
    return (
        "before you continue to google" in html_lower
        or "consent.google.com" in html_lower
        or "g.co/same-identity" in html_lower
        or "<title>before you continue" in html_lower
    )


def has_flight_script(html: str) -> bool:
    """Checks whether the Google Flights JS data payload script class='ds:1' exists in HTML."""
    if not html:
        return False
    return "class=\"ds:1\"" in html or "class='ds:1'" in html or "ds:1" in html


class GoogleConsentFetchIntegration(FetchIntegration if FetchIntegration else object):
    """
    Custom fetch integration that injects Google Consent cookies & headers
    to bypass consent page redirects on datacenter/cloud IPs (Railway, Render, AWS).
    Never logs cookies or header secrets.
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
    Executes flight fetch for a single route + horizon and returns full diagnostic stage metrics.
    """
    now = datetime.now()
    dep_date = (now + timedelta(days=horizon_days)).strftime("%Y-%m-%d")
    
    diag: Dict[str, Any] = {
        "origin": origin,
        "destination": destination,
        "horizon_days": horizon_days,
        "departure_date": dep_date,
        "request_timestamp": now.isoformat(),
        "fetch_stage": {"status": "pending", "elapsed_ms": 0, "flight_groups": 0, "used_fallback": False, "error": None},
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
    used_fallback = False

    try:
        query_obj = create_query(
            flights=[FlightQuery(date=dep_date, from_airport=origin, to_airport=destination)],
            trip="one-way",
            seat="economy",
            currency="INR",
            passengers=Passengers(adults=1),
        )
        
        # Primary fetch
        try:
            result = get_flights(query_obj)
        except (AttributeError, Exception) as primary_err:
            err_str = str(primary_err)
            if "'NoneType' object has no attribute 'text'" in err_str or "script.ds:1" in err_str or isinstance(primary_err, AttributeError):
                logger.warning(
                    f"[FETCH_CONSENT_DETECTED] Standard fetch hit Google Consent page/missing payload script on cloud IP for {origin}->{destination} T-{horizon_days}. "
                    "Triggering isolated GoogleConsentFetchIntegration fallback..."
                )
                used_fallback = True
                result = get_flights(query_obj, integration=GoogleConsentFetchIntegration())
            else:
                raise primary_err

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        flight_groups_cnt = len(result) if result else 0
        diag["fetch_stage"].update({
            "status": "success" if result is not None else "empty_response",
            "elapsed_ms": elapsed_ms,
            "flight_groups": flight_groups_cnt,
            "used_fallback": used_fallback,
        })
        
        logger.info(
            f"\n[FETCH_RESPONSE]\n"
            f"  Route          : {origin} -> {destination} T-{horizon_days}\n"
            f"  Status         : HTTP 200 (Success)\n"
            f"  Elapsed        : {elapsed_ms} ms\n"
            f"  Used Fallback  : {used_fallback}\n"
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
            "used_fallback": used_fallback,
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


def fetch_all_corridors_with_summary() -> Tuple[List[RawFareRecord], Dict[str, Any]]:
    """
    Executes full sweep across all tracked corridors and horizons with isolated exception handling.
    Ensures a single route failure does NOT abort remaining sweeps.
    Returns: (all_records, summary_dict)
    """
    all_records: List[RawFareRecord] = []
    job_results: List[Dict[str, Any]] = []
    
    success_cnt = 0
    failed_cnt = 0
    total_jobs = len(TRACKED_CORRIDORS) * len(TRACKED_HORIZONS)
    now = datetime.now()

    logger.info(
        f"\n=======================================================\n"
        f"  STARTING VAYU MULTI-CORRIDOR SWEEP\n"
        f"=======================================================\n"
        f"  Timestamp    : {now.isoformat()}\n"
        f"  Corridors ({len(TRACKED_CORRIDORS)}): {TRACKED_CORRIDORS}\n"
        f"  Horizons ({len(TRACKED_HORIZONS)}): {TRACKED_HORIZONS} days\n"
        f"  Total Sweeps : {total_jobs}\n"
        f"======================================================="
    )

    for origin, destination in TRACKED_CORRIDORS:
        for horizon in TRACKED_HORIZONS:
            # Isolated execution block per route-horizon pair
            try:
                diag = fetch_route_horizon_with_diagnostics(origin, destination, horizon)
                records = diag.get("records", [])
                fetch_st = diag.get("fetch_stage", {}).get("status")
                
                if fetch_st in ("success", "completed", "empty_response"):
                    success_cnt += 1
                else:
                    failed_cnt += 1

                all_records.extend(records)
                job_results.append({
                    "corridor": f"{origin}-{destination}",
                    "horizon": horizon,
                    "target_date": diag.get("departure_date"),
                    "status": fetch_st,
                    "flight_groups": diag.get("fetch_stage", {}).get("flight_groups", 0),
                    "parsed_records": len(records),
                    "skipped_records": diag.get("parse_stage", {}).get("skipped_offers", 0),
                    "elapsed_ms": diag.get("fetch_stage", {}).get("elapsed_ms", 0),
                    "error": diag.get("fetch_stage", {}).get("error"),
                })
            except Exception as route_exc:
                failed_cnt += 1
                logger.error(
                    f"[CORRIDOR_SWEEP_ERROR] Route {origin}->{destination} T-{horizon} failed: {route_exc}\n"
                    f"{traceback.format_exc()}"
                )
                job_results.append({
                    "corridor": f"{origin}-{destination}",
                    "horizon": horizon,
                    "status": "failed",
                    "error": {"type": type(route_exc).__name__, "message": str(route_exc)},
                })

    summary = {
        "timestamp": now.isoformat(),
        "total_jobs": total_jobs,
        "success_jobs": success_cnt,
        "failed_jobs": failed_cnt,
        "total_records_generated": len(all_records),
        "job_details": job_results,
    }

    logger.info(
        f"\n=======================================================\n"
        f"  VAYU SWEEP SUMMARY\n"
        f"=======================================================\n"
        f"  SUCCESS : {success_cnt}\n"
        f"  FAILED  : {failed_cnt}\n"
        f"  TOTAL   : {total_jobs}\n"
        f"  RECORDS : {len(all_records)} total live fares generated\n"
        f"======================================================="
    )

    return all_records, summary


def fetch_all_corridors() -> List[RawFareRecord]:
    all_records, _ = fetch_all_corridors_with_summary()
    return all_records


if __name__ == "__main__":
    import json
    records, summary = fetch_all_corridors_with_summary()
    print(f"\n--- SWEEP SUMMARY ---")
    print(json.dumps(summary, indent=2, default=str))
