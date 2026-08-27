"""
services/api/main.py
FastAPI application entrypoint. Wires up CORS for the Next.js frontend
and mounts the MoSPI, DGCA, and Production Debug route modules.

Run:
    uvicorn services.api.main:app --reload --port 8000
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.env_diag import print_startup_diagnostics

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger("vayu-cpi.api")

app = FastAPI(
    title="VAYU-CPI API",
    description=(
        "Real-time airfare price index for India (SIH26056) -- "
        "MoSPI macroeconomic index endpoints, DGCA surge/anomaly "
        "monitoring endpoints, and production diagnostic engine."
    ),
    version="0.1.0",
)

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from fastapi import Request

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        if request.method == "OPTIONS":
            res = Response(status_code=200)
            if origin:
                res.headers["Access-Control-Allow-Origin"] = origin
                res.headers["Access-Control-Allow-Credentials"] = "true"
                res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Token, Cookie"
            return res

        response = await call_next(request)
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Token, Cookie"
        return response

app.add_middleware(DynamicCORSMiddleware)

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Token, Cookie"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )

# --- Routes ---
from services.api.routes_cpi import router as cpi_router
from services.api.routes_dgca import router as dgca_router
from services.api.routes_debug import router as debug_router
from services.api.routes_data import router as data_router
from services.api.routes_admin import router as admin_router
from services.api.routes_auth import router as auth_router
from services.api.routes_admin_users import router as admin_users_router

app.include_router(cpi_router)
app.include_router(dgca_router)
app.include_router(debug_router)
app.include_router(data_router)
app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(admin_users_router)




# --- Startup ---
@app.on_event("startup")
def on_startup() -> None:
    # Print safe runtime diagnostic summary (dependencies, OS, DB target, flags)
    print_startup_diagnostics(_logger)

    # Run DB init and scheduler asynchronously in a background thread so web server responds to Railway /health immediately (<10ms)
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
