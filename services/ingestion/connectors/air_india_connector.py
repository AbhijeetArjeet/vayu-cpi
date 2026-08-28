"""
services/ingestion/connectors/air_india_connector.py
Air India (AI) Airline Source Connector.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from core.schemas import RawFareRecord
from services.ingestion.connectors.base import BaseConnector

logger = logging.getLogger("vayu-cpi.connectors.air_india")


class AirIndiaConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="AirIndiaConnector",
            carrier_code="AI",
            is_ota=False,
            rate_limit_delay_sec=2.0,
            respect_robots_txt=True,
        )

    def fetch_quotes(
        self,
        origin: str,
        destination: str,
        horizon_days: int,
        departure_date: Optional[str] = None,
    ) -> List[RawFareRecord]:
        self.enforce_rate_limit()
        logger.info(f"[AirIndiaConnector] Querying {origin}->{destination} T+{horizon_days}")
        from services.ingestion.live_fetcher import fetch_route_horizon
        try:
            records = fetch_route_horizon(origin, destination, horizon_days)
            ai_records = [r for r in records if r.carrier_code == "AI" or "AIR INDIA" in r.carrier_name.upper()]
            return ai_records if ai_records else records
        except Exception as e:
            logger.warning(f"[AirIndiaConnector] Query failed: {e}")
            return []
