"""
services/engine/intelligence/__init__.py
Statistical Intelligence Domain Package for VAYU-CPI.
"""

from services.engine.intelligence.explainer import compute_inflation_explainer
from services.engine.intelligence.shocks import detect_airfare_shocks, compute_shock_summary
from services.engine.intelligence.fair_fare import compute_fair_fare_estimate
from services.engine.intelligence.simulator import run_what_if_cpi_simulation
from services.engine.intelligence.provenance import compute_data_confidence_report, build_index_trace_tree
from services.engine.intelligence.fare_dna import generate_fare_dna_profile
from services.engine.intelligence.source_consensus import compute_source_consensus_report
from services.engine.intelligence.weather import compute_airfare_weather_report
from services.engine.intelligence.events import compute_event_impact_report
from services.engine.intelligence.index_lab import execute_index_lab_experiment

__all__ = [
    "compute_inflation_explainer",
    "detect_airfare_shocks",
    "compute_shock_summary",
    "compute_fair_fare_estimate",
    "run_what_if_cpi_simulation",
    "compute_data_confidence_report",
    "build_index_trace_tree",
    "generate_fare_dna_profile",
    "compute_source_consensus_report",
    "compute_airfare_weather_report",
    "compute_event_impact_report",
    "execute_index_lab_experiment",
]
