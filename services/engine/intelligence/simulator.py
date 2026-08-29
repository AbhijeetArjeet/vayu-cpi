"""
services/engine/intelligence/simulator.py
VAYU What-If CPI Scenario Simulator Engine.

Allows researchers and policymakers to model hypothetical economic shocks
(demand surges, capacity reductions, ATF fuel price shifts, seasonality)
on national and regional airfare price indices.
"""

from __future__ import annotations

from typing import Dict, List, Optional
from core.schemas import SimulationRequest, SimulationResponse, SimulationCorridorImpact
from core.dgca_weights import ALL_CORRIDORS, CORRIDOR_WEIGHTS
from services.engine.index_calculator import compute_national_composite_cpi, compute_route_jevons_index


def run_what_if_cpi_simulation(req: SimulationRequest) -> SimulationResponse:
    """
    Computes hypothetical airfare index outcomes under parameterized macro shocks.
    """
    # 1. Obtain baseline national CPI
    base_cpi_res = compute_national_composite_cpi(mode="live", period_days=30)
    base_national = base_cpi_res.composite_index

    # 2. Econometric Elasticity Constants
    eps_demand = 0.65       # Demand price elasticity in aviation yield management
    eps_capacity = 0.85     # Capacity shortage scarcity elasticity
    beta_fuel = 0.18        # ATF pass-through factor
    
    # Macro percentage movement across base tariffs
    macro_pct_shift = (
        (eps_demand * (req.demand_shock_pct / 100.0))
        - (eps_capacity * (req.capacity_shock_pct / 100.0))
        + (beta_fuel * (req.fuel_surcharge_shock_pct / 100.0))
        + (req.seasonality_multiplier - 1.0)
    )

    weights_map = req.custom_corridor_weights or {f"{o}-{d}": w for (o, d), w in CORRIDOR_WEIGHTS.items()}
    total_w = sum(weights_map.values())
    norm_weights = {k: v / total_w for k, v in weights_map.items()} if total_w > 0 else weights_map

    corridor_impacts: List[SimulationCorridorImpact] = []
    simulated_weighted_sum = 0.0

    # Regional groupings for macro summary
    regional_sim_sums: Dict[str, float] = {"North": 0.0, "West": 0.0, "South": 0.0, "East": 0.0, "Northeast": 0.0}
    regional_weight_sums: Dict[str, float] = {"North": 0.0, "West": 0.0, "South": 0.0, "East": 0.0, "Northeast": 0.0}

    for (orig, dest) in ALL_CORRIDORS:
        c_key = f"{orig}-{dest}"
        w = norm_weights.get(c_key, 0.02)
        
        # Route baseline index
        r_res = compute_route_jevons_index(orig, dest, 7, mode="live", period_days=30)
        r_base = r_res.jevons_index if (r_res and getattr(r_res, 'sample_size', 0) > 0) else base_national
        if r_base <= 0:
            r_base = base_national

        # Route sensitivity amplifier (Trunk routes have higher yield responsiveness)
        route_sensitivity = 1.15 if w >= 0.08 else 0.95
        route_shift_pct = macro_pct_shift * route_sensitivity
        
        r_sim = round(max(50.0, r_base * (1.0 + route_shift_pct)), 2)
        r_diff = round(((r_sim - r_base) / r_base) * 100.0, 1)

        simulated_weighted_sum += (r_sim * w)

        # Region attribution
        reg = "North" if orig in ("DEL", "ATQ", "SXR", "JAI") or dest in ("DEL", "ATQ") else \
              "West" if orig in ("BOM", "GOI", "AMD", "PNQ") or dest in ("BOM", "GOI") else \
              "South" if orig in ("BLR", "MAA", "HYD", "COK") or dest in ("BLR", "MAA") else \
              "East" if orig in ("CCU", "PAT", "BBI") or dest in ("CCU", "PAT") else "Northeast"
        
        regional_sim_sums[reg] += (r_sim * w)
        regional_weight_sums[reg] += w

        key_channel = "Capacity Constraint" if req.capacity_shock_pct < 0 else \
                      "Demand Pressure" if req.demand_shock_pct > 0 else \
                      "Fuel ATF Surcharge" if req.fuel_surcharge_shock_pct > 0 else "Baseline Tariff Drift"

        corridor_impacts.append(
            SimulationCorridorImpact(
                corridor=c_key,
                baseline_index=round(r_base, 2),
                simulated_index=r_sim,
                difference_pct=r_diff,
                key_transmission_channel=key_channel,
            )
        )

    # Sort corridor impacts by difference magnitude
    corridor_impacts.sort(key=lambda x: abs(x.difference_pct), reverse=True)

    sim_national = round(simulated_weighted_sum, 2)
    abs_change = round(sim_national - base_national, 2)
    pct_change = round(((sim_national - base_national) / base_national) * 100.0, 1) if base_national > 0 else 0.0

    # Compute regional average simulated indices
    regional_impacts: Dict[str, float] = {}
    for reg, val_sum in regional_sim_sums.items():
        w_sum = regional_weight_sums[reg]
        regional_impacts[reg] = round(val_sum / w_sum, 2) if w_sum > 0 else sim_national

    # Text interpretation
    interp = (
        f"A hypothetical {req.demand_shock_pct:+.1f}% demand shock combined with a {req.capacity_shock_pct:+.1f}% "
        f"capacity change shifts the National CPI from {base_national:.2f} to {sim_national:.2f} ({pct_change:+.1f}%)."
    )

    return SimulationResponse(
        is_simulation=True,
        baseline_national_cpi=round(base_national, 2),
        simulated_national_cpi=sim_national,
        absolute_change_pts=abs_change,
        percentage_change_pct=pct_change,
        macro_interpretation=interp,
        demand_elasticity_assumed=eps_demand,
        capacity_elasticity_assumed=eps_capacity,
        regional_impacts=regional_impacts,
        corridor_impacts=corridor_impacts[:12],
        disclaimer="Hypothetical economic scenario simulation. Generated for policy experimentation; not an official government forecast.",
    )
