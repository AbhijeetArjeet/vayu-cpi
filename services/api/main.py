"""
services/api/main.py
FastAPI application entrypoint for VAYU-CPI.
Exposes standard SIH endpoints, MoSPI macroeconomic CPI routes, DGCA governance tools,
and OpenAPI / Swagger interactive documentation.
"""

from __future__ import annotations

import os
import logging
from typing import List, Optional
from datetime import date

from fastapi import FastAPI, HTTPException, Query, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse

from core.env_diag import print_startup_diagnostics
from core.schemas import (
    NationalCompositeCPI,
    CarrierIndex,
    BacktestResult,
)
from core.dgca_weights import ALL_CORRIDORS, INDIAN_AIRPORTS, get_horizon_code
from services.engine.index_calculator import (
    compute_national_composite_cpi,
    compute_carrier_indices,
)
from services.engine.backtester import (
    run_30day_backtest,
    run_30day_synthetic_validation,
    run_real_dgca_backtest,
)
from services.persistence.db import fetch_all_observations

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger("vayu-cpi.api")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VAYU-CPI API",
    description=(
        "National Airfare Price Index for India — "
        "Augmenting Consumer Price Index (CPI) through Automated, Ethical Web Scraping. "
        "Ministry: MoSPI | Department: DIID | SIH Problem Statement."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allowed production and development origins
ALLOWED_ORIGINS = [
    "https://vayu-cpi.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in ALLOWED_ORIGINS or origin.endswith(".vercel.app") or "localhost" in origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


# --- Root / Standard SIH Endpoints ---

@app.get("/", tags=["System Health"])
def root_endpoint() -> dict:
    """Root metadata endpoint."""
    return {
        "status": "ok",
        "service": "vayu-cpi-api",
        "version": "1.0.0",
        "description": "VAYU-CPI National Airfare Price Index API (MoSPI / DIID)",
        "docs_url": "/docs",
        "health_url": "/health",
    }

@app.get("/health", tags=["System Health"])
def health_check() -> dict:
    """System health check endpoint with database probe."""
    db_status = "connected"
    try:
        from services.persistence.db import engine, text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {str(e)[:80]}"

    return {
        "status": "ok" if "unavailable" not in db_status else "degraded",
        "database": db_status,
        "service": "vayu-cpi-api",
        "version": "1.0.0",
        "sih_theme": "Smart Automation (MoSPI)",
    }


@app.get("/routes", tags=["Core Aviation Data"])
def list_routes() -> dict:
    """Returns all tracked domestic corridors, city names, and airport metadata."""
    routes_data = []
    for orig, dest in ALL_CORRIDORS:
        orig_info = INDIAN_AIRPORTS.get(orig, {"name": orig, "city": orig})
        dest_info = INDIAN_AIRPORTS.get(dest, {"name": dest, "city": dest})
        routes_data.append({
            "corridor": f"{orig}-{dest}",
            "origin": orig,
            "origin_city": orig_info["city"],
            "origin_name": orig_info["name"],
            "destination": dest,
            "destination_city": dest_info["city"],
            "destination_name": dest_info["name"],
        })
    return {"count": len(routes_data), "routes": routes_data}


@app.get("/carriers", response_model=List[CarrierIndex], tags=["Core Aviation Data"])
def list_carriers(mode: str = Query("combined", description="live, historical, combined")) -> List[CarrierIndex]:
    """Returns carrier-level sub-indices and observed market share distributions."""
    return compute_carrier_indices(mode=mode)


@app.get("/fares", tags=["Core Aviation Data"])
def list_fares(
    origin: Optional[str] = Query(None, min_length=3, max_length=3, description="e.g. DEL"),
    destination: Optional[str] = Query(None, min_length=3, max_length=3, description="e.g. BOM"),
    carrier: Optional[str] = Query(None, description="e.g. 6E or IndiGo"),
    booking_window: Optional[str] = Query(None, description="e.g. T+1, T+7, T+15, T+30, T+45"),
    mode: str = Query("combined", description="live, historical, combined"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Returns raw and cleaned fare observations with query filtering."""
    records = fetch_all_observations(
        mode=mode,
        origin=origin,
        destination=destination,
        carrier=carrier,
        booking_window=booking_window,
        limit=limit,
    )
    return {
        "count": len(records),
        "filters": {
            "origin": origin,
            "destination": destination,
            "carrier": carrier,
            "booking_window": booking_window,
            "mode": mode,
        },
        "fares": [
            {
                "id": r.id,
                "origin": r.origin,
                "destination": r.destination,
                "carrier": r.carrier,
                "carrier_code": r.carrier_code,
                "flight_number": r.flight_number,
                "departure_date": r.departure_date or str(r.departure_time)[:10],
                "departure_time": r.departure_time,
                "collection_timestamp": r.scraped_at,
                "horizon_days": r.horizon_days,
                "booking_window": r.booking_window or get_horizon_code(r.horizon_days),
                "fare_class": r.fare_class,
                "base_fare": r.base_fare,
                "taxes": r.taxes,
                "udf": r.udf or r.airport_fee_udf,
                "convenience_fee": r.convenience_fee,
                "total_fare": r.total_fare,
                "currency": r.currency,
                "availability_status": r.availability_status,
                "source": r.source,
                "source_url": r.source_url,
                "is_modeled": r.is_modeled,
                "is_live": r.is_live,
                "is_historical": r.is_historical,
            }
            for r in records
        ],
    }


@app.get("/index", response_model=NationalCompositeCPI, tags=["Econometric Index"])
def get_index(
    target_date: Optional[date] = Query(None, description="Target calculation date"),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns the National Airfare Price Index (Base 2024 = 100) and all 5 booking window sub-indices."""
    return compute_national_composite_cpi(target_date, mode=mode)


@app.get("/index/daily", tags=["Econometric Index"])
def get_daily_index(
    days_back: int = Query(30, ge=1, le=365),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns daily airfare price index series."""
    from services.api.routes_cpi import get_daily_index as cpi_daily
    return cpi_daily(days_back=days_back, mode=mode)


@app.get("/index/weekly", tags=["Econometric Index"])
def get_weekly_index(
    weeks_back: int = Query(12, ge=1, le=52),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns weekly smoothed airfare price index series."""
    from services.api.routes_cpi import get_weekly_index as cpi_weekly
    return cpi_weekly(weeks_back=weeks_back, mode=mode)


@app.get("/index/monthly", tags=["Econometric Index"])
def get_monthly_index(
    months_back: int = Query(12, ge=1, le=36),
    mode: str = Query("live", description="live, historical, combined"),
):
    """Returns monthly aggregated airfare price index series for official CPI integration."""
    from services.api.routes_cpi import get_monthly_index as cpi_monthly
    return cpi_monthly(months_back=months_back, mode=mode)


@app.get("/methodology-validation", response_model=BacktestResult, tags=["Econometric Validation"])
def get_methodology_validation(mode: str = Query("real_dgca", description="real_dgca, synthetic_self_check, historical, combined")) -> BacktestResult:
    """
    Executes econometric backtesting against DGCA / MoCA baseline benchmark data (mode='real_dgca')
    or synthetic aggregation pipeline self-consistency check (mode='synthetic_self_check').
    """
    return run_30day_backtest(mode=mode)


@app.get("/backtest", response_model=BacktestResult, tags=["Econometric Validation"])
def get_backtest_results(mode: str = Query("real_dgca", description="real_dgca, synthetic_self_check, historical, combined")) -> BacktestResult:
    """
    Executes econometric backtesting comparing VAYU-CPI against official DGCA / MoCA baseline benchmarks.
    """
    return run_30day_backtest(mode=mode)


# --- Include Feature Routers ---
from services.api.routes_cpi import router as cpi_router
from services.api.routes_dgca import router as dgca_router
from services.api.routes_debug import router as debug_router
from services.api.routes_data import router as data_router
from services.api.routes_admin import router as admin_router
from services.api.routes_scraper import router as scraper_router
from services.api.routes_intelligence import router as intelligence_router

app.include_router(cpi_router)
app.include_router(dgca_router)
app.include_router(debug_router)
app.include_router(data_router)
app.include_router(admin_router)
app.include_router(scraper_router)
app.include_router(intelligence_router)

# Mount aliases
@app.get("/api/v1/methodology-validation", response_model=BacktestResult, tags=["Econometric Validation"])
def api_v1_methodology_validation(mode: str = Query("real_dgca")) -> BacktestResult:
    return run_30day_backtest(mode=mode)

@app.get("/api/v1/backtest", response_model=BacktestResult, tags=["Econometric Validation"])
def api_v1_backtest(mode: str = Query("real_dgca")) -> BacktestResult:
    return run_30day_backtest(mode=mode)

@app.get("/cross-validation", tags=["Econometric Validation"])
def get_cross_validation(
    origin: Optional[str] = Query(None, min_length=3, max_length=3),
    destination: Optional[str] = Query(None, min_length=3, max_length=3),
):
    from services.engine.cross_validation import compute_cross_validation_report
    return compute_cross_validation_report(origin=origin, destination=destination)

@app.get("/mospi-comparison", tags=["Econometric Validation"])
def get_mospi_comparison():
    from services.engine.dgca_reference_data import compute_mospi_trend_comparison
    return compute_mospi_trend_comparison()

@app.get("/api/v1/routes", tags=["Core Aviation Data"])
def api_v1_routes() -> dict:
    return list_routes()

@app.get("/api/v1/carriers", response_model=List[CarrierIndex], tags=["Core Aviation Data"])
def api_v1_carriers(mode: str = Query("combined")) -> List[CarrierIndex]:
    return compute_carrier_indices(mode=mode)

@app.get("/api/v1/fares", tags=["Core Aviation Data"])
def api_v1_fares(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    carrier: Optional[str] = None,
    booking_window: Optional[str] = None,
    mode: str = "combined",
    limit: int = 100,
):
    return list_fares(origin=origin, destination=destination, carrier=carrier, booking_window=booking_window, mode=mode, limit=limit)

@app.get("/api/v1/index", response_model=NationalCompositeCPI, tags=["Econometric Index"])
def api_v1_index(
    target_date: Optional[date] = None,
    mode: str = "live",
    period_days: int = Query(30, description="Analysis window in days: 1, 7, 30, 90, 365"),
):
    if period_days not in (1, 7, 30, 90, 365):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid period_days '{period_days}'. Allowed values: 1, 7, 30, 90, 365."
        )
    return compute_national_composite_cpi(target_date, mode=mode, period_days=period_days)


# --- Startup & Shutdown ---
@app.on_event("startup")
def on_startup() -> None:
    print_startup_diagnostics(_logger)
    import threading
    def _background_startup():
        try:
            from services.persistence.db import init_db
            init_db()
            _logger.info("Database initialized successfully")
        except Exception as e:
            _logger.warning(f"Database init skipped: {e}")

        _start_background_scheduler()

    threading.Thread(target=_background_startup, daemon=True).start()


@app.on_event("shutdown")
def on_shutdown() -> None:
    _stop_background_scheduler()


# --------------- Background Scheduler ---------------
_scheduler = None


def _start_background_scheduler() -> None:
    global _scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from services.ingestion.scheduler import run_ingestion_sweep

        _scheduler = BackgroundScheduler()
        _scheduler.add_job(
            run_ingestion_sweep,
            "interval",
            hours=6,
            id="vayu_cpi_sweep",
        )
        _scheduler.start()
        _logger.info("Background scheduler started (every 6 hours)")

        import threading
        threading.Thread(target=run_ingestion_sweep, daemon=True).start()
    except Exception as e:
        _logger.warning(f"Background scheduler not started: {e}")


def _stop_background_scheduler() -> None:
    global _scheduler
    if _scheduler:
        try:
            _scheduler.shutdown(wait=False)
            _logger.info("Background scheduler stopped")
        except Exception:
            pass
