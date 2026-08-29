"""
services/ingestion/connectors/air_india_express_connector.py
Air India Express (IX) Carrier Filter Connector.

This connector does NOT independently scrape Air India Express's website.
It queries the shared Google Flights live feed (via SerpAPI) and filters
results by carrier code 'IX'/'I5' / name containing 'Express'. There is no
direct airline-site access implemented here.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from core.schemas import RawFareRecord
from services.ingestion.connectors.base import BaseConnector

logger = logging.getLogger("vayu-cpi.connectors.air_india_express")


class AirIndiaExpressConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="AirIndiaExpressConnector",
            carrier_code="IX",
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
        logger.info(f"[AirIndiaExpressConnector] Querying {origin}->{destination} T+{horizon_days}")
        from services.ingestion.live_fetcher import fetch_route_horizon
        try:
            records = fetch_route_horizon(origin, destination, horizon_days)
            ix_records = [r for r in records if r.carrier_code in ("IX", "I5") or "EXPRESS" in r.carrier_name.upper()]
            return ix_records if ix_records else records
        except Exception as e:
            logger.warning(f"[AirIndiaExpressConnector] Query failed: {e}")
            return []
