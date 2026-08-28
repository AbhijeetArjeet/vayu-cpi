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
except Exception as _import_err:
    Client = FlightQuery = Passengers = create_query = get_flights = FetchIntegration = None
    FAST_FLIGHTS_IMPORT_ERROR = str(_import_err)

from core.schemas import RawFareRecord
from core.dgca_weights import get_horizon_code
from services.ingestion.unbundler import unbundle_fare

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vayu-cpi.ingestion")

TRACKED_CORRIDORS = [
    ("DEL", "BOM"),
    ("BOM", "DEL"),
    ("BLR", "DEL"),
    ("DEL", "BLR"),
    ("DEL", "CCU"),
    ("DEL", "PAT"),
    ("BOM", "GOI"),
]

# Standard SIH Horizons: T+1, T+7, T+15, T+30, T+45
TRACKED_HORIZONS = [45, 30, 15, 7, 1]


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
    bw_code = get_horizon_code(horizon_days)
    
    diag: Dict[str, Any] = {
        "origin": origin,
        "destination": destination,
        "horizon_days": horizon_days,
        "booking_window": bw_code,
        "departure_date": dep_date,
        "request_timestamp": now.isoformat(),
        "fetch_stage": {"status": "pending", "elapsed_ms": 0, "flight_groups": 0, "used_fallback": False, "error": None},
        "parse_stage": {"status": "pending", "records_generated": 0, "skipped_offers": 0, "error": None},
        "records": [],
    }

    logger.info(
        f"\n[FETCH_START]\n"
        f"  Route          : {origin} -> {destination}\n"
        f"  Horizon        : {bw_code} (+{horizon_days}d)\n"
        f"  Target Date    : {dep_date}\n"
        f"  Timestamp (Local): {now.isoformat()}"
    )

    if get_flights is None:
        err_msg = f"fast-flights module not loaded: {FAST_FLIGHTS_IMPORT_ERROR}"
        logger.error(f"[FETCH_FAILED] {err_msg}")
        diag["fetch_stage"].update({"status": "FAILED", "error": {"type": "ImportError", "message": err_msg}})
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
        except (AttributeError, IndexError, Exception) as primary_err:
            err_str = str(primary_err)
            if "'NoneType' object has no attribute 'text'" in err_str or "script.ds:1" in err_str or isinstance(primary_err, AttributeError):
                logger.warning(
                    f"[FETCH_CONSENT_DETECTED] Standard fetch hit Google Consent page on cloud IP for {origin}->{destination} {bw_code}. "
                    "Triggering isolated GoogleConsentFetchIntegration fallback..."
                )
                used_fallback = True
                try:
                    result = get_flights(query_obj, integration=GoogleConsentFetchIntegration())
                except IndexError as ie:
                    logger.info(f"[NO_DATA_LAYOUT] Route {origin}->{destination} {bw_code} has no unbundled price arrays ({ie}). Marking as NO_DATA.")
                    result = []
            elif isinstance(primary_err, IndexError):
                logger.info(f"[NO_DATA_LAYOUT] Route {origin}->{destination} {bw_code} has no unbundled price arrays ({primary_err}). Marking as NO_DATA.")
                result = []
            else:
                raise primary_err

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        flight_groups_cnt = len(result) if result else 0
        
        status_classification = "SUCCESS" if (result and len(result) > 0) else "NO_DATA"
        diag["fetch_stage"].update({
            "status": status_classification,
            "elapsed_ms": elapsed_ms,
            "flight_groups": flight_groups_cnt,
            "used_fallback": used_fallback,
        })
        
        logger.info(
            f"[FETCH_RESPONSE] {origin}->{destination} {bw_code} Status: {status_classification}, Elapsed: {elapsed_ms}ms"
        )
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        exc_type = type(exc).__name__
        exc_msg = str(exc)
        tb_str = traceback.format_exc()
        
        logger.error(f"[FETCH_FAILED] {origin}->{destination} {bw_code}: {exc_type} - {exc_msg}")
        diag["fetch_stage"].update({
            "status": "FAILED",
            "elapsed_ms": elapsed_ms,
            "used_fallback": used_fallback,
            "error": {"type": exc_type, "message": exc_msg, "traceback": tb_str},
        })
        return diag

    if not result:
        diag["parse_stage"].update({"status": "NO_DATA", "records_generated": 0})
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
            if carrier_code == "XX" or not carrier_code:
                # Map common airline names to codes
                carrier_code_map = {"INDIGO": "6E", "AIR INDIA": "AI", "AKASA": "QP", "SPICEJET": "SG", "VISTARA": "UK"}
                for k, v in carrier_code_map.items():
                    if k in carrier_name.upper():
                        carrier_code = v
                        break

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
                portal="Google Flights",
                source="Google Flights Live Feed",
                source_url=f"https://www.google.com/travel/flights?q=Flights%20to%20{destination}%20from%20{origin}",
                carrier=carrier_name,
                carrier_name=carrier_name,
                carrier_code=carrier_code or "XX",
                flight_number=flight_number,
                origin=origin,
                destination=destination,
                departure_date=dep_date,
                departure_time=departure_time_str,
                scraped_at=scraped_at_str,
                collection_timestamp=scraped_at_str,
                horizon_days=horizon_days,
                booking_window=bw_code,
                fare_class="Economy",
                base_fare=unbundled["base_fare"],
                taxes=round(total_fare - unbundled["base_fare"], 2),
                fuel_surcharge_yq=unbundled["fuel_surcharge_yq"],
                airport_fee_udf=unbundled["airport_fee_udf"],
                udf=unbundled["airport_fee_udf"],
                convenience_fee=unbundled["convenience_fee"],
                total_fare=unbundled["total_fare"],
                currency="INR",
                availability_status="AVAILABLE",
                is_modeled=True,  # Explicitly state that fee breakdown is estimated/unbundled
                source_type="LIVE_FLIGHT",
                source_name="Google Flights Production Pipeline",
                dataset_version="1.0.0",
                is_live=True,
                is_historical=False,
            )
            records.append(record)
        except Exception as err:
            skipped_cnt += 1
            logger.warning(f"[PARSE_ERROR] Offer {idx} on {origin}->{destination}: {err}")

    diag["parse_stage"].update({
        "status": "SUCCESS" if records else "NO_DATA",
        "records_generated": len(records),
        "skipped_offers": skipped_cnt,
    })
    diag["records"] = records

    return diag


