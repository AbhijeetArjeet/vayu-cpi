"""
services/ingestion/connectors/simulated_connector.py
Simulated / Reference Data Connector.
Explicitly labeled as SIMULATED_REFERENCE for testing, offline evaluation, and fallback verification.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta
from typing import List, Optional

from core.schemas import RawFareRecord
from core.dgca_weights import get_horizon_code
from services.ingestion.connectors.base import BaseConnector
from services.engine.seed_base_2024 import get_base_fare


class SimulatedReferenceConnector(BaseConnector):
    def __init__(self):
        super().__init__(
            name="SimulatedReferenceConnector",
            carrier_code="SIM",
            is_ota=False,
            rate_limit_delay_sec=0.0,
            respect_robots_txt=False,
        )

    def fetch_quotes(
        self,
        origin: str,
        destination: str,
        horizon_days: int,
        departure_date: Optional[str] = None,
    ) -> List[RawFareRecord]:
        now = datetime.now()
        dep_date = departure_date or (now + timedelta(days=horizon_days)).strftime("%Y-%m-%d")
        dep_time = f"{dep_date} 10:00:00"
        scraped_at = now.isoformat()
        
        base_ref = get_base_fare(origin, destination, horizon_days) or 4500.0
        bw_code = get_horizon_code(horizon_days)

        carriers_sample = [
            ("IndiGo", "6E", "6E-201", 1.0),
            ("Air India", "AI", "AI-101", 1.05),
            ("Akasa Air", "QP", "QP-301", 0.95),
            ("SpiceJet", "SG", "SG-501", 0.92),
        ]

        records = []
        for cname, ccode, fnum, mult in carriers_sample:
            fare_val = round(base_ref * mult, 2)
            base_f = round(fare_val * 0.75, 2)
            fuel_f = round(fare_val * 0.12, 2)
            udf_f = round(fare_val * 0.08, 2)
            conv_f = round(fare_val * 0.05, 2)
            taxes_f = round(fare_val - base_f, 2)

            records.append(
                RawFareRecord(
                    portal="Simulated Benchmark Engine",
                    source="Simulated Reference Feed",
                    source_url=None,
                    carrier=cname,
                    carrier_name=cname,
                    carrier_code=ccode,
                    flight_number=fnum,
                    origin=origin,
                    destination=destination,
                    departure_date=dep_date,
                    departure_time=dep_time,
                    scraped_at=scraped_at,
                    collection_timestamp=scraped_at,
                    horizon_days=horizon_days,
                    booking_window=bw_code,
                    fare_class="Economy",
                    base_fare=base_f,
                    taxes=taxes_f,
                    fuel_surcharge_yq=fuel_f,
                    airport_fee_udf=udf_f,
                    udf=udf_f,
                    convenience_fee=conv_f,
                    total_fare=fare_val,
                    currency="INR",
                    availability_status="AVAILABLE",
                    is_modeled=True,
                    source_type="SIMULATED",
                    source_name="VAYU Calibration Simulator",
                    dataset_version="1.0.0",
                    is_live=False,
                    is_historical=False,
                )
            )
        return records
