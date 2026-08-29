"""
services/engine/dgca_reference_data.py
Loader and accessor for estimated domestic baseline reference data and real published MoSPI CPI series.

Datasets:
1. `data/reference/estimated_reference_fares.csv` (Estimated 2024 baseline reference fares across 22 corridors)
2. `data/reference/mospi_cpi_transport_real.csv` (Real published MoSPI CPI Transport & Communication, Base 2012=100)
3. `data/reference/mospi_cpi_transport_reference.csv` (Illustrative Base-2024 re-indexed series)
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

MOSPI_REAL_CSV_PATH = (
    Path(__file__).parent.parent.parent
    / "data"
    / "reference"
    / "mospi_cpi_transport_real.csv"
)

# In-memory caches
_BENCHMARKS_CACHE: Optional[Dict[str, Dict[str, Any]]] = None
_MOSPI_BENCHMARKS_CACHE: Optional[List[Dict[str, Any]]] = None
_MOSPI_REAL_CACHE: Optional[List[Dict[str, Any]]] = None


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
        logger.warning(f"[REFERENCE_DATA] Reference CSV not found at {REFERENCE_CSV_PATH}.")
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
    """Returns national composite baseline index (Base = 100.0)."""
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
                    "data_source": row.get("data_source", "MoSPI eSankhyiki Re-indexed Series (Illustrative)"),
                })
        _MOSPI_BENCHMARKS_CACHE = records
        return records
    except Exception as e:
        logger.error(f"[MOSPI_REFERENCE] Failed to parse MoSPI CSV: {e}")
        return records


def load_mospi_cpi_transport_real() -> List[Dict[str, Any]]:
    """
    Loads and parses the REAL published MoSPI CPI Transport & Communication series (Base: 2012 = 100).
    Source: PIB / MoSPI monthly CPI releases.
    """
    global _MOSPI_REAL_CACHE
    if _MOSPI_REAL_CACHE is not None:
        return _MOSPI_REAL_CACHE

    records: List[Dict[str, Any]] = []
    if not MOSPI_REAL_CSV_PATH.exists():
        logger.warning(f"[MOSPI_REAL] Real MoSPI CSV not found at {MOSPI_REAL_CSV_PATH}.")
        return records

    try:
        with open(MOSPI_REAL_CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(row for row in f if not row.startswith("#"))
            for row in reader:
                records.append({
                    "period": row["period"].strip(),
                    "year": int(row.get("year", 2024)),
                    "month": int(row.get("month", 1)),
                    "cpi_transport_rural": float(row.get("cpi_transport_rural", 0.0)),
                    "cpi_transport_urban": float(row.get("cpi_transport_urban", 0.0)),
                    "cpi_transport_combined": float(row.get("cpi_transport_combined", 0.0)),
                    "cpi_general_combined": float(row.get("cpi_general_combined", 0.0)),
                    "base_year": "2012=100",
                    "data_source": row.get("data_source", "MoSPI PIB Monthly CPI Release"),
                })
        _MOSPI_REAL_CACHE = records
        logger.info(f"[MOSPI_REAL] Loaded {len(records)} official Base-2012 monthly records.")
        return records
    except Exception as e:
        logger.error(f"[MOSPI_REAL] Failed to parse real MoSPI CSV: {e}")
        return records


def compute_mospi_trend_comparison() -> Dict[str, Any]:
    """
    Computes a macroeconomic trend comparison between VAYU-CPI national index
    and MoSPI's official published CPI Transport and Communication series (Base 2012=100).
    
    Rebasing Method:
    MoSPI series (Base 2012=100) is rebased to Jan 2024 = 100.0 using:
        Rebased_Index_t = (MoSPI_Combined_t / MoSPI_Combined_Jan2024) * 100.0
    where MoSPI_Combined_Jan2024 = 163.6.
    """
    real_data = load_mospi_cpi_transport_real()
    if not real_data:
        return {
            "status": "UNAVAILABLE",
            "message": "Real MoSPI CPI dataset not loaded.",
            "series": [],
        }

    base_jan2024_val = 163.6  # MoSPI Transport Combined Jan 2024

    comparison_series = []
    for row in real_data:
        raw_combined = row["cpi_transport_combined"]
        rebased_val = round((raw_combined / base_jan2024_val) * 100.0, 2)
        comparison_series.append({
            "period": row["period"],
            "mospi_raw_2012_base": raw_combined,
            "mospi_rebased_2024_base": rebased_val,
            "mospi_urban_raw": row["cpi_transport_urban"],
            "mospi_rural_raw": row["cpi_transport_rural"],
            "headline_cpi_raw": row["cpi_general_combined"],
        })

    return {
        "status": "OFFICIAL_DATA_LOADED",
        "dataset_name": "MoSPI Consumer Price Index — Transport & Communication (Base 2012=100)",
        "source": "Ministry of Statistics and Programme Implementation (MoSPI) & PIB",
        "base_period_original": "2012 = 100.0",
        "rebasing_methodology": "Rebased to Jan 2024 = 100.0 (divisor = 163.6, the published Jan 2024 Combined index)",
        "total_months": len(comparison_series),
        "scope_and_limitations": (
            "This provides a macro-level directional benchmark against broader transport inflation "
            "(which includes rail, road, fuel, telecom, and passenger transport). "
            "It does NOT represent an airfare-specific micro-index."
        ),
        "series": comparison_series,
    }
