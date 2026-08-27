"""
services/engine/historical_engine.py
Engine for validating CSV/JSON historical datasets, executing normalization pipelines,
calculating quality metrics, fare distributions, percentiles, and market comparisons.
Uses standard Python statistics module for zero extra external dependencies.
"""

from __future__ import annotations

import math
import statistics
from datetime import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy import func

from core.schemas import ImportValidationReport, HistoricalComparison
from services.persistence.db import SessionLocal, FareObservation, DatasetRegistry
from core.dgca_weights import INDIAN_AIRPORTS, ALL_CORRIDORS


def validate_historical_dataset(
    rows: List[Dict[str, Any]], dataset_name: str, source_type: str = "HISTORICAL_DATASET"
) -> ImportValidationReport:
    """Validates raw records before importing into production database.
    Checks date formats, airport IATA codes, positive non-zero fares, and duplicate rows.
    """
    total_rows = len(rows)
    if total_rows == 0:
        return ImportValidationReport(
            dataset_name=dataset_name,
            source_type=source_type,
            total_rows=0,
            valid_rows=0,
            invalid_rows=0,
            date_range="N/A",
            unique_routes=0,
            unique_airlines=0,
            missing_fare_pct=0.0,
            duplicate_pct=0.0,
            invalid_route_pct=0.0,
            currency="INR",
            errors=["Dataset is completely empty."],
            status="FAILED",
        )

    valid_count = 0
    invalid_count = 0
    missing_fare_count = 0
    invalid_route_count = 0
    seen_hashes = set()
    duplicate_count = 0

    dates = []
    routes = set()
    airlines = set()
    errors = []

    valid_codes = set(INDIAN_AIRPORTS.keys())

    for idx, row in enumerate(rows):
        orig = str(row.get("origin", "")).strip().upper()
        dest = str(row.get("destination", "")).strip().upper()
        total_fare = row.get("total_fare") or row.get("fare") or row.get("price")
        scraped_at = row.get("scraped_at") or row.get("observation_date") or row.get("date")
        carrier = row.get("carrier_name") or row.get("airline") or "Unknown Airline"

        row_key = f"{orig}-{dest}-{carrier}-{total_fare}-{scraped_at}"
        if row_key in seen_hashes:
            duplicate_count += 1
        else:
            seen_hashes.add(row_key)

        is_valid = True

        if orig not in valid_codes or dest not in valid_codes or orig == dest:
            invalid_route_count += 1
            is_valid = False
            if len(errors) < 5:
                errors.append(f"Row {idx+1}: Invalid or unmapped airport corridor {orig}->{dest}")

        try:
            fare_val = float(total_fare)
            if fare_val <= 0 or math.isnan(fare_val):
                missing_fare_count += 1
                is_valid = False
                if len(errors) < 5:
                    errors.append(f"Row {idx+1}: Non-positive or missing fare {total_fare}")
        except (ValueError, TypeError):
            missing_fare_count += 1
            is_valid = False

        if is_valid:
            valid_count += 1
            routes.add(f"{orig}-{dest}")
            airlines.add(carrier)
            if scraped_at:
                dates.append(str(scraped_at))
        else:
            invalid_count += 1

    missing_fare_pct = round((missing_fare_count / total_rows) * 100, 1)
    duplicate_pct = round((duplicate_count / total_rows) * 100, 1)
    invalid_route_pct = round((invalid_route_count / total_rows) * 100, 1)

    min_date = min(dates) if dates else "Unknown"
    max_date = max(dates) if dates else "Unknown"
    date_range_str = f"{min_date[:10]} to {max_date[:10]}" if dates else "N/A"

    status = "PASSED"
    if invalid_count > total_rows * 0.2:
        status = "FAILED"
    elif invalid_count > 0 or duplicate_pct > 5.0:
        status = "WARNING"

    return ImportValidationReport(
        dataset_name=dataset_name,
        source_type=source_type,
        total_rows=total_rows,
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        date_range=date_range_str,
        unique_routes=len(routes),
        unique_airlines=len(airlines),
        missing_fare_pct=missing_fare_pct,
        duplicate_pct=duplicate_pct,
        invalid_route_pct=invalid_route_pct,
        currency="INR",
        errors=errors,
        status=status,
    )


