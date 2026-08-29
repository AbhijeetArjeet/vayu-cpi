"""
services/ingestion/connectors/secondary_fare_api_connector.py
Independent Secondary Flight Fare API Connector for Cross-Validation.

Purpose:
Provides an independent live airfare data stream (via RapidAPI / Flight Search API)
used strictly as a cross-validation check against the primary Google Flights feed.

Configuration:
- Env Var: `SECONDARY_FARE_API_KEY` (Required for live API calls; fails closed if missing)
- Env Var: `SECONDARY_FARE_API_HOST` (Default: 'flight-fare-search.p.rapidapi.com')
- Daily Quota Cap: Controlled via `SECONDARY_FARE_API_DAILY_LIMIT` (Default: 20 requests/day)

Ethical & Free-Tier Guardrails:
- Rate limit delay: 3.0s between outbound HTTP calls
- Strictly capped daily query budget to avoid exceeding free-tier allowances
- Fail-soft: returns empty list on network error or missing key without interrupting main pipeline
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

logger = logging.getLogger("vayu-cpi.connectors.secondary_fare_api")


class SecondaryFareAPIConnector(BaseConnector):
    """
    Connector for free-tier secondary flight fare API cross-validation.
    """

    DEFAULT_HOST = "flight-fare-search.p.rapidapi.com"

    def __init__(self):
        super().__init__(
            name="SecondaryFareAPIConnector",
            carrier_code="SEC_API",
            is_ota=True,
            rate_limit_delay_sec=3.0,
            respect_robots_txt=True,
        )
        self.api_key = os.getenv("SECONDARY_FARE_API_KEY", "").strip()
        self.api_host = os.getenv("SECONDARY_FARE_API_HOST", self.DEFAULT_HOST).strip()
        self.daily_limit = int(os.getenv("SECONDARY_FARE_API_DAILY_LIMIT", "20"))
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
        }

    def fetch_quotes(
        self,
        origin: str,
        destination: str,
        horizon_days: int,
        departure_date: Optional[str] = None,
    ) -> List[RawFareRecord]:
        """
        Fetches live flight quotes for cross-validation from the secondary fare API.
        Fails closed gracefully if credentials are not configured or quota is exhausted.
        """
        if not self.api_key:
            logger.debug(
                "[SecondaryFareAPI] SECONDARY_FARE_API_KEY not set. Secondary cross-validation feed skipped."
            )
            return []

        if not self._can_make_request_today():
            logger.warning(
                f"[SecondaryFareAPI] Daily quota limit of {self.daily_limit} reached for {date.today().isoformat()}. Skipping call."
            )
            return []

        self.enforce_rate_limit()

        now = datetime.now()
        dep_date = departure_date or (now + timedelta(days=horizon_days)).strftime("%Y-%m-%d")
        bw_code = get_horizon_code(horizon_days)

        url = f"https://{self.api_host}/v2/flights/search-one-way?from={origin}&to={destination}&date={dep_date}&adults=1&currency=INR"

        if not self.check_ethical_compliance(url):
            return []

        logger.info(f"[SecondaryFareAPI] Querying {origin}->{destination} {bw_code} on {dep_date}")
        records: List[RawFareRecord] = []

        try:
            req = urllib.request.Request(
                url,
                headers={
                    "x-rapidapi-key": self.api_key,
                    "x-rapidapi-host": self.api_host,
                    "User-Agent": "VAYU-CPI Research Cross-Validation Bot/1.0",
                    "Accept": "application/json",
                },
            )

            self._record_request_today()

            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status != 200:
                    logger.warning(f"[SecondaryFareAPI] Received status {response.status} from API.")
                    return []

                raw_body = response.read().decode("utf-8")
                data = json.loads(raw_body)

                # Parse standard flight response formats
                flights_list = data.get("results") or data.get("flights") or data.get("data") or []
                for idx, flight in enumerate(flights_list[:10]):
                    try:
                        price_val = float(flight.get("price") or flight.get("total_fare") or flight.get("fare") or 0.0)
                        if price_val <= 0:
                            continue

                        airline_name = str(flight.get("airline") or flight.get("carrier") or "Secondary Provider")
                        flight_no = str(flight.get("flight_number") or flight.get("flightNumber") or f"SEC-{idx+1}")
                        carrier_code = str(flight.get("carrier_code") or flight_no[:2].upper())

                        unbundled = unbundle_fare(price_val, origin, destination)

                        record = RawFareRecord(
                            portal="Secondary Fare API (RapidAPI)",
                            source="RapidAPI Flight Search Feed",
                            source_url=url,
                            carrier=airline_name,
                            carrier_name=airline_name,
                            carrier_code=carrier_code,
                            flight_number=flight_no,
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
                            source_name="RapidAPI Secondary Cross-Validation Connector",
                            dataset_version="1.0.0",
                            is_live=True,
                            is_historical=False,
                            is_ota_direct=True,
                        )
                        records.append(record)
                    except (ValueError, TypeError, KeyError) as parse_err:
                        continue

            logger.info(f"[SecondaryFareAPI] Retrieved {len(records)} quotes for {origin}->{destination}")
            return records

        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as net_err:
            logger.warning(f"[SecondaryFareAPI] Query failed for {origin}->{destination}: {net_err}")
            return []
        except Exception as err:
            logger.warning(f"[SecondaryFareAPI] Unexpected error during fetch: {err}")
            return []
