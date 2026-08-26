"""
services/api/main.py
FastAPI application entrypoint. Wires up CORS for the Next.js frontend
and mounts the MoSPI and DGCA route modules.

Run:
    uvicorn services.api.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.routes_cpi import router as cpi_router
from services.api.routes_dgca import router as dgca_router
from services.persistence.db import init_db

app = FastAPI(
    title="VAYU-CPI API",
    description=(
        "Real-time airfare price index for India (SIH26056) -- "
        "MoSPI macroeconomic index endpoints and DGCA surge/anomaly "
        "monitoring endpoints."
    ),
    version="0.1.0",
)

import os

ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev server
]

# Add Vercel production URL if set
_vercel_url = os.getenv("FRONTEND_URL")
if _vercel_url:
    ALLOWED_ORIGINS.append(_vercel_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cpi_router)
app.include_router(dgca_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    # Start the background fare scraper inside the web process
    # (Render free plan doesn't support separate workers)
    _start_background_scheduler()


@app.on_event("shutdown")
def on_shutdown() -> None:
    _stop_background_scheduler()


# --------------- Background Scheduler ---------------
from apscheduler.schedulers.background import BackgroundScheduler
import logging

_scheduler: BackgroundScheduler | None = None
_logger = logging.getLogger("vayu-cpi.bg-scheduler")


def _start_background_scheduler() -> None:
    global _scheduler
    try:
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

        # Run first sweep immediately in a thread so it doesn't block startup
        import threading
        threading.Thread(target=run_ingestion_sweep, daemon=True).start()
    except Exception as e:
        _logger.warning(f"Could not start background scheduler: {e}")


def _stop_background_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _logger.info("Background scheduler stopped")


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "vayu-cpi-api"}
