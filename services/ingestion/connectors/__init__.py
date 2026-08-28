"""
services/ingestion/connectors/__init__.py
Modular connector registry for VAYU-CPI.
"""

from typing import Dict, Type
from services.ingestion.connectors.base import BaseConnector
from services.ingestion.connectors.ota_connector import OTAConnector
from services.ingestion.connectors.indigo_connector import IndiGoConnector
from services.ingestion.connectors.air_india_connector import AirIndiaConnector
from services.ingestion.connectors.air_india_express_connector import AirIndiaExpressConnector
from services.ingestion.connectors.akasa_connector import AkasaConnector
from services.ingestion.connectors.spicejet_connector import SpiceJetConnector
from services.ingestion.connectors.simulated_connector import SimulatedReferenceConnector

CONNECTOR_REGISTRY: Dict[str, Type[BaseConnector]] = {
    "OTA": OTAConnector,
    "6E": IndiGoConnector,
    "IndiGo": IndiGoConnector,
    "AI": AirIndiaConnector,
    "AirIndia": AirIndiaConnector,
    "IX": AirIndiaExpressConnector,
    "AirIndiaExpress": AirIndiaExpressConnector,
    "QP": AkasaConnector,
    "Akasa": AkasaConnector,
    "SG": SpiceJetConnector,
    "SpiceJet": SpiceJetConnector,
    "SIMULATED": SimulatedReferenceConnector,
}

def get_connector(name_or_code: str) -> BaseConnector:
    """Instantiates a connector by airline code or registry name."""
    cls = CONNECTOR_REGISTRY.get(name_or_code, OTAConnector)
    return cls()

__all__ = [
    "BaseConnector",
    "OTAConnector",
    "IndiGoConnector",
    "AirIndiaConnector",
    "AirIndiaExpressConnector",
    "AkasaConnector",
    "SpiceJetConnector",
    "SimulatedReferenceConnector",
    "CONNECTOR_REGISTRY",
    "get_connector",
]
