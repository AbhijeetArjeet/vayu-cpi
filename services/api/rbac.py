"""
services/api/rbac.py
Role-Based Access Control (RBAC) dependencies for FastAPI.
Enforces 401 Unauthorized and 403 Forbidden responses based on authenticated session token and role.
"""

from __future__ import annotations

from typing import List, Dict, Any, Callable
from fastapi import Request, Header, Cookie, HTTPException, status, Depends

from services.auth.session import verify_session_token


def get_current_user(
    request: Request,
    authorization: str | None = Header(None),
    vayu_session: str | None = Cookie(None),
) -> Dict[str, Any]:
    """
    Extracts and validates JWT session token from Cookie or Authorization header.
    Returns authenticated user payload dict or raises 401 Unauthorized.
    """
    token = None
    if vayu_session:
        token = vayu_session
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing session token or cookie.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_session_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please authenticate again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def require_role(allowed_roles: List[str]):
    """FastAPI dependency factory enforcing allowed user roles."""

    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "USER")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Required role: {', '.join(allowed_roles)}. Your role: {user_role}.",
            )
        return current_user

    return role_checker


# Convenient role dependencies
require_regulator_or_admin = require_role(["REGULATOR", "ADMIN"])
require_admin_only = require_role(["ADMIN"])
