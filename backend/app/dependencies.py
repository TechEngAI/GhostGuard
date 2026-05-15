from typing import Any, Optional

from fastapi import Header, HTTPException, Request

from app.database import get_supabase, get_supabase_auth_client, get_supabase_db_client
from app.errors import AppError


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError(401, "UNAUTHORIZED", "Bearer token is required.")
    return authorization.split(" ", 1)[1].strip()


def _current_profile(authorization: str | None, user_type: str) -> dict[str, Any]:
    token = _extract_bearer_token(authorization)
    db = get_supabase()
    try:
        response = get_supabase_auth_client().auth.get_user(token)
    except Exception as exc:
        raise AppError(401, "INVALID_TOKEN", "Token is invalid or expired.") from exc
    if not getattr(response, "user", None):
        raise AppError(401, "INVALID_TOKEN", "Token is invalid or expired.")
    auth_user = response.user
    metadata = getattr(auth_user, "user_metadata", None) or {}
    if metadata.get("user_type") and metadata.get("user_type") != user_type:
        raise AppError(403, "UNAUTHORIZED", f"{user_type.title()} access is required.")
    table = "admins" if user_type == "admin" else "workers"
    profile_result = db.table(table).select("*").eq("auth_user_id", auth_user.id).maybe_single().execute()
    profile = profile_result.data if profile_result is not None else None
    if not profile:
        email = getattr(auth_user, "email", None)
        if email:
            fallback_result = db.table(table).select("*").eq("email", str(email).lower()).maybe_single().execute()
            profile = fallback_result.data if fallback_result is not None else None
    if not profile:
        code = "NOT_AN_ADMIN" if user_type == "admin" else "NOT_A_WORKER"
        message = "This account does not have admin access." if user_type == "admin" else "This account does not have worker access."
        raise AppError(403, code, message)
    profile["_access_token"] = token
    profile["_auth_user"] = auth_user
    return profile


def get_current_admin(authorization: str | None = Header(None)) -> dict[str, Any]:
    """Resolve the authenticated admin from a bearer access token."""

    admin = _current_profile(authorization, "admin")
    if admin.get("status") != "ACTIVE":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Admin account is not active.")
    return admin


async def get_current_worker(
    authorization: Optional[str] = Header(default=None)
) -> dict:
    """
    Validate worker JWT and return worker profile dict.
    Every error raises HTTPException — never a raw Python exception.
    Raw exceptions cause FastAPI to return 422 instead of the correct status code.
    """

    # Check Authorization header exists
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "MISSING_TOKEN",
                "message": "Authorization header is required. Please log in."
            }
        )

    # Extract the Bearer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_TOKEN_FORMAT",
                "message": "Authorization header must be in format: Bearer {token}"
            }
        )

    token = authorization[7:].strip()  # Remove "Bearer " prefix

    if not token:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "EMPTY_TOKEN",
                "message": "Token is empty. Please log in again."
            }
        )

    # Validate token with Supabase Auth
    try:
        auth_response = get_supabase_auth_client().auth.get_user(token)
    except Exception as e:
        print(f"Supabase auth.get_user() exception: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail={
                "code": "TOKEN_VALIDATION_FAILED",
                "message": "Could not validate your session. Please log in again."
            }
        )

    # Supabase returns response object — user may be None if token invalid/expired
    if not auth_response or not auth_response.user:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_OR_EXPIRED_TOKEN",
                "message": "Your session has expired. Please log in again."
            }
        )

    auth_user_id = auth_response.user.id
    print(f"Auth validated for user: {auth_user_id}")

    # Load worker profile from workers table
    worker_data = None
    try:
        worker_result = get_supabase_db_client().table("workers").select("*").eq(
            "auth_user_id", auth_user_id
        ).maybe_single().execute()
        worker_data = worker_result.data if worker_result is not None else None
    except Exception as e:
        print(f"Worker DB query exception: {type(e).__name__}: {str(e)}")
        if "Missing response" in str(e):
            print("Worker DB query fallback: retrying without maybe_single().")
            try:
                fallback_result = get_supabase_db_client().table("workers").select("*").eq(
                    "auth_user_id", auth_user_id
                ).limit(1).execute()
                if fallback_result is not None:
                    fallback_data = fallback_result.data
                    if isinstance(fallback_data, list) and len(fallback_data) > 0:
                        worker_data = fallback_data[0]
                    else:
                        worker_data = None
            except Exception as ex2:
                print(f"Worker DB fallback query exception: {type(ex2).__name__}: {str(ex2)}")
                raise HTTPException(
                    status_code=500,
                    detail={
                        "code": "DATABASE_ERROR",
                        "message": "Could not load your profile. Please try again."
                    }
                )
        else:
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "DATABASE_ERROR",
                    "message": "Could not load your profile. Please try again."
                }
            )

    if isinstance(worker_data, list):
        worker_data = worker_data[0] if worker_data else None

    # Check worker record exists
    if not worker_data:
        print(f"No worker found for auth_user_id: {auth_user_id}")
        raise HTTPException(
            status_code=403,
            detail={
                "code": "NOT_A_WORKER",
                "message": "This account does not have worker access."
            }
        )

    worker = worker_data

    # Check account status — never allow suspended or deleted workers
    status = worker.get("status", "")
    if status == "SUSPENDED":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ACCOUNT_SUSPENDED",
                "message": "Your account has been suspended. Contact your administrator."
            }
        )

    if status == "DELETED":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ACCOUNT_DELETED",
                "message": "This account no longer exists."
            }
        )

    print(f"Worker loaded: id={worker.get('id')}, status={status}, bank_verified={worker.get('bank_verified')}")
    return worker


def get_current_hr(authorization: str | None = Header(None)) -> dict[str, Any]:
    """Resolve the authenticated HR officer from a bearer access token."""

    token = _extract_bearer_token(authorization)
    db = get_supabase()
    try:
        response = get_supabase_auth_client().auth.get_user(token)
    except Exception as exc:
        raise AppError(401, "INVALID_TOKEN", "Token is invalid or expired.") from exc
    if not getattr(response, "user", None):
        raise AppError(401, "INVALID_TOKEN", "Token is invalid or expired.")
    auth_user = response.user
    metadata = getattr(auth_user, "user_metadata", None) or {}
    if metadata.get("user_type") and metadata.get("user_type") != "hr":
        raise AppError(403, "UNAUTHORIZED", "HR access is required.")
    profile_result = db.table("hr_officers").select("*").eq("auth_user_id", auth_user.id).maybe_single().execute()
    if not profile_result.data:
        raise AppError(403, "NOT_HR", "This account does not have HR access.")
    hr = profile_result.data
    if hr.get("status") != "ACTIVE":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Account suspended.")
    hr["_access_token"] = token
    hr["_auth_user"] = auth_user
    return hr
