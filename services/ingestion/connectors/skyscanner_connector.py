"""
services/ingestion/connectors/skyscanner_connector.py
Skyscanner-Sourced Flight Fare API Connector (via RapidAPI).

Purpose:
Provides an independent, legitimate Skyscanner-sourced flight price feed
(via a RapidAPI marketplace wrapper) used exclusively for cross-validation
benchmarking against the primary Google Flights feed.

Provenance & Transparency:
- This wraps Skyscanner's aggregated marketplace feed (which itself aggregates airlines/OTAs).
- It is NOT a direct scraper of skyscanner.com (no browser automation/anti-bot evasion).
- It is NOT the official Skyscanner partner commercial API.
- All records are tagged with:
    portal="Skyscanner (via RapidAPI)"
    source="Skyscanner Aggregated Feed"
    source_type="LIVE_FLIGHT"
    is_ota_direct=False

Configuration:
- Env Var: `SKYSCANNER_API_KEY` or `RAPIDAPI_KEY` (Required for live API calls; fails closed if missing)
- Env Var: `SKYSCANNER_API_HOST` (Default: 'sky-scrapper.p.rapidapi.com')
- Daily Quota Cap: Controlled via `SKYSCANNER_API_DAILY_LIMIT` (Default: 10 requests/day to protect free-tier allowance)

Ethical & Free-Tier Guardrails:
- Rate limit delay: 3.0s between outbound HTTP calls
- Strictly capped daily query budget
- Fail-closed: returns [] without error when credentials are not configured
"""

from __future__ import annotations

import os
import json
import logging
import urllib.request
import urllib.error
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any

from core.schemas import RawFareRecord
from core.dgca_weights import get_horizon_code
from services.ingestion.connectors.base import BaseConnector
from services.ingestion.unbundler import unbundle_fare

logger = logging.getLogger("vayu-cpi.connectors.skyscanner")


