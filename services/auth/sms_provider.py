"""
services/auth/sms_provider.py
Abstract SMS OTP Provider layer supporting MSG91, Twilio, Fast2SMS, AWS SNS, and Test mock.
"""

from __future__ import annotations

import os
import json
import logging
import urllib.request
import urllib.parse
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

logger = logging.getLogger("vayu-cpi.sms")


class OtpProvider(ABC):
    """Abstract SMS OTP Provider Interface."""

    @abstractmethod
    def send_otp(self, phone: str, otp: str, expires_minutes: int = 5) -> Dict[str, Any]:
        """
        Dispatches SMS verification OTP to target phone number.
        Returns dict with status, provider name, and sanitized log message.
        MUST NEVER expose API credentials or raw OTP in return payload.
        """
        pass


class Msg91OtpProvider(OtpProvider):
    """MSG91 SMS Provider Integration for India."""

    def __init__(self):
        self.auth_key = os.getenv("MSG91_API_KEY", "")
        self.template_id = os.getenv("MSG91_TEMPLATE_ID", "")
        self.sender_id = os.getenv("MSG91_SENDER_ID", "VAYUPI")

    def send_otp(self, phone: str, otp: str, expires_minutes: int = 5) -> Dict[str, Any]:
        if not self.auth_key:
            logger.error("[SMS_ERROR] MSG91_API_KEY environment variable is not configured.")
            return {"success": False, "provider": "msg91", "error": "SMS provider credentials missing."}

        # Format phone (ensure +91 strip or clean E.164)
        clean_phone = phone.replace("+", "").replace(" ", "").strip()
        url = "https://api.msg91.com/api/v5/otp"
        headers = {
            "authkey": self.auth_key,
            "Content-Type": "application/json"
        }
        payload = {
            "template_id": self.template_id,
            "mobile": clean_phone,
            "otp": otp,
            "otp_expiry": expires_minutes
        }
        if self.sender_id:
            payload["sender"] = self.sender_id

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                if resp.status in (200, 201) and resp_data.get("type") != "error":
                    logger.info(f"[SMS_SUCCESS] OTP sent via MSG91 to {clean_phone[-4:]}")
                    return {"success": True, "provider": "msg91", "error": None}
                else:
                    err_msg = resp_data.get("message", "MSG91 dispatch failed")
                    logger.error(f"[SMS_ERROR] MSG91 failed: {err_msg}")
                    return {"success": False, "provider": "msg91", "error": err_msg}
        except Exception as exc:
            logger.error(f"[SMS_EXCEPTION] MSG91 request exception: {exc}")
            return {"success": False, "provider": "msg91", "error": "SMS provider dispatch failed."}


class TwilioOtpProvider(OtpProvider):
    """Twilio SMS Provider Integration."""

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.from_phone = os.getenv("TWILIO_FROM_NUMBER", "")

    def send_otp(self, phone: str, otp: str, expires_minutes: int = 5) -> Dict[str, Any]:
        if not self.account_sid or not self.auth_token or not self.from_phone:
            logger.error("[SMS_ERROR] Twilio credentials (SID/Token/FromNumber) missing.")
            return {"success": False, "provider": "twilio", "error": "SMS provider credentials missing."}

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        msg_body = f"Your VAYU-CPI verification code is {otp}. Valid for {expires_minutes} minutes. Do not share this code."
        payload = urllib.parse.urlencode({
            "To": phone,
            "From": self.from_phone,
            "Body": msg_body
        }).encode("utf-8")

        # HTTP Basic Auth header
        import base64
        auth_header = base64.b64encode(f"{self.account_sid}:{self.auth_token}".encode("utf-8")).decode("ascii")
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    logger.info(f"[SMS_SUCCESS] OTP sent via Twilio to {phone[-4:]}")
                    return {"success": True, "provider": "twilio", "error": None}
                return {"success": False, "provider": "twilio", "error": "Twilio dispatch failed."}
        except Exception as exc:
            logger.error(f"[SMS_EXCEPTION] Twilio exception: {exc}")
            return {"success": False, "provider": "twilio", "error": "Twilio SMS dispatch failed."}


