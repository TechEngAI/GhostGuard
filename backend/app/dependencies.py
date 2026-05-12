from typing import Any

from fastapi import Header

from app.database import get_supabase
from app.errors import AppError


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError(401, "UNAUTHORIZED", "Bearer token is required.")
    return authorization.split(" ", 1)[1].strip()


def _current_profile(authorization: str | None, user_type: str) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    db = get_supabase()
    try:
        response = db.auth.get_user(token)
    except Exception as exc:
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token.") from exc
    if not getattr(response, "user", None):
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token.")
    auth_user = response.user
    metadata = getattr(auth_user, "user_metadata", None) or {}
    if metadata.get("user_type") and metadata.get("user_type") != user_type:
        raise AppError(403, "UNAUTHORIZED", f"{user_type.title()} access is required.")
    table = "admins" if user_type == "admin" else "workers"
    rows = db.table(table).select("*").eq("auth_user_id", auth_user.id).limit(1).execute().data
    if not rows:
        raise AppError(404, "NOT_FOUND", "Authenticated profile was not found.")
    profile = rows[0]
    profile["_access_token"] = token
    profile["_auth_user"] = auth_user
    return profile


def get_current_admin(authorization: str | None = Header(None)) -> dict[str, Any]:
    """Resolve the authenticated admin from a bearer access token."""

    admin = _current_profile(authorization, "admin")
    if admin.get("status") != "ACTIVE":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Admin account is not active.")
    return admin


def get_current_worker(authorization: str | None = Header(None)) -> dict[str, Any]:
    """Resolve the authenticated worker from a bearer access token."""

    worker = _current_profile(authorization, "worker")
    if worker.get("status") == "SUSPENDED":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Worker account is suspended.")
    if worker.get("status") == "DELETED":
        raise AppError(403, "ACCOUNT_DELETED", "Worker account has been deleted.")
    return worker


def get_current_hr(authorization: str | None = Header(None)) -> dict[str, Any]:
    """Resolve the authenticated HR officer from a bearer access token."""

    token = _extract_bearer_token(authorization)
    db = get_supabase()
    try:
        response = db.auth.get_user(token)
    except Exception as exc:
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token.") from exc
    if not getattr(response, "user", None):
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token.")
    auth_user = response.user
    metadata = getattr(auth_user, "user_metadata", None) or {}
    if metadata.get("user_type") and metadata.get("user_type") != "hr":
        raise AppError(403, "UNAUTHORIZED", "HR access is required.")
    rows = db.table("hr_officers").select("*").eq("auth_user_id", auth_user.id).limit(1).execute().data
    if not rows:
        raise AppError(401, "UNAUTHORIZED", "This account does not have HR access.")
    hr = rows[0]
    if hr.get("status") != "ACTIVE":
        raise AppError(401, "ACCOUNT_SUSPENDED", "Account suspended.")
    hr["_access_token"] = token
    hr["_auth_user"] = auth_user
    return hr
