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


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "vayu-cpi-api"}
