"""
core/timezone.py
Centralized Indian Standard Time (IST / Asia/Kolkata) timezone utility for VAYU-CPI.
Ensures consistent datetime and date handling across servers running in UTC (e.g. Railway, Render, Docker).
"""

from __future__ import annotations

from datetime import datetime, date, timezone
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def now_ist() -> datetime:
    """Returns the current datetime in Asia/Kolkata (IST)."""
    return datetime.now(IST)


def today_ist() -> date:
    """Returns today's date in Asia/Kolkata (IST)."""
    return datetime.now(IST).date()


def iso_now_ist() -> str:
    """Returns current ISO 8601 formatted timestamp string in IST."""
    return datetime.now(IST).isoformat()
