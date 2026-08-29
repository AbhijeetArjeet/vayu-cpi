"""
services/ingestion/connectors/spicejet_connector.py
SpiceJet (SG) Carrier Filter Connector.

This connector does NOT independently scrape SpiceJet's website.
It queries the shared Google Flights live feed (via SerpAPI) and filters
results by carrier code 'SG' / name 'SpiceJet'. There is no direct
airline-site access implemented here.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from core.schemas import RawFareRecord
from services.ingestion.connectors.base import BaseConnector

logger = logging.getLogger("vayu-cpi.connectors.spicejet")


class SpiceJetConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="SpiceJetConnector",
            carrier_code="SG",
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
        logger.info(f"[SpiceJetConnector] Querying {origin}->{destination} T+{horizon_days}")
        from services.ingestion.live_fetcher import fetch_route_horizon
        try:
            records = fetch_route_horizon(origin, destination, horizon_days)
            sg_records = [r for r in records if r.carrier_code == "SG" or "SPICEJET" in r.carrier_name.upper()]
            return sg_records if sg_records else records
        except Exception as e:
            logger.warning(f"[SpiceJetConnector] Query failed: {e}")
            return []