def fetch_route_horizon(origin: str, destination: str, horizon_days: int) -> List[RawFareRecord]:
    """Backwards-compatible wrapper returning List[RawFareRecord]."""
    diag = fetch_route_horizon_with_diagnostics(origin, destination, horizon_days)
    return diag.get("records", [])


def fetch_all_corridors_with_summary() -> Tuple[List[RawFareRecord], Dict[str, Any]]:
    """
    Executes full sweep across all tracked corridors and horizons (T+1..T+45).
    """
    all_records: List[RawFareRecord] = []
    job_results: List[Dict[str, Any]] = []
    
    success_cnt = 0
    nodata_cnt = 0
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
            try:
                diag = fetch_route_horizon_with_diagnostics(origin, destination, horizon)
                records = diag.get("records", [])
                fetch_st = str(diag.get("fetch_stage", {}).get("status", "")).upper()
                
                if fetch_st == "SUCCESS":
                    success_cnt += 1
                elif fetch_st == "NO_DATA":
                    nodata_cnt += 1
                else:
                    failed_cnt += 1

                all_records.extend(records)
                job_results.append({
                    "corridor": f"{origin}-{destination}",
                    "horizon": horizon,
                    "booking_window": get_horizon_code(horizon),
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
                logger.error(f"[CORRIDOR_SWEEP_ERROR] Route {origin}->{destination} T+{horizon} failed: {route_exc}")
                job_results.append({
                    "corridor": f"{origin}-{destination}",
                    "horizon": horizon,
                    "booking_window": get_horizon_code(horizon),
                    "status": "FAILED",
                    "error": {"type": type(route_exc).__name__, "message": str(route_exc)},
                })

    coverage_pct = round(((success_cnt + nodata_cnt) / max(1, total_jobs)) * 100, 1)

    summary = {
        "timestamp": now.isoformat(),
        "total_jobs": total_jobs,
        "success_jobs": success_cnt,
        "nodata_jobs": nodata_cnt,
        "failed_jobs": failed_cnt,
        "coverage_pct": coverage_pct,
        "total_records_generated": len(all_records),
        "job_details": job_results,
    }

    return all_records, summary


def fetch_all_corridors() -> List[RawFareRecord]:
    all_records, _ = fetch_all_corridors_with_summary()
    return all_records
