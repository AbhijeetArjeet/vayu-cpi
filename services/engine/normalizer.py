"""
services/engine/normalizer.py
Normalizes raw fare observations before they enter the index
calculation: deduplicates same-flight quotes within a scrape window,
strips implausible outliers (parsing errors, placeholder prices), and
produces the clean price series each index formula consumes.
"""

from __future__ import annotations

from services.persistence.db import FareObservation

# A fare more than this many times the median of its own sample is
# almost always a parsing artifact (e.g. business-class price mixed into
# an economy query), not a real signal -- drop rather than let it
# distort a geometric mean the whole corridor's index depends on.
_OUTLIER_MULTIPLE = 4.0
_MIN_SAMPLE_SIZE_FOR_OUTLIER_FILTER = 4


def _median(values: list[float]) -> float:
    s = sorted(values)
    n = len(s)
    mid = n // 2
    if n % 2 == 0:
        return (s[mid - 1] + s[mid]) / 2
    return s[mid]


def deduplicate_by_flight(
    observations: list[FareObservation],
) -> list[FareObservation]:
    """Keeps only the most recent quote per (flight_number, scraped hour)
    so a single flight sampled multiple times in one sweep doesn't get
    double-counted in the geometric mean."""
    seen: dict[tuple, FareObservation] = {}
    for obs in observations:
        key = (obs.flight_number, obs.scraped_at.strftime("%Y-%m-%d %H"))
        existing = seen.get(key)
        if existing is None or obs.scraped_at > existing.scraped_at:
            seen[key] = obs
    return list(seen.values())


def strip_outliers(observations: list[FareObservation]) -> list[FareObservation]:
    """Removes fares that are implausibly far from the sample median.
    Skipped entirely for small samples, where a "median" isn't a
    reliable enough reference point to justify dropping data."""
    if len(observations) < _MIN_SAMPLE_SIZE_FOR_OUTLIER_FILTER:
        return observations

    fares = [o.total_fare for o in observations]
    med = _median(fares)
    if med <= 0:
        return observations

    return [
        o
        for o in observations
        if o.total_fare <= med * _OUTLIER_MULTIPLE
        and o.total_fare >= med / _OUTLIER_MULTIPLE
    ]


def normalize(observations: list[FareObservation]) -> list[float]:
    """Full normalization pipeline: dedupe -> outlier strip -> return
    the clean list of total_fare values ready for the Jevons formula."""
    deduped = deduplicate_by_flight(observations)
    cleaned = strip_outliers(deduped)
    return [o.total_fare for o in cleaned]
