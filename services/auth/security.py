"""
services/auth/security.py
Cryptographic utilities, OTP generation, hashing, phone masking, and phone normalization.
"""

from __future__ import annotations

import os
import re
import secrets
import hashlib
from typing import Optional

AUTH_SECRET = os.getenv("AUTH_SECRET", "vayu_sih2026_jwt_secret_key_change_in_production")


def generate_secure_otp() -> str:
    """Generates a cryptographically random 6-digit OTP string (100000-999999)."""
    val = secrets.randbelow(900000) + 100000
    return str(val)


def hash_otp(otp_code: str) -> str:
    """Computes SHA-256 digest of raw OTP with AUTH_SECRET salt. Plaintext OTP is NEVER stored."""
    salted = f"{otp_code}:{AUTH_SECRET}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def verify_otp_hash(otp_code: str, stored_hash: str) -> bool:
    """Verifies candidate OTP code against stored SHA-256 challenge hash in constant time."""
    candidate_hash = hash_otp(otp_code)
    return secrets.compare_digest(candidate_hash, stored_hash)


def sanitize_phone(phone: str) -> str:
    """Normalizes Indian phone numbers into clean E.164 format (+91XXXXXXXXXX)."""
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    elif len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) > 10:
        return f"+{digits}"
    return phone.strip()


def mask_phone(phone: str) -> str:
    """Masks phone number for privacy display (+91 ****** 1234)."""
    clean = sanitize_phone(phone)
    if len(clean) >= 10:
        last4 = clean[-4:]
        prefix = clean[:3] if clean.startswith("+91") else clean[:2]
        return f"{prefix} ****** {last4}"
    return "+91 ****** XXXX"
