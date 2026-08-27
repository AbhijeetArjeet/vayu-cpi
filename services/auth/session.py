"""
services/auth/session.py
Session token management, JWT token signing/verification, and HttpOnly cookie utilities.
"""

from __future__ import annotations

import os
import json
import time
import hmac
import hashlib
import base64
from typing import Dict, Any, Optional

AUTH_SECRET = os.getenv("AUTH_SECRET", "vayu_sih2026_jwt_secret_key_change_in_production")
SESSION_EXPIRY_HOURS = 12


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(data_str: str) -> bytes:
    padding = "=" * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode((data_str + padding).encode("utf-8"))


def create_session_token(user_id: str, role: str, name: str, phone: str) -> str:
    """Generates an HMAC SHA-256 signed JWT session token valid for 12 hours."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": user_id,
        "role": role,
        "name": name,
        "phone": phone,
        "iat": now,
        "exp": now + (SESSION_EXPIRY_HOURS * 3600)
    }

    header_encoded = _b64_encode(json.dumps(header).encode("utf-8"))
    payload_encoded = _b64_encode(json.dumps(payload).encode("utf-8"))

    signing_input = f"{header_encoded}.{payload_encoded}".encode("utf-8")
    signature = hmac.new(AUTH_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_encoded = _b64_encode(signature)

    return f"{header_encoded}.{payload_encoded}.{signature_encoded}"


def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifies HMAC signature and exp timestamp. Returns payload dict or None if invalid/expired."""
    if not token or token.count(".") != 2:
        return None

    try:
        header_encoded, payload_encoded, signature_encoded = token.split(".")
        signing_input = f"{header_encoded}.{payload_encoded}".encode("utf-8")

        expected_sig = hmac.new(AUTH_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64_decode(signature_encoded)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _b64_decode(payload_encoded)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < int(time.time()):
            return None

        return payload
    except Exception:
        return None
