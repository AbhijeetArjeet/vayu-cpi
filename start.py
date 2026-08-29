"""
start.py
Universal production entrypoint for Railway, Render, Docker, and local development.
Safely reads PORT from environment without shell expansion issues and starts Uvicorn.
"""

import os
import sys
import uvicorn

if __name__ == "__main__":
    raw_port = os.getenv("PORT", "8000")
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 8000

    host = os.getenv("HOST", "0.0.0.0")
    print(f"[VAYU_BOOT] Starting VAYU-CPI API server on {host}:{port}...")
    uvicorn.run(
        "services.api.main:app",
        host=host,
        port=port,
        log_level="info",
        access_log=True,
    )
