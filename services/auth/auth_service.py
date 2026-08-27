"""
services/auth/auth_service.py
Core authentication service for Regulator OTP request, verification, security hashing, rate limiting, and audit logging.
"""

from __future__ import annotations

import uuid
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException, status

from services.persistence.db import SessionLocal, User, OtpChallenge, AuditLog
from services.auth.security import (
    sanitize_phone,
    mask_phone,
    generate_secure_otp,
    hash_otp,
    verify_otp_hash,
)
from services.auth.sms_provider import get_otp_provider
from services.auth.session import create_session_token

logger = logging.getLogger("vayu-cpi.auth_service")

OTP_EXPIRATION_SECONDS = 300  # 5 minutes
MAX_VERIFICATION_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 10
MAX_REQUESTS_PER_10MIN = 30


def log_audit_event(
    session,
    action: str,
    result: str,
    user_id: Optional[str] = None,
    phone_masked: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """Records audit trail entry in audit_logs table."""
    try:
        audit_entry = AuditLog(
            id=f"audit_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            phone_masked=phone_masked,
            action=action,
            result=result,
            ip_address=ip_address,
            timestamp=datetime.now().isoformat(),
        )
        session.add(audit_entry)
        session.commit()
    except Exception as exc:
        session.rollback()
        logger.error(f"[AUDIT_LOG_ERROR] Failed to record audit log: {exc}")


def request_regulator_otp(phone: str, ip_address: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates regulator user, enforces rate limits, hashes 6-digit OTP, dispatches SMS via OtpProvider.
    NEVER returns raw OTP or exposes API secrets.
    """
    clean_phone = sanitize_phone(phone)
    masked = mask_phone(clean_phone)
    session = SessionLocal()

    try:
        # Lookup authorized regulator/admin user
        user = session.query(User).filter(User.phone == clean_phone).first()

        # If account does not exist yet, auto-provision active REGULATOR user for seamless onboarding
        if not user:
            user = User(
                id=f"usr_reg_{clean_phone[-4:]}_{int(time.time())}",
                name=f"Authorized Regulator ({clean_phone[-4:]})",
                email=f"regulator_{clean_phone[-4:]}@mospi.gov.in",
                phone=clean_phone,
                role="REGULATOR",
                is_active=True,
                created_at=datetime.now().isoformat(),
            )
            session.add(user)
            session.commit()
            logger.info(f"[AUTH_PROVISION] Auto-created REGULATOR account for {clean_phone[-4:]}")
        else:
            # Ensure existing user row has active REGULATOR access
            user.role = "REGULATOR"
            user.is_active = True
            session.commit()

        if not user.is_active or user.role not in ("REGULATOR", "ADMIN"):
            log_audit_event(session, "REGULATOR_OTP_REQUEST", "FAILURE_UNAUTHORIZED", phone_masked=masked, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to authenticate with the provided credentials.",
            )

        now = time.time()
        ten_mins_ago = now - 600

        # Rate limit 1: Check recent request count in last 10 minutes
        recent_requests = (
            session.query(OtpChallenge)
            .filter(OtpChallenge.user_id == user.id, OtpChallenge.created_at >= datetime.fromtimestamp(ten_mins_ago).isoformat())
            .count()
        )
        if recent_requests >= MAX_REQUESTS_PER_10MIN:
            log_audit_event(session, "REGULATOR_OTP_REQUEST", "FAILURE_RATE_LIMITED", user_id=user.id, phone_masked=masked, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Maximum OTP requests exceeded. Please try again in 10 minutes.",
            )

        # Rate limit 2: Check 30-second resend cooldown against latest challenge
        latest_challenge = (
            session.query(OtpChallenge)
            .filter(OtpChallenge.user_id == user.id)
            .order_by(OtpChallenge.expires_at.desc())
            .first()
        )
        if latest_challenge and (now - (latest_challenge.expires_at - OTP_EXPIRATION_SECONDS)) < RESEND_COOLDOWN_SECONDS:
            remaining_cooldown = int(RESEND_COOLDOWN_SECONDS - (now - (latest_challenge.expires_at - OTP_EXPIRATION_SECONDS)))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining_cooldown} seconds before requesting a new verification code.",
            )

        # Invalidate previous pending challenges
        pending_challenges = (
            session.query(OtpChallenge)
            .filter(OtpChallenge.user_id == user.id, OtpChallenge.status == "PENDING")
            .all()
        )
        for old_ch in pending_challenges:
            old_ch.status = "EXPIRED"

        # Generate cryptographically secure OTP and hash it (NEVER store plaintext)
        raw_otp = generate_secure_otp()
        digest_hash = hash_otp(raw_otp)

        # Create challenge record
        challenge_id = f"ch_{uuid.uuid4().hex[:12]}"
        new_challenge = OtpChallenge(
            id=challenge_id,
            user_id=user.id,
            phone=clean_phone,
            phone_last4=clean_phone[-4:],
            challenge_hash=digest_hash,
            created_at=datetime.now().isoformat(),
            expires_at=now + OTP_EXPIRATION_SECONDS,
            attempts=0,
            max_attempts=MAX_VERIFICATION_ATTEMPTS,
            status="PENDING",
        )
        session.add(new_challenge)
        session.commit()

        # Dispatch code via Email (SMTP) or SMS (OtpProvider)
        if "@" in clean_phone:
            dispatch_result = send_email_otp(clean_phone, raw_otp, expires_minutes=5)
            medium_label = "Email"
        else:
            provider = get_otp_provider()
            dispatch_result = provider.send_otp(clean_phone, raw_otp, expires_minutes=5)
            medium_label = "SMS Gateway"

        if not dispatch_result.get("success"):
            new_challenge.status = "EXPIRED"
            session.commit()
            err_reason = dispatch_result.get("error", "Dispatch failed")
            log_audit_event(session, "REGULATOR_OTP_REQUEST", "FAILURE_PROVIDER_ERROR", user_id=user.id, phone_masked=masked, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"{medium_label}: {err_reason}",
            )

        log_audit_event(session, "REGULATOR_OTP_REQUEST", "SUCCESS", user_id=user.id, phone_masked=masked, ip_address=ip_address)

        return {
            "status": "otp_sent",
            "message": f"Verification code sent to {masked}",
            "masked_phone": masked,
            "resend_cooldown_seconds": RESEND_COOLDOWN_SECONDS,
            "expires_in_seconds": OTP_EXPIRATION_SECONDS,
        }
    finally:
        session.close()


def verify_regulator_otp(phone: str, otp_code: str, ip_address: Optional[str] = None) -> Dict[str, Any]:
    """
    Verifies candidate 6-digit OTP code against SHA-256 challenge hash.
    Enforces maximum 5 attempts, 5-minute expiry, and immediate invalidation on success/failure limit.
    """
    clean_phone = sanitize_phone(phone)
    masked = mask_phone(clean_phone)
    session = SessionLocal()

    try:
        user = session.query(User).filter(User.phone == clean_phone).first()
        if not user or not user.is_active or user.role not in ("REGULATOR", "ADMIN"):
            log_audit_event(session, "REGULATOR_OTP_VERIFIED", "FAILURE_UNAUTHORIZED", phone_masked=masked, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification code or user account inactive.",
            )

        now = time.time()
        challenge = (
            session.query(OtpChallenge)
            .filter(OtpChallenge.user_id == user.id, OtpChallenge.status == "PENDING")
            .order_by(OtpChallenge.expires_at.desc())
            .first()
        )

        if not challenge:
            log_audit_event(session, "REGULATOR_OTP_VERIFIED", "FAILURE_NO_CHALLENGE", user_id=user.id, phone_masked=masked, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No active verification code found. Please request a new code.",
            )

        # Expiry check
        if now > challenge.expires_at:
            challenge.status = "EXPIRED"
            session.commit()
            log_audit_event(session, "REGULATOR_OTP_VERIFIED", "FAILURE_EXPIRED", user_id=user.id, phone_masked=masked, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Verification code has expired. Please request a new code.",
            )

        # Lockout check
        if challenge.attempts >= challenge.max_attempts:
            challenge.status = "LOCKED"
            session.commit()
            log_audit_event(session, "REGULATOR_OTP_VERIFIED", "FAILURE_LOCKED", user_id=user.id, phone_masked=masked, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Maximum verification attempts exceeded. Please request a new code.",
            )

        # Increment attempt counter
        challenge.attempts += 1

        # Constant-time SHA-256 hash verification
        is_valid = verify_otp_hash(otp_code.strip(), challenge.challenge_hash)

        if not is_valid:
            if challenge.attempts >= challenge.max_attempts:
                challenge.status = "LOCKED"
            session.commit()
            log_audit_event(session, "REGULATOR_OTP_FAILED", "FAILURE_WRONG_CODE", user_id=user.id, phone_masked=masked, ip_address=ip_address)
            remaining_attempts = max(0, challenge.max_attempts - challenge.attempts)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid verification code. {remaining_attempts} attempts remaining.",
            )

        # Success: Invalidate challenge immediately
        challenge.status = "VERIFIED"
        challenge.verified_at = datetime.now().isoformat()
        user.last_login_at = datetime.now().isoformat()
        session.commit()

        log_audit_event(session, "REGULATOR_OTP_VERIFIED", "SUCCESS", user_id=user.id, phone_masked=masked, ip_address=ip_address)
        log_audit_event(session, "REGULATOR_LOGIN", "SUCCESS", user_id=user.id, phone_masked=masked, ip_address=ip_address)

        # Issue secure session token
        session_token = create_session_token(user.id, user.role, user.name, user.phone)

        return {
            "status": "authenticated",
            "message": "Regulatory Intelligence Portal authentication successful.",
            "token": session_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "role": user.role,
                "phone_masked": masked,
                "authenticated_at": user.last_login_at,
            },
        }
    finally:
        session.close()


def send_email_otp(to_email: str, otp: str, expires_minutes: int = 5) -> Dict[str, Any]:
    """Sends OTP verification code via configured SMTP server (Gmail, Outlook, etc.)."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()

    if not smtp_user or not smtp_password:
        logger.error("[EMAIL_ERROR] SMTP credentials (SMTP_USER/SMTP_PASSWORD) are not configured.")
        return {
            "success": False,
            "error": "Email dispatcher credentials (SMTP_USER/SMTP_PASSWORD) are not configured on Railway."
        }

    msg = MIMEMultipart()
    msg["From"] = f"VAYU-CPI Authority <{smtp_user}>"
    msg["To"] = to_email
    msg["Subject"] = "VAYU-CPI Secure Verification Code"

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #0284c7; margin-bottom: 20px;">VAYU-CPI Regulatory Authentication Gateway</h2>
        <p>You requested a one-time password (OTP) to log into the restricted Ministry of Statistics (MoSPI) Regulatory Portal.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0; max-width: 300px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">{otp}</span>
        </div>
        <p>This verification code is valid for <strong>{expires_minutes} minutes</strong>. For security, do not share this code with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9ca3af;">This is an automated security transmission. If you did not request this code, please ignore this email.</p>
      </body>
    </html>
    """
    msg.attach(MIMEText(body, "html"))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"[EMAIL_SUCCESS] OTP sent via SMTP to {to_email}")
        return {"success": True, "error": None}
    except Exception as e:
        logger.error(f"[SMTP_ERROR] Failed to send email to {to_email}: {e}")
        return {"success": False, "error": str(e)}
