"""
services/api/routes_auth.py
FastAPI router for Regulator OTP request, verification, session validation, and logout.
"""

from __future__ import annotations

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Request, Response, Depends, status

from services.auth.auth_service import request_regulator_otp, verify_regulator_otp
from services.api.rbac import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class OtpRequestPayload(BaseModel):
    phone: str = Field(..., description="Registered mobile number (e.g. +919876543210)")


class OtpVerifyPayload(BaseModel):
    phone: str = Field(..., description="Registered mobile number")
    otp: str = Field(..., description="6-digit verification OTP code")


@router.post("/regulator/request-otp", status_code=status.HTTP_200_OK)
async def request_otp_endpoint(payload: OtpRequestPayload, request: Request) -> Dict[str, Any]:
    """Generates and dispatches 6-digit SMS verification OTP to authorized regulator phone."""
    client_ip = request.client.host if request.client else None
    return request_regulator_otp(payload.phone, ip_address=client_ip)


@router.post("/regulator/verify-otp", status_code=status.HTTP_200_OK)
async def verify_otp_endpoint(payload: OtpVerifyPayload, request: Request, response: Response) -> Dict[str, Any]:
    """Verifies candidate 6-digit OTP code and returns authenticated session token + sets HttpOnly cookie."""
    client_ip = request.client.host if request.client else None
    result = verify_regulator_otp(payload.phone, payload.otp, ip_address=client_ip)

    # Set secure HttpOnly session cookie
    token = result.get("token")
    if token:
        response.set_cookie(
            key="vayu_session",
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,  # Set True in HTTPS production; lax allows localhost/cross-origin dev
            max_age=43200,  # 12 hours
        )
    return result


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout_endpoint(response: Response, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Invalidates current user session and clears HttpOnly cookie."""
    response.delete_cookie(key="vayu_session")
    return {"status": "logged_out", "message": "Successfully logged out of VAYU Regulatory Intelligence Portal."}


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Returns profile and role metadata for current authenticated session."""
    from services.auth.security import mask_phone
    return {
        "authenticated": True,
        "user": {
            "id": current_user.get("sub"),
            "name": current_user.get("name"),
            "role": current_user.get("role"),
            "phone_masked": mask_phone(current_user.get("phone", "")),
        }
    }
