"""
services/api/main.py
FastAPI application entrypoint. Wires up CORS for the Next.js frontend
and mounts the MoSPI and DGCA route modules.

Run:
    uvicorn services.api.main:app --reload --port 8000
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger("vayu-cpi.api")

app = FastAPI(
    title="VAYU-CPI API",
    description=(
        "Real-time airfare price index for India (SIH26056) -- "
        "MoSPI macroeconomic index endpoints and DGCA surge/anomaly "
        "monitoring endpoints."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---
try:
    from services.api.routes_cpi import router as cpi_router
    from services.api.routes_dgca import router as dgca_router
    app.include_router(cpi_router)
    app.include_router(dgca_router)
except Exception as e:
    _logger.warning(f"Could not load route modules: {e}")


# --- Startup ---
@app.on_event("startup")
def on_startup() -> None:
    # Init database (safe - handles missing TimescaleDB)
    try:
        from services.persistence.db import init_db
        init_db()
        _logger.info("Database initialized")
    except Exception as e:
        _logger.warning(f"Database init skipped: {e}")

    # Start background scraper (safe - won't crash the API if it fails)
    _start_background_scheduler()


@app.on_event("shutdown")
def on_shutdown() -> None:
    _stop_background_scheduler()


# --- Health check (must always work) ---
@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "vayu-cpi-api"}


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

        # Run first sweep in a background thread (non-blocking)
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
