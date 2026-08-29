import math
import statistics
from typing import Optional, List, Dict, Any

from core.schemas import FairFareRequest, FairFareResponse, FairFareDistribution
from services.persistence.db import SessionLocal, FareObservation


def _calc_percentile(sorted_arr: List[float], p: float) -> float:
    """Computes empirical percentile without external dependencies."""
    if not sorted_arr:
        return 0.0
    k = (len(sorted_arr) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_arr[int(k)]
    d0 = sorted_arr[int(f)] * (c - k)
    d1 = sorted_arr[int(c)] * (k - f)
    return d0 + d1


def compute_fair_fare_estimate(request: FairFareRequest) -> FairFareResponse:
    """
    Evaluates whether a given airfare is statistically fair/normal or elevated.
    """
    session = SessionLocal()
    try:
        orig = request.origin.upper().strip()
        dest = request.destination.upper().strip()
        corridor = f"{orig}-{dest}"
        h_days = request.horizon_days

        # Query relevant observations
        q = session.query(FareObservation).filter(
            FareObservation.origin == orig,
            FareObservation.destination == dest,
            FareObservation.horizon_days == h_days,
        )

        if request.carrier:
            q = q.filter(
                (FareObservation.carrier.ilike(f"%{request.carrier}%"))
                | (FareObservation.carrier_name.ilike(f"%{request.carrier}%"))
            )

        records = q.all()
        fares = [r.total_fare for r in records if r.total_fare > 0]

        # If not enough records on exact horizon, relax horizon constraint to neighboring horizons
        if len(fares) < 3:
            q_relax = session.query(FareObservation).filter(
                FareObservation.origin == orig,
                FareObservation.destination == dest,
            )
            records_relax = q_relax.all()
            fares = [r.total_fare for r in records_relax if r.total_fare > 0]

        if not fares:
            # Benchmark fallback estimation based on distance/corridor baseline
            return FairFareResponse(
                origin=orig,
                destination=dest,
                corridor=corridor,
                horizon_days=h_days,
                booking_window=f"T+{h_days}",
                carrier_filter=request.carrier,
                current_fare=request.current_fare,
                expected_fare=5200.0,
                expected_range_low=3800.0,
                expected_range_high=6800.0,
                difference_pct=None,
                percentile_rank=None,
                fare_status="INSUFFICIENT_DATA",
                confidence_pct=30.0,
                distribution=FairFareDistribution(p10=3500.0, p25=4200.0, median=5200.0, p75=6500.0, p90=7800.0),
                observations_analyzed=0,
                assessment_notes="Insufficient historical observations in database for this specific city-pair and horizon.",
            )

        fares.sort()
        n = len(fares)

        p10 = _calc_percentile(fares, 10)
        p25 = _calc_percentile(fares, 25)
        median = _calc_percentile(fares, 50)
        p75 = _calc_percentile(fares, 75)
        p90 = _calc_percentile(fares, 90)

        dist = FairFareDistribution(
            p10=round(p10, 0),
            p25=round(p25, 0),
            median=round(median, 0),
            p75=round(p75, 0),
            p90=round(p90, 0),
        )

        diff_pct = None
        pct_rank = None
        status = "FAIR_NORMAL"

        if request.current_fare is not None and request.current_fare > 0:
            c_fare = request.current_fare
            diff_pct = round(((c_fare - median) / median) * 100.0, 1) if median > 0 else 0.0

            # Calculate percentile rank
            count_below = sum(1 for f in fares if f < c_fare)
            pct_rank = round((count_below / n) * 100.0, 1)

            p15 = _calc_percentile(fares, 15)
            if c_fare < p15:
                status = "UNUSUALLY_CHEAP"
            elif c_fare <= p75:
                status = "FAIR_NORMAL"
            elif c_fare <= p90:
                status = "ELEVATED"
            else:
                status = "UNUSUALLY_EXPENSIVE"

        conf = min(96.0, max(60.0, round(65.0 + (min(n, 50) * 0.6), 1)))

        notes = (
            f"Expected fare ₹{median:,.0f} calculated from {n} observed quotes for {corridor} (T+{h_days}). "
            f"Typical 25th–75th interquartile band is ₹{p25:,.0f} to ₹{p75:,.0f}."
        )

        return FairFareResponse(
            origin=orig,
            destination=dest,
            corridor=corridor,
            horizon_days=h_days,
            booking_window=f"T+{h_days}",
            carrier_filter=request.carrier,
            current_fare=request.current_fare,
            expected_fare=round(median, 0),
            expected_range_low=round(p25, 0),
            expected_range_high=round(p75, 0),
            difference_pct=diff_pct,
            percentile_rank=pct_rank,
            fare_status=status,
            confidence_pct=conf,
            distribution=dist,
            observations_analyzed=n,
            assessment_notes=notes,
        )
    finally:
        session.close()
