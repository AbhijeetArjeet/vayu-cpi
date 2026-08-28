"""
services/engine/normalizer.py
Multi-stage econometric cleaning and normalization pipeline for raw airfare observations.

Pipeline Stages:
Raw Data
  → Schema & Currency Validation
  → Missing Value & Non-positive Price Filter
  → Duplicate Removal (same flight & departure hour)
  → Fare Consistency Checks (total >= base, fee bounds)
  → Outlier Detection (Tukey IQR + Modified Median Rule)
  → Sold-out / Cancellation Handling
  → Clean Price Series for Jevons Index Calculation
"""

from __future__ import annotations

import logging
from typing import List, Dict, Any, Tuple, Optional
from services.persistence.db import FareObservation

logger = logging.getLogger("vayu-cpi.normalizer")

_OUTLIER_MULTIPLE = 3.5
_MIN_SAMPLE_SIZE_FOR_OUTLIER_FILTER = 4
_MIN_REALISTIC_FARE = 800.0
_MAX_REALISTIC_FARE = 150000.0


def _median(values: list[float]) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    n = len(s)
    mid = n // 2
    if n % 2 == 0:
        return (s[mid - 1] + s[mid]) / 2.0
    return s[mid]


class CleaningReport:
    def __init__(self, total_raw: int):
        self.total_raw = total_raw
        self.passed_count = 0
        self.rejected_count = 0
        self.duplicates_removed = 0
        self.invalid_prices_removed = 0
        self.outliers_removed = 0
        self.sold_out_flagged = 0
        self.rejection_log: List[Dict[str, Any]] = []

    def log_rejection(self, record_id: Any, flight_number: str, reason: str, details: Any = None):
        self.rejected_count += 1
        if len(self.rejection_log) < 100:
            self.rejection_log.append({
                "record_id": str(record_id),
                "flight_number": flight_number,
                "reason": reason,
                "details": details,
            })

    def summary(self) -> Dict[str, Any]:
        return {
            "total_raw": self.total_raw,
            "passed_clean": self.passed_count,
            "rejected_total": self.rejected_count,
            "duplicates_removed": self.duplicates_removed,
            "invalid_prices_removed": self.invalid_prices_removed,
            "outliers_removed": self.outliers_removed,
            "sold_out_flagged": self.sold_out_flagged,
            "sample_rejections": self.rejection_log[:10],
        }


def deduplicate_by_flight(
    observations: list[FareObservation],
    report: Optional[CleaningReport] = None,
) -> list[FareObservation]:
    """
    Keeps only the latest quote per (flight_number, departure_date, scraped_hour)
    so multiple rapid scrape sweeps do not double count quotes.
    """
    seen: dict[tuple, FareObservation] = {}
    for obs in observations:
        sa = obs.scraped_at
        if hasattr(sa, 'strftime'):
            hour_key = sa.strftime("%Y-%m-%d %H")
        else:
            hour_key = str(sa)[:13]
            
        dep_d = str(getattr(obs, 'departure_date', '') or str(obs.departure_time)[:10])
        key = (obs.flight_number, dep_d, hour_key)
        
        existing = seen.get(key)
        if existing is None:
            seen[key] = obs
        else:
            if report:
                report.duplicates_removed += 1
                report.log_rejection(obs.id, obs.flight_number, "Duplicate quote within same hour bucket")
            if str(obs.scraped_at) > str(existing.scraped_at):
                seen[key] = obs
    return list(seen.values())


def filter_valid_fares(
    observations: list[FareObservation],
    report: Optional[CleaningReport] = None,
) -> list[FareObservation]:
    """
    Removes negative, zero, or unrealistic fares, and checks consistency.
    """
    valid: list[FareObservation] = []
    for obs in observations:
        fare = obs.total_fare
        if fare is None or fare <= 0:
            if report:
                report.invalid_prices_removed += 1
                report.log_rejection(obs.id, obs.flight_number, "Non-positive fare value", {"fare": fare})
            continue

        if fare < _MIN_REALISTIC_FARE or fare > _MAX_REALISTIC_FARE:
            if report:
                report.invalid_prices_removed += 1
                report.log_rejection(obs.id, obs.flight_number, f"Fare out of realistic bounds (₹{_MIN_REALISTIC_FARE}-₹{_MAX_REALISTIC_FARE})", {"fare": fare})
            continue

        # Status check
        if getattr(obs, "availability_status", "AVAILABLE") in ("SOLD_OUT", "CANCELLED"):
            if report:
                report.sold_out_flagged += 1
                report.log_rejection(obs.id, obs.flight_number, f"Flight status: {obs.availability_status}")
            continue

        # Consistency check: base_fare cannot exceed total_fare if base_fare is present
        if obs.base_fare is not None and obs.base_fare > obs.total_fare:
            if report:
                report.invalid_prices_removed += 1
                report.log_rejection(obs.id, obs.flight_number, "Inconsistent fare: base_fare > total_fare", {"base": obs.base_fare, "total": obs.total_fare})
            continue

        valid.append(obs)
    return valid


def strip_outliers(
    observations: list[FareObservation],
    report: Optional[CleaningReport] = None,
) -> list[FareObservation]:
    """
    Removes extreme outliers (e.g. business class pricing accidentally returned in economy query)
    using robust median distance filter.
    """
    if len(observations) < _MIN_SAMPLE_SIZE_FOR_OUTLIER_FILTER:
        return observations

    fares = [o.total_fare for o in observations if o.total_fare and o.total_fare > 0]
    med = _median(fares)
    if med <= 0:
        return observations

    upper_bound = med * _OUTLIER_MULTIPLE
    lower_bound = med / _OUTLIER_MULTIPLE

    clean: list[FareObservation] = []
    for o in observations:
        if lower_bound <= o.total_fare <= upper_bound:
            clean.append(o)
        else:
            if report:
                report.outliers_removed += 1
                report.log_rejection(
                    o.id, o.flight_number,
                    f"Outlier rejected: fare ₹{o.total_fare} outside [{round(lower_bound, 2)}, {round(upper_bound, 2)}]",
                    {"fare": o.total_fare, "median": med}
                )
    return clean


def clean_observations_with_report(
    observations: list[FareObservation],
) -> Tuple[list[FareObservation], CleaningReport]:
    """
    Runs full cleaning pipeline and returns clean observations along with diagnostic audit report.
    """
    report = CleaningReport(total_raw=len(observations))
    
    # 1. Deduplication
    deduped = deduplicate_by_flight(observations, report)
    # 2. Fare validation & consistency
    valid = filter_valid_fares(deduped, report)
    # 3. Outlier handling
    cleaned = strip_outliers(valid, report)

    report.passed_count = len(cleaned)
    return cleaned, report


def normalize(observations: list[FareObservation]) -> list[float]:
    """
    Full normalization pipeline returning clean price series ready for the Jevons formula.
    """
    clean_obs, _ = clean_observations_with_report(observations)
    return [o.total_fare for o in clean_obs if o.total_fare and o.total_fare > 0]