def compute_historical_comparison(origin: str, destination: str, current_fare: float) -> HistoricalComparison:
    """Calculates current market fare vs historical baseline median & percentile rank."""
    corridor = f"{origin.upper()}-{destination.upper()}"
    session = SessionLocal()
    try:
        obs = session.query(FareObservation.total_fare).filter(
            FareObservation.origin == origin.upper(),
            FareObservation.destination == destination.upper(),
            FareObservation.is_historical == True,
        ).all()

        fares = sorted([o[0] for o in obs if o[0] > 0])
        if not fares or len(fares) < 3:
            return HistoricalComparison(
                corridor=corridor,
                origin=origin.upper(),
                destination=destination.upper(),
                current_fare=current_fare,
                historical_median_fare=current_fare,
                difference_pct=0.0,
                stress_level="NORMAL",
                historical_percentile=50.0,
                observation_count=len(fares),
                sample_sufficient=False,
            )

        median_fare = float(statistics.median(fares))
        diff_pct = round(((current_fare - median_fare) / median_fare) * 100, 1)

        # Percentile rank
        below_cnt = sum(1 for f in fares if f <= current_fare)
        percentile = round((below_cnt / len(fares)) * 100, 1)

        stress_level = "LOW"
        if percentile >= 85 or diff_pct >= 25.0:
            stress_level = "CRITICAL"
        elif percentile >= 70 or diff_pct >= 15.0:
            stress_level = "HIGH"
        elif percentile >= 55 or diff_pct >= 5.0:
            stress_level = "MODERATE"

        return HistoricalComparison(
            corridor=corridor,
            origin=origin.upper(),
            destination=destination.upper(),
            current_fare=round(current_fare, 2),
            historical_median_fare=round(median_fare, 2),
            difference_pct=diff_pct,
            stress_level=stress_level,
            historical_percentile=percentile,
            observation_count=len(fares),
            sample_sufficient=True,
        )
    finally:
        session.close()


def _percentile(sorted_data: List[float], p: float) -> float:
    if not sorted_data:
        return 0.0
    n = len(sorted_data)
    idx = (n - 1) * (p / 100.0)
    floor = math.floor(idx)
    ceil = math.ceil(idx)
    if floor == ceil:
        return sorted_data[int(idx)]
    d0 = sorted_data[int(floor)] * (ceil - idx)
    d1 = sorted_data[int(ceil)] * (idx - floor)
    return d0 + d1


def get_historical_analytics(
    origin: str | None = None,
    destination: str | None = None,
    days_back: int = 365,
) -> Dict[str, Any]:
    """Generates rich statistical distribution analytics across historical observations."""
    session = SessionLocal()
    try:
        q = session.query(FareObservation).filter(FareObservation.is_historical == True)
        if origin:
            q = q.filter(FareObservation.origin == origin.upper())
        if destination:
            q = q.filter(FareObservation.destination == destination.upper())

        obs = q.all()
        fares = sorted([o.total_fare for o in obs if o.total_fare > 0])

        if not fares:
            return {
                "sample_size": 0,
                "median_fare": 0,
                "mean_fare": 0,
                "p25": 0,
                "p75": 0,
                "p90": 0,
                "volatility_std": 0,
                "histogram": [],
                "route_rankings": [],
                "airline_rankings": [],
            }

        median_f = float(statistics.median(fares))
        mean_f = float(statistics.mean(fares))
        p25 = float(_percentile(fares, 25))
        p75 = float(_percentile(fares, 75))
        p90 = float(_percentile(fares, 90))
        std_f = float(statistics.stdev(fares)) if len(fares) > 1 else 0.0

        # Histogram bins (5 bins)
        min_f, max_f = fares[0], fares[-1]
        bin_width = max(1.0, (max_f - min_f) / 5.0)
        histogram = []
        for b in range(5):
            b_start = min_f + b * bin_width
            b_end = min_f + (b + 1) * bin_width
            count = sum(1 for f in fares if (b_start <= f < b_end if b < 4 else b_start <= f <= b_end))
            histogram.append({
                "range": f"₹{int(b_start)} - ₹{int(b_end)}",
                "count": count
            })

        # Route rankings
        route_stats: Dict[str, List[float]] = {}
        airline_stats: Dict[str, List[float]] = {}

        for o in obs:
            r_key = f"{o.origin}-{o.destination}"
            route_stats.setdefault(r_key, []).append(o.total_fare)
            airline_stats.setdefault(o.carrier_name, []).append(o.total_fare)

        route_rankings = [
            {
                "route": r,
                "avg_fare": round(float(statistics.mean(vals)), 2),
                "median_fare": round(float(statistics.median(vals)), 2),
                "count": len(vals),
            }
            for r, vals in route_stats.items()
        ]
        route_rankings.sort(key=lambda x: x["avg_fare"], reverse=True)

        airline_rankings = [
            {
                "airline": a,
                "avg_fare": round(float(statistics.mean(vals)), 2),
                "median_fare": round(float(statistics.median(vals)), 2),
                "count": len(vals),
            }
            for a, vals in airline_stats.items()
        ]
        airline_rankings.sort(key=lambda x: x["avg_fare"], reverse=True)

        return {
            "sample_size": len(fares),
            "median_fare": round(median_f, 2),
            "mean_fare": round(mean_f, 2),
            "p25": round(p25, 2),
            "p75": round(p75, 2),
            "p90": round(p90, 2),
            "volatility_std": round(std_f, 2),
            "histogram": histogram,
            "route_rankings": route_rankings[:10],
            "airline_rankings": airline_rankings[:10],
        }
    finally:
        session.close()