class SkyscannerConnector(BaseConnector):
    """
    Legitimate free-tier RapidAPI wrapper connector for Skyscanner aggregated flight data.
    Used exclusively as an independent cross-validation benchmark feed.
    """

    DEFAULT_HOST = "sky-scrapper.p.rapidapi.com"

    def __init__(self):
        super().__init__(
            name="SkyscannerConnector",
            carrier_code="SKYSCANNER",
            is_ota=True,
            rate_limit_delay_sec=3.0,
            respect_robots_txt=True,
        )
        self.api_key = (
            os.getenv("SKYSCANNER_API_KEY", "").strip()
            or os.getenv("RAPIDAPI_KEY", "").strip()
        )
        self.api_host = os.getenv("SKYSCANNER_API_HOST", self.DEFAULT_HOST).strip()
        self.daily_limit = int(os.getenv("SKYSCANNER_API_DAILY_LIMIT", "10"))
        self._daily_call_counts: Dict[str, int] = {}

    def _can_make_request_today(self) -> bool:
        """Checks whether today's quota limit has been reached."""
        today_str = date.today().isoformat()
        current_count = self._daily_call_counts.get(today_str, 0)
        return current_count < self.daily_limit

    def _record_request_today(self) -> None:
        today_str = date.today().isoformat()
        self._daily_call_counts[today_str] = self._daily_call_counts.get(today_str, 0) + 1

    def get_quota_status(self) -> Dict[str, Any]:
        """Returns current daily quota usage metrics."""
        today_str = date.today().isoformat()
        used = self._daily_call_counts.get(today_str, 0)
        return {
            "is_configured": bool(self.api_key),
            "api_host": self.api_host,
            "today_used": used,
            "daily_limit": self.daily_limit,
            "remaining": max(0, self.daily_limit - used),
            "feed_type": "Skyscanner Aggregated (RapidAPI Wrapper)",
        }

    def fetch_quotes(
        self,
        origin: str,
        destination: str,
        horizon_days: int,
        departure_date: Optional[str] = None,
    ) -> List[RawFareRecord]:
        """
        Fetches live flight quotes from Skyscanner via RapidAPI for cross-validation.
        Fails closed gracefully if credentials are not configured or quota is exhausted.
        """
        if not self.api_key:
            logger.debug(
                "[SkyscannerConnector] SKYSCANNER_API_KEY / RAPIDAPI_KEY not set. Skyscanner cross-validation feed skipped."
            )
            return []

        if not self._can_make_request_today():
            logger.warning(
                f"[SkyscannerConnector] Daily quota limit of {self.daily_limit} reached for {date.today().isoformat()}. Skipping call."
            )
            return []

        self.enforce_rate_limit()

        now = datetime.now()
        dep_date = departure_date or (now + timedelta(days=horizon_days)).strftime("%Y-%m-%d")
        bw_code = get_horizon_code(horizon_days)

        # Standard RapidAPI Skyscanner endpoint format
        url = (
            f"https://{self.api_host}/api/v1/flights/searchFlights"
            f"?originSkyId={origin.upper()}&destinationSkyId={destination.upper()}"
            f"&date={dep_date}&currency=INR&cabinClass=economy&adults=1"
        )

        if not self.check_ethical_compliance(url):
            return []

        logger.info(f"[SkyscannerConnector] Querying {origin}->{destination} {bw_code} on {dep_date} via {self.api_host}")
        records: List[RawFareRecord] = []

        try:
            req = urllib.request.Request(
                url,
                headers={
                    "x-rapidapi-key": self.api_key,
                    "x-rapidapi-host": self.api_host,
                    "User-Agent": "VAYU-CPI Skyscanner Cross-Validation Client/1.0 (MoSPI SIH Research)",
                    "Accept": "application/json",
                },
            )

            self._record_request_today()

            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status != 200:
                    logger.warning(f"[SkyscannerConnector] Received HTTP status {response.status} from {self.api_host}.")
                    return []

                raw_body = response.read().decode("utf-8")
                payload = json.loads(raw_body)

                # Parse multiple standard Skyscanner/RapidAPI response formats
                # Case A: Sky-Scrapper payload format (data -> itineraries)
                itineraries = []
                if isinstance(payload, dict):
                    data_block = payload.get("data")
                    if isinstance(data_block, dict):
                        itineraries = data_block.get("itineraries") or []
                    elif isinstance(data_block, list):
                        itineraries = data_block
                    elif "results" in payload:
                        itineraries = payload.get("results") or []
                    elif "flights" in payload:
                        itineraries = payload.get("flights") or []

                for idx, item in enumerate(itineraries[:15]):
                    try:
                        price_val = 0.0
                        # Try parsing price object or direct scalar
                        price_obj = item.get("price")
                        if isinstance(price_obj, dict):
                            raw_raw_price = price_obj.get("raw") or price_obj.get("amount") or price_obj.get("value")
                            price_val = float(raw_raw_price or 0.0)
                        elif isinstance(price_obj, (int, float)):
                            price_val = float(price_obj)
                        elif "total_fare" in item:
                            price_val = float(item["total_fare"])
                        elif "fare" in item:
                            price_val = float(item["fare"])

                        if price_val <= 0.0 or price_val > 150000.0:
                            continue

                        # Extract carrier / flight details
                        airline_name = "Skyscanner Carrier"
                        flight_no = f"SKYS-{idx+1}"
                        carrier_code = "SK"

                        legs = item.get("legs") or []
                        if isinstance(legs, list) and len(legs) > 0 and isinstance(legs[0], dict):
                            leg = legs[0]
                            carriers_obj = leg.get("carriers") or {}
                            marketing = carriers_obj.get("marketing") if isinstance(carriers_obj, dict) else None
                            if isinstance(marketing, list) and len(marketing) > 0 and isinstance(marketing[0], dict):
                                airline_name = marketing[0].get("name") or airline_name
                                carrier_code = marketing[0].get("alternateId") or marketing[0].get("id") or carrier_code
                            elif isinstance(carriers_obj, list) and len(carriers_obj) > 0:
                                if isinstance(carriers_obj[0], dict):
                                    airline_name = carriers_obj[0].get("name") or airline_name
                            segments = leg.get("segments") or []
                            if isinstance(segments, list) and len(segments) > 0 and isinstance(segments[0], dict):
                                flight_no = segments[0].get("flightNumber") or flight_no

                        elif "airline" in item:
                            airline_name = str(item["airline"])
                        elif "carrier" in item:
                            airline_name = str(item["carrier"])

                        unbundled = unbundle_fare(price_val, origin, destination)

                        record = RawFareRecord(
                            portal="Skyscanner (via RapidAPI)",
                            source="Skyscanner Aggregated Feed",
                            source_url=url,
                            carrier=airline_name,
                            carrier_name=airline_name,
                            carrier_code=str(carrier_code)[:4].upper(),
                            flight_number=str(flight_no),
                            origin=origin.upper(),
                            destination=destination.upper(),
                            departure_date=dep_date,
                            departure_time=f"{dep_date} 12:00:00",
                            scraped_at=now.isoformat(),
                            collection_timestamp=now.isoformat(),
                            horizon_days=horizon_days,
                            booking_window=bw_code,
                            fare_class="Economy",
                            base_fare=unbundled["base_fare"],
                            taxes=round(price_val - unbundled["base_fare"], 2),
                            fuel_surcharge_yq=unbundled["fuel_surcharge_yq"],
                            airport_fee_udf=unbundled["airport_fee_udf"],
                            udf=unbundled["airport_fee_udf"],
                            convenience_fee=unbundled["convenience_fee"],
                            total_fare=price_val,
                            currency="INR",
                            availability_status="AVAILABLE",
                            is_modeled=True,
                            source_type="LIVE_FLIGHT",
                            source_name="RapidAPI Skyscanner Cross-Validation Connector",
                            dataset_version="1.0.0",
                            is_live=True,
                            is_historical=False,
                            is_ota_direct=False,
                        )
                        records.append(record)
                    except (ValueError, TypeError, KeyError) as parse_err:
                        logger.debug(f"[SkyscannerConnector] Skipping record index {idx}: {parse_err}")
                        continue

            logger.info(f"[SkyscannerConnector] Retrieved {len(records)} quotes for {origin}->{destination}")
            return records

        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as net_err:
            logger.warning(f"[SkyscannerConnector] Query failed for {origin}->{destination}: {net_err}")
            return []
        except Exception as err:
            logger.warning(f"[SkyscannerConnector] Unexpected error during fetch: {err}")
            return []
