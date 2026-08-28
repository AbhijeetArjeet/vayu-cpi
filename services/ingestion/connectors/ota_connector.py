"""
services/ingestion/connectors/ota_connector.py
OTA / Meta-search connector interfacing with Google Flights and Amadeus GDS.
Implements ethical pacing, error isolation, and schema normalization.
"""

from __future__ import annotations

import logging
import time
import re
from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict

from core.schemas import RawFareRecord
from core.dgca_weights import get_horizon_code
from services.ingestion.connectors.base import BaseConnector

logger = logging.getLogger("vayu-cpi.connectors.ota")


class OTAConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="OTA/GoogleFlightsConnector",
            carrier_code="OTA",
            is_ota=True,
            rate_limit_delay_sec=1.5,
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
        
        from services.ingestion.live_fetcher import fetch_route_horizon
        try:
            records = fetch_route_horizon(origin, destination, horizon_days)
            return records
        except Exception as e:
            logger.warning(f"[OTAConnector] Fetch failed for {origin}->{destination} T+{horizon_days}: {e}")
            return []
