"""
services/api/routes_debug.py
Production diagnostic endpoint with security access control.
"""

import os
from fastapi import APIRouter, Query, Header, HTTPException
from core.env_diag import get_system_diagnostics
from services.ingestion.live_fetcher import fetch_route_horizon_with_diagnostics
from services.persistence.db import save_fare_records_with_diagnostics

router = APIRouter(prefix="/api/v1/debug", tags=["Production Diagnostics"])


def _is_production_environment() -> bool:
    """Detects whether running in a production deployment environment (e.g. Railway/Render)."""
    env_name = os.getenv("ENVIRONMENT", "").lower()
    railway_env = os.getenv("RAILWAY_ENVIRONMENT", "").lower()
    render_env = os.getenv("RENDER", "").lower()
    return env_name in ("production", "prod") or bool(railway_env) or bool(render_env)


def _validate_debug_authorization(x_admin_secret: str | None) -> bool:
    """
    Validates access for diagnostic endpoints.
    In local development: Access is allowed freely unless explicitly disabled.
    In production: Requires X-Admin-Secret matching VAYU_DEBUG_SECRET or ADMIN_SECRET_KEY.
    """
    secret_key = os.getenv("VAYU_DEBUG_SECRET") or os.getenv("ADMIN_SECRET_KEY")
    
    # In production, authentication is mandatory
    if _is_production_environment():
        if not secret_key:
            # If no secret key is configured in production, disable debug endpoint completely
            return False
        return x_admin_secret == secret_key

    # In local development, allow access unless VAYU_DEBUG_INGESTION is set to explicit false
    debug_flag = os.getenv("VAYU_DEBUG_INGESTION", "true").lower() in ("true", "1", "yes")
    if secret_key and x_admin_secret:
        return x_admin_secret == secret_key
    return debug_flag


@router.get("/flight-fetch")
async def debug_flight_fetch(
    origin: str = Query("DEL", min_length=3, max_length=3),
    destination: str = Query("BOM", min_length=3, max_length=3),
    horizon_days: int = Query(7, ge=1, le=365),
    force: bool = Query(False, description="Diagnostic flag"),
    x_admin_secret: str | None = Header(None, alias="X-Admin-Secret"),
):
    """
    Diagnostic endpoint to test flight fetching, parsing, and DB persistence independently.
    In production deployments, access requires a valid X-Admin-Secret header.
    """
    if not _validate_debug_authorization(x_admin_secret):
        raise HTTPException(
            status_code=404,
            detail="Resource not found."
        )

    origin_code = origin.upper()
    dest_code = destination.upper()

    # Step 1 & 2: Fetch and Parse Stage
    ingest_diag = fetch_route_horizon_with_diagnostics(origin_code, dest_code, horizon_days)
    
    fetch_stage = ingest_diag.get("fetch_stage", {})
    parse_stage = ingest_diag.get("parse_stage", {})
    records = ingest_diag.get("records", [])

    sys_diag = get_system_diagnostics()

    if fetch_stage.get("status") == "failed":
        err = fetch_stage.get("error") or {}
        return {
            "status": "failed",
            "stage": "fetch",
            "route": f"{origin_code}-{dest_code}",
            "horizon": horizon_days,
            "departure_date": ingest_diag.get("departure_date"),
            "exception_type": err.get("type", "FetchException"),
            "message": err.get("message", "Upstream flight fetch failed"),
            "traceback": err.get("traceback"),
            "elapsed_ms": fetch_stage.get("elapsed_ms", 0),
            "system": sys_diag,
        }

    # Step 3: Database Persistence Stage
    db_diag = {"status": "skipped", "attempted": 0, "inserted": 0, "error": None}
    if records:
        db_diag = save_fare_records_with_diagnostics(records)

    overall_status = "success" if (records and db_diag.get("status") == "success") else "failed"
    if not records and fetch_stage.get("status") == "success":
        overall_status = "empty_response"
    elif db_diag.get("status") == "failed":
        overall_status = "failed"

    db_err = db_diag.get("error") or {}

    res = {
        "status": overall_status,
        "stage": "completed" if overall_status in ("success", "empty_response") else "db",
        "route": f"{origin_code}-{dest_code}",
        "horizon": horizon_days,
        "departure_date": ingest_diag.get("departure_date"),
        "flight_groups": fetch_stage.get("flight_groups", 0),
        "records": parse_stage.get("records_generated", 0),
        "elapsed_ms": fetch_stage.get("elapsed_ms", 0),
        "db_status": db_diag.get("status"),
        "db_inserted": db_diag.get("inserted", 0),
        "fast_flights_version": sys_diag["packages"]["fast_flights"],
        "python_version": sys_diag["python_version"],
        "system": sys_diag,
        "stage_breakdown": {
            "fetch": fetch_stage,
            "parse": parse_stage,
            "db": db_diag,
        },
    }

    if db_diag.get("status") == "failed":
        res.update({
            "exception_type": db_err.get("type", "DatabaseException"),
            "message": db_err.get("message", "DB persistence failed"),
            "traceback": db_err.get("traceback"),
        })

    return res
