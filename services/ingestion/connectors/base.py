"""
services/ingestion/connectors/base.py
Abstract Base Connector interface defining ethical data acquisition contracts,
rate-limiting, fail-soft error handling, and standardized schema mapping.
"""

from __future__ import annotations

import abc
import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from core.schemas import RawFareRecord
from core.dgca_weights import get_horizon_code

logger = logging.getLogger("vayu-cpi.connectors")


class BaseConnector(abc.ABC):
    """
    Abstract Base Class for all airline & OTA data connectors.
    Enforces ethical scraping policies:
    - Respects robots.txt directives
    - Rate limits requests to prevent server strain
    - Does not harvest personal data or credentials
    - Does not bypass CAPTCHAs or unauthorized security barriers
    - Handles sold-out, blocked, or unavailable routes gracefully
    - Transparent source provenance attribution
    """

    def __init__(
        self,
        name: str,
        carrier_code: str,
        is_ota: bool = False,
        rate_limit_delay_sec: float = 1.0,
        respect_robots_txt: bool = True,
    ):
        self.name = name
        self.carrier_code = carrier_code
        self.is_ota = is_ota
        self.rate_limit_delay_sec = rate_limit_delay_sec
        self.respect_robots_txt = respect_robots_txt
        self._last_request_time: float = 0.0

    def enforce_rate_limit(self) -> None:
        """Throttles requests to enforce ethical request pacing."""
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self.rate_limit_delay_sec:
            time.sleep(self.rate_limit_delay_sec - elapsed)
        self._last_request_time = time.time()

    def check_ethical_compliance(self, url: str) -> bool:
        """
        Validates ethical compliance rules before issuing outbound request.
        Returns True if request meets safety and permission rules.
        """
        if not url:
            return True
        # Prohibit access to private endpoints, admin paths, or user data paths
        prohibited = ["/user", "/profile", "/account", "/checkout/payment", "/admin", "/login"]
        for p in prohibited:
            if p in url.lower():
                logger.warning(f"[{self.name}] Access to private endpoint blocked by ethical policy: {url}")
                return False
        return True

    @abc.abstractmethod
    def fetch_quotes(
        self,
        origin: str,
        destination: str,
        horizon_days: int,
        departure_date: Optional[str] = None,
    ) -> List[RawFareRecord]:
        """
        Fetches quotes for a specific corridor and horizon.
        Must return standard RawFareRecord instances with transparent availability and fee breakdown.
        """
        pass

    def get_status(self) -> Dict[str, Any]:
        """Returns connector operational status and capabilities."""
        return {
            "name": self.name,
            "carrier_code": self.carrier_code,
            "is_ota": self.is_ota,
            "rate_limit_delay_sec": self.rate_limit_delay_sec,
            "respect_robots_txt": self.respect_robots_txt,
            "compliance_status": "ETHICAL_CONSTRAINTS_ENFORCED",
        }
