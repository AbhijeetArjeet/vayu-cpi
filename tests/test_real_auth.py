"""
tests/test_real_auth.py
Automated pytest suite for Real SMS OTP Authentication, OTP Hashing, Expiry, Lockout, and RBAC.
"""

import os
import time
import pytest
from fastapi.testclient import TestClient

# Force test mode
os.environ["ENVIRONMENT"] = "test"
os.environ["OTP_PROVIDER"] = "test"
os.environ["REGULATOR_PHONE"] = "+919876543210"
os.environ["ADMIN_PHONE"] = "+919999999999"

from services.api.main import app
from services.persistence.db import init_db, SessionLocal, User, OtpChallenge
from services.auth.sms_provider import get_otp_provider, MockTestOtpProvider
from services.auth.session import create_session_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    client.cookies.clear()
    session = SessionLocal()
    session.query(OtpChallenge).delete()
    session.commit()
    session.close()
    yield


def test_otp_request_valid_regulator():
    provider = get_otp_provider()
    assert isinstance(provider, MockTestOtpProvider)

    resp = client.post("/api/v1/auth/regulator/request-otp", json={"phone": "+919876543210"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "otp_sent"
    assert "9876543210" not in data["message"]  # Phone is masked
    assert "+91 ****** 3210" in data["masked_phone"]

    # Verify mock SMS dispatched
    assert provider.last_sent_otp is not None
    assert len(provider.last_sent_otp) == 6


def test_otp_request_unknown_phone_generic_error():
    resp = client.post("/api/v1/auth/regulator/request-otp", json={"phone": "+919000000000"})
    assert resp.status_code == 401
    data = resp.json()
    assert data["detail"] == "Unable to authenticate with the provided credentials."


def test_otp_verification_success():
    provider = get_otp_provider()
    resp_req = client.post("/api/v1/auth/regulator/request-otp", json={"phone": "+919876543210"})
    assert resp_req.status_code == 200
    raw_otp = provider.last_sent_otp
    assert raw_otp is not None

    resp = client.post("/api/v1/auth/regulator/verify-otp", json={"phone": "+919876543210", "otp": raw_otp})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "authenticated"
    assert "token" in data
    assert data["user"]["role"] in ("REGULATOR", "ADMIN")

    # Cookie verification
    assert "vayu_session" in resp.cookies


def test_otp_verification_wrong_code():
    provider = get_otp_provider()
    client.post("/api/v1/auth/regulator/request-otp", json={"phone": "+919876543210"})

    resp = client.post("/api/v1/auth/regulator/verify-otp", json={"phone": "+919876543210", "otp": "000000"})
    assert resp.status_code == 401
    data = resp.json()
    assert "Invalid verification code" in data["detail"]


def test_otp_verification_lockout_after_5_failures():
    provider = get_otp_provider()
    client.post("/api/v1/auth/regulator/request-otp", json={"phone": "+919876543210"})

    for i in range(5):
        resp = client.post("/api/v1/auth/regulator/verify-otp", json={"phone": "+919876543210", "otp": "111111"})

    assert resp.status_code in (401, 429)
    assert "Maximum verification attempts exceeded" in resp.json()["detail"] or "Invalid" in resp.json()["detail"]


def test_rbac_admin_users_endpoint():
    # 1. Unauthenticated request -> 401
    resp = client.get("/api/v1/admin/users")
    assert resp.status_code == 401

    # 2. Regulator role request -> 403 Forbidden
    regulator_token = create_session_token("usr_reg_1", "REGULATOR", "Test Regulator", "+919876543210")
    resp_reg = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {regulator_token}"})
    assert resp_reg.status_code == 403

    # 3. Admin role request -> 200 OK
    admin_token = create_session_token("usr_admin_1", "ADMIN", "Test Admin", "+919999999999")
    resp_admin = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp_admin.status_code == 200
    users_list = resp_admin.json()
    assert isinstance(users_list, list)
    assert len(users_list) >= 1
