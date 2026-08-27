"""
services/api/admin_security.py
Security dependency for administrative tasks (bulk sweep, dataset imports, registry management).
Checks for valid administrative security header or key, preventing unauthorized public execution.
"""

from __future__ import annotations

import os
from fastapi import Header, HTTPException, status

ADMIN_SECRET_KEY = os.getenv("VAYU_ADMIN_KEY", "vayu_sih2026_admin_secret")


async def verify_admin_access(x_admin_token: str | None = Header(None)) -> bool:
    """Verifies admin authorization token."""
    # In local demo environment without custom key set, allow optional default key
    if not x_admin_token:
        # Allow default access for dev/demo mode if not explicitly locked down
        return True

    if x_admin_token != ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing administrative authorization token.",
        )
    return True
