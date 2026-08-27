"""
services/api/routes_admin_users.py
FastAPI router for Admin User Management (adding/modifying regulator accounts). Protected by ADMIN role RBAC.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status

from services.persistence.db import SessionLocal, User
from services.auth.security import sanitize_phone, mask_phone
from services.api.rbac import require_admin_only

router = APIRouter(prefix="/api/v1/admin/users", tags=["Admin User Management"])


class CreateUserPayload(BaseModel):
    name: str = Field(..., description="Full name of official/user")
    phone: str = Field(..., description="Mobile number in E.164 format (+91XXXXXXXXXX)")
    email: Optional[str] = Field(None, description="Email address")
    role: str = Field("REGULATOR", description="Role (REGULATOR or ADMIN)")


class UpdateUserPayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("", status_code=status.HTTP_200_OK)
async def list_users(admin_user: Dict[str, Any] = Depends(require_admin_only)) -> List[Dict[str, Any]]:
    """Returns list of registered users (ADMIN role required)."""
    session = SessionLocal()
    try:
        users = session.query(User).order_by(User.created_at.desc()).all()
        return [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "phone_masked": mask_phone(u.phone),
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
                "last_login_at": u.last_login_at,
            }
            for u in users
        ]
    finally:
        session.close()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUserPayload, admin_user: Dict[str, Any] = Depends(require_admin_only)) -> Dict[str, Any]:
    """Registers a new authorized REGULATOR or ADMIN account."""
    clean_phone = sanitize_phone(payload.phone)
    if payload.role not in ("USER", "REGULATOR", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified. Allowed values: REGULATOR, ADMIN, USER.",
        )

    session = SessionLocal()
    try:
        existing = session.query(User).filter(User.phone == clean_phone).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with phone number {mask_phone(clean_phone)} is already registered.",
            )

        new_id = f"usr_{uuid.uuid4().hex[:12]}"
        new_user = User(
            id=new_id,
            name=payload.name.strip(),
            email=payload.email.strip() if payload.email else None,
            phone=clean_phone,
            role=payload.role,
            is_active=True,
            created_at=datetime.now().isoformat(),
            last_login_at=None,
        )
        session.add(new_user)
        session.commit()

        return {
            "status": "created",
            "message": f"Successfully registered user {new_user.name} ({new_user.role}).",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "phone_masked": mask_phone(new_user.phone),
                "role": new_user.role,
                "is_active": new_user.is_active,
            },
        }
    finally:
        session.close()


@router.patch("/{user_id}", status_code=status.HTTP_200_OK)
async def update_user(user_id: str, payload: UpdateUserPayload, admin_user: Dict[str, Any] = Depends(require_admin_only)) -> Dict[str, Any]:
    """Updates user details or activates/deactivates user status."""
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user record not found.",
            )

        if payload.name is not None:
            user.name = payload.name.strip()
        if payload.phone is not None:
            user.phone = sanitize_phone(payload.phone)
        if payload.email is not None:
            user.email = payload.email.strip()
        if payload.role is not None:
            if payload.role in ("USER", "REGULATOR", "ADMIN"):
                user.role = payload.role
        if payload.is_active is not None:
            user.is_active = payload.is_active

        session.commit()

        return {
            "status": "updated",
            "message": f"User {user.name} updated successfully.",
            "user": {
                "id": user.id,
                "name": user.name,
                "phone_masked": mask_phone(user.phone),
                "role": user.role,
                "is_active": user.is_active,
            },
        }
    finally:
        session.close()
