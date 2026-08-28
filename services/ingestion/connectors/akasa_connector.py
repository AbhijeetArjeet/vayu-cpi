"""
services/ingestion/connectors/akasa_connector.py
Akasa Air (QP) Airline Source Connector.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from core.schemas import RawFareRecord
from services.ingestion.connectors.base import BaseConnector

logger = logging.getLogger("vayu-cpi.connectors.akasa")


class AkasaConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="AkasaConnector",
            carrier_code="QP",
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
        logger.info(f"[AkasaConnector] Querying {origin}->{destination} T+{horizon_days}")
        from services.ingestion.live_fetcher import fetch_route_horizon
        try:
            records = fetch_route_horizon(origin, destination, horizon_days)
            qp_records = [r for r in records if r.carrier_code == "QP" or "AKASA" in r.carrier_name.upper()]
            return qp_records if qp_records else records
        except Exception as e:
            logger.warning(f"[AkasaConnector] Query failed: {e}")
            return []