class Fast2SmsOtpProvider(OtpProvider):
    """Fast2SMS Provider Integration for India."""

    def __init__(self):
        self.api_key = os.getenv("FAST2SMS_API_KEY", "").strip()

    def send_otp(self, phone: str, otp: str, expires_minutes: int = 5) -> Dict[str, Any]:
        if not self.api_key:
            logger.error("[SMS_ERROR] FAST2SMS_API_KEY environment variable is not configured.")
            return {"success": False, "provider": "fast2sms", "error": "FAST2SMS_API_KEY is not configured on server."}

        # Fast2SMS requires 10-digit Indian mobile number
        digits = re.sub(r"\D", "", phone or "")
        clean_phone = digits[-10:] if len(digits) >= 10 else digits

        url = "https://www.fast2sms.com/dev/bulkV2"
        headers = {
            "authorization": self.api_key,
            "Content-Type": "application/json"
        }
        payload = json.dumps({
            "route": "otp",
            "variables_values": str(otp),
            "numbers": clean_phone
        }).encode("utf-8")

        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=12) as resp:
                resp_text = resp.read().decode("utf-8")
                resp_data = json.loads(resp_text)
                if resp_data.get("return") is True:
                    logger.info(f"[SMS_SUCCESS] OTP sent via Fast2SMS to {clean_phone[-4:]}")
                    return {"success": True, "provider": "fast2sms", "error": None}
                
                messages = resp_data.get("message", ["Fast2SMS dispatch failed"])
                err_msg = messages[0] if isinstance(messages, list) and messages else str(messages)
                logger.error(f"[SMS_ERROR] Fast2SMS returned error: {err_msg}")
                return {"success": False, "provider": "fast2sms", "error": err_msg}
        except urllib.error.HTTPError as http_err:
            err_body = http_err.read().decode("utf-8", errors="ignore")
            logger.error(f"[SMS_HTTP_ERROR] Fast2SMS HTTP {http_err.code}: {err_body}")
            try:
                err_json = json.loads(err_body)
                messages = err_json.get("message", [str(http_err)])
                err_detail = messages[0] if isinstance(messages, list) and messages else str(messages)
            except Exception:
                err_detail = f"Fast2SMS HTTP {http_err.code}"
            return {"success": False, "provider": "fast2sms", "error": err_detail}
        except Exception as exc:
            logger.error(f"[SMS_EXCEPTION] Fast2SMS exception: {exc}")
            return {"success": False, "provider": "fast2sms", "error": f"SMS connection error: {str(exc)}"}


class MockTestOtpProvider(OtpProvider):
    """Test Mock Provider for automated pytest suites and local offline dev."""

    def __init__(self):
        self.last_sent_otp: Optional[str] = None
        self.last_sent_phone: Optional[str] = None

    def send_otp(self, phone: str, otp: str, expires_minutes: int = 5) -> Dict[str, Any]:
        env_mode = os.getenv("ENVIRONMENT", "development").lower()
        is_railway = os.getenv("RAILWAY_ENVIRONMENT") is not None
        if env_mode == "production" or is_railway:
            logger.critical("[SECURITY_VIOLATION] Attempted to use MockTestOtpProvider in production environment!")
            return {"success": False, "provider": "test_disabled", "error": "Test SMS provider is disabled in production."}

        self.last_sent_otp = otp
        self.last_sent_phone = phone
        logger.info(f"[SMS_TEST_MOCK] Dispatched test OTP to {phone[-4:]} (Expires in {expires_minutes}m)")
        return {"success": True, "provider": "test_mock", "error": None}


_SINGLETON_PROVIDER: Optional[OtpProvider] = None


def get_otp_provider() -> OtpProvider:
    """Factory returns configured OTP provider based on OTP_PROVIDER env var."""
    global _SINGLETON_PROVIDER
    if _SINGLETON_PROVIDER is not None:
        return _SINGLETON_PROVIDER

    provider_name = os.getenv("OTP_PROVIDER", "fast2sms").lower()
    env_name = os.getenv("ENVIRONMENT", "development").lower()
    is_railway = os.getenv("RAILWAY_ENVIRONMENT") is not None

    if provider_name == "msg91":
        _SINGLETON_PROVIDER = Msg91OtpProvider()
    elif provider_name == "twilio":
        _SINGLETON_PROVIDER = TwilioOtpProvider()
    elif provider_name == "fast2sms":
        _SINGLETON_PROVIDER = Fast2SmsOtpProvider()
    elif provider_name == "test":
        if env_name == "production" or is_railway:
            logger.warning("[SMS_WARN] OTP_PROVIDER=test set in production. Defaulting to Fast2SmsOtpProvider.")
            _SINGLETON_PROVIDER = Fast2SmsOtpProvider()
        else:
            _SINGLETON_PROVIDER = MockTestOtpProvider()
    else:
        _SINGLETON_PROVIDER = Fast2SmsOtpProvider()

    return _SINGLETON_PROVIDER
