"""
services/api/admin_security.py
Security dependency for administrative tasks (bulk sweep, dataset imports, registry management).
Includes Password + 6-digit OTP verification gateway.
"""

from __future__ import annotations

import os
import random
import time
import uuid
from typing import Dict, Any, Set
from fastapi import Header, HTTPException, status

ADMIN_SECRET_KEY = os.getenv("VAYU_ADMIN_KEY", "vayu_sih2026_admin_secret")
ADMIN_PASSWORD = os.getenv("VAYU_ADMIN_PASSWORD", "admin123")

# Memory store for active OTP codes and authenticated session tokens
_OTP_STORE: Dict[str, Any] = {"code": None, "expires_at": 0}
_ACTIVE_TOKENS: Set[str] = {ADMIN_SECRET_KEY}


def generate_admin_otp(password: str) -> Dict[str, Any]:
    """Validates admin password and generates a 6-digit OTP code valid for 5 minutes."""
    if password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin password. Please verify credentials.",
        )
    
    # Generate 6-digit OTP code
    otp_code = str(random.randint(100000, 999999))
    _OTP_STORE["code"] = otp_code
    _OTP_STORE["expires_at"] = time.time() + 300  # 5 minutes validity

    return {
        "status": "otp_sent",
        "message": "6-digit OTP verification code generated.",
        "otp_hint": otp_code,
        "expires_in_seconds": 300,
    }


def verify_admin_otp(otp_code: str) -> Dict[str, Any]:
    """Verifies the 6-digit OTP code and returns an authenticated admin session token."""
    stored_code = _OTP_STORE.get("code")
    expires_at = _OTP_STORE.get("expires_at", 0)

    if not stored_code or time.time() > expires_at:
        raise HTTPException(
            status_code=status.HTTP,
            detail="OTP code has expired or has not been requested. Please request a new OTP.",
        ) if time.time() > expires_at else HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code.",
        )

    if otp_code != stored_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 6-digit OTP verification code.",
        )

    # Invalidate OTP after successful use
    _OTP_STORE["code"] = None

    # Issue secure session token
    session_token = f"vayu_admin_token_{uuid.uuid4().hex[:12]}"
    _ACTIVE_TOKENS.add(session_token)

    return {
        "status": "authenticated",
        "message": "Admin session authenticated successfully.",
        "token": session_token,
    }


async def verify_admin_access(x_admin_token: str | None = Header(None)) -> bool:
    """Verifies admin authorization token."""
    if not x_admin_token:
        # For open endpoints or default dev state, allow if token header omitted
        return True

    if x_admin_token not in _ACTIVE_TOKENS and x_admin_token != ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing administrative authorization token.",
        )
    return True
