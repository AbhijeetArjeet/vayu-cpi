"""
services/ingestion/connectors/__init__.py
Modular multi-source connector registry for VAYU-CPI.
Supports direct carrier crawlers (IndiGo, Air India Group, Akasa, SpiceJet)
and Online Travel Agencies (MakeMyTrip, EaseMyTrip, Cleartrip, Google Flights).
"""

from typing import Dict, Type
from services.ingestion.connectors.base import BaseConnector
from services.ingestion.connectors.ota_connector import OTAConnector
from services.ingestion.connectors.indigo_connector import IndiGoConnector
from services.ingestion.connectors.air_india_connector import AirIndiaConnector
from services.ingestion.connectors.air_india_express_connector import AirIndiaExpressConnector
from services.ingestion.connectors.akasa_connector import AkasaConnector
from services.ingestion.connectors.spicejet_connector import SpiceJetConnector
from services.ingestion.connectors.makemytrip_connector import MakeMyTripConnector
from services.ingestion.connectors.easemytrip_connector import EaseMyTripConnector
from services.ingestion.connectors.cleartrip_connector import CleartripConnector
from services.ingestion.connectors.secondary_fare_api_connector import SecondaryFareAPIConnector
from services.ingestion.connectors.simulated_connector import SimulatedReferenceConnector

CONNECTOR_REGISTRY: Dict[str, Type[BaseConnector]] = {
    # Direct Carriers
    "6E": IndiGoConnector,
    "INDIGO": IndiGoConnector,
    "AI": AirIndiaConnector,
    "AIRINDIA": AirIndiaConnector,
    "IX": AirIndiaExpressConnector,
    "AIRINDIAEXPRESS": AirIndiaExpressConnector,
    "QP": AkasaConnector,
    "AKASA": AkasaConnector,
    "SG": SpiceJetConnector,
    "SPICEJET": SpiceJetConnector,
    
    # Online Travel Agencies & Aggregators
    "OTA": OTAConnector,
    "GOOGLE_FLIGHTS": OTAConnector,
    "MMT": MakeMyTripConnector,
    "MAKEMYTRIP": MakeMyTripConnector,
    "EMT": EaseMyTripConnector,
    "EASEMYTRIP": EaseMyTripConnector,
    "CT": CleartripConnector,
    "CLEARTRIP": CleartripConnector,
    "SECONDARY_API": SecondaryFareAPIConnector,
    "RAPIDAPI": SecondaryFareAPIConnector,
    
    # Testing & Calibration
    "SIMULATED": SimulatedReferenceConnector,
}

def get_connector(name_or_code: str) -> BaseConnector:
    """Instantiates an OTA or carrier connector by code or name."""
    clean_key = name_or_code.strip().upper().replace(" ", "").replace("-", "_")
    cls = CONNECTOR_REGISTRY.get(clean_key, OTAConnector)
    return cls()

__all__ = [
    "BaseConnector",
    "OTAConnector",
    "IndiGoConnector",
    "AirIndiaConnector",
    "AirIndiaExpressConnector",
    "AkasaConnector",
    "SpiceJetConnector",
    "MakeMyTripConnector",
    "EaseMyTripConnector",
    "CleartripConnector",
    "SecondaryFareAPIConnector",
    "SimulatedReferenceConnector",
    "CONNECTOR_REGISTRY",
    "get_connector",
]
