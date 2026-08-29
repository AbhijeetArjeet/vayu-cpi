"""
services/engine/dgca_reference_data.py
Loader and accessor for estimated 2024 domestic baseline reference data.

⚠️ TRANSPARENCY NOTICE:
- These reference tariffs are analyst baseline estimations based on representative market corridor rates.
- They are NOT from an official published DGCA route-level tariff table (the Indian domestic aviation
  market is deregulated under Rule 135 of Aircraft Rules, 1937; DGCA does not publish open route-level fare feeds).
- Reference File: data/reference/estimated_reference_fares.csv
- Secondary Reference: data/reference/mospi_cpi_transport_reference.csv (MoSPI CPI Transport Sub-Index)
"""

from __future__ import annotations

import csv
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("vayu-cpi.reference-data")

REFERENCE_CSV_PATH = (
    Path(__file__).parent.parent.parent
    / "data"
    / "reference"
    / "estimated_reference_fares.csv"
)

MOSPI_CSV_PATH = (
    Path(__file__).parent.parent.parent
    / "data"
    / "reference"
    / "mospi_cpi_transport_reference.csv"
)

# In-memory cache for reference tariffs
_BENCHMARKS_CACHE: Optional[Dict[str, Dict[str, Any]]] = None
_MOSPI_BENCHMARKS_CACHE: Optional[List[Dict[str, Any]]] = None


def load_dgca_reference_dataset() -> Dict[str, Dict[str, Any]]:
    """
    Loads and parses the estimated domestic baseline reference dataset from CSV.
    Returns a dictionary keyed by corridor (e.g., 'DEL-BOM').
    """
    global _BENCHMARKS_CACHE
    if _BENCHMARKS_CACHE is not None:
        return _BENCHMARKS_CACHE

    benchmarks: Dict[str, Dict[str, Any]] = {}

    if not REFERENCE_CSV_PATH.exists():
        logger.warning(
            f"[REFERENCE_DATA] Reference CSV not found at {REFERENCE_CSV_PATH}."
        )
        return {}

    try:
        with open(REFERENCE_CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(row for row in f if not row.startswith("#"))
            for row in reader:
                corridor = row["corridor"].strip().upper()
                benchmarks[corridor] = {
                    "corridor": corridor,
                    "origin": row["origin"].strip().upper(),
                    "destination": row["destination"].strip().upper(),
                    "distance_km": float(row.get("distance_km", 0.0)),
                    "reference_period": row.get("reference_period", "2024-Q1"),
                    "benchmark_fare_inr": float(row.get("benchmark_fare_inr", 4500.0)),
                    "t1_spot_fare_inr": float(row.get("t1_spot_fare_inr", 6000.0)),
                    "t7_standard_fare_inr": float(row.get("t7_standard_fare_inr", 4500.0)),
                    "t15_fortnight_fare_inr": float(row.get("t15_fortnight_fare_inr", 4140.0)),
                    "t30_advance_fare_inr": float(row.get("t30_advance_fare_inr", 3825.0)),
                    "t45_long_advance_fare_inr": float(row.get("t45_long_advance_fare_inr", 3600.0)),
                    "traffic_share_pct": float(row.get("traffic_share_pct", 1.0)),
                    "source_citation": row.get(
                        "source_citation",
                        "Analyst Baseline Model (Base 2024 Estimated)",
                    ),
                }

        _BENCHMARKS_CACHE = benchmarks
        logger.info(f"[REFERENCE_DATA] Loaded {len(benchmarks)} corridor baselines from {REFERENCE_CSV_PATH.name}")
        return benchmarks
    except Exception as e:
        logger.error(f"[REFERENCE_DATA] Failed to parse reference CSV: {e}")
        return {}


def get_dgca_fare_benchmark(origin: str, destination: str, horizon_days: int) -> float:
    """
    Returns the estimated reference baseline tariff (in INR) for a given corridor and horizon.
    """
    benchmarks = load_dgca_reference_dataset()
    corridor = f"{origin.strip().upper()}-{destination.strip().upper()}"
    
    data = benchmarks.get(corridor)
    if not data:
        base_val = 4500.0
        multiplier = {1: 1.35, 7: 1.00, 15: 0.92, 30: 0.85, 45: 0.80}.get(horizon_days, 1.00)
        return round(base_val * multiplier, 2)

    if horizon_days <= 1:
        return data["t1_spot_fare_inr"]
    elif horizon_days <= 7:
        return data["t7_standard_fare_inr"]
    elif horizon_days <= 15:
        return data["t15_fortnight_fare_inr"]
    elif horizon_days <= 30:
        return data["t30_advance_fare_inr"]
    else:
        return data["t45_long_advance_fare_inr"]


def get_dgca_weighted_baseline_index() -> float:
    """
    Returns national composite baseline index (Base = 100.0).
    """
    return 100.0


def load_mospi_cpi_transport_dataset() -> List[Dict[str, Any]]:
    """
    Loads and parses the illustrative MoSPI CPI Transport Sub-Group monthly index series from CSV.
    """
    global _MOSPI_BENCHMARKS_CACHE
    if _MOSPI_BENCHMARKS_CACHE is not None:
        return _MOSPI_BENCHMARKS_CACHE

    records: List[Dict[str, Any]] = []
    if not MOSPI_CSV_PATH.exists():
        logger.warning(f"[MOSPI_REFERENCE] MoSPI CSV not found at {MOSPI_CSV_PATH}.")
        return records

    try:
        with open(MOSPI_CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(row for row in f if not row.startswith("#"))
            for row in reader:
                records.append({
                    "period": row["period"].strip(),
                    "year": int(row.get("year", 2024)),
                    "month": int(row.get("month", 1)),
                    "cpi_transport_index": float(row.get("cpi_transport_index", 100.0)),
                    "cpi_all_groups_index": float(row.get("cpi_all_groups_index", 100.0)),
                    "air_transport_isp_growth_pct": float(row.get("air_transport_isp_growth_pct", 0.0)),
                    "data_source": row.get("data_source", "MoSPI eSankhyiki Re-indexed Series"),
                })
        _MOSPI_BENCHMARKS_CACHE = records
        logger.info(f"[MOSPI_REFERENCE] Loaded {len(records)} monthly records from {MOSPI_CSV_PATH.name}")
        return records
    except Exception as e:
        logger.error(f"[MOSPI_REFERENCE] Failed to parse MoSPI CSV: {e}")
        return records
