from datetime import UTC, datetime
from typing import Any, Literal

from fastapi.encoders import jsonable_encoder

from app.auth.schemas import (
    AdminRegisterRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    WorkerRegisterRequest,
)
from app.database import get_supabase
from app.errors import AppError
from app.profile import calculate_completeness

UserType = Literal["admin", "worker"]


def _auth_user_id(auth_response: Any) -> str:
    user = getattr(auth_response, "user", None)
    if not user:
        raise AppError(502, "AUTH_PROVIDER_ERROR", "Supabase Auth did not return a user.")
    return str(user.id)


def _auth_session(auth_response: Any) -> Any:
    session = getattr(auth_response, "session", None)
    if not session:
        raise AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.")
    return session


def _table_for(user_type: UserType) -> str:
    return "admins" if user_type == "admin" else "workers"


def _public_profile(profile: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in profile.items() if not key.startswith("_")}


def _email_exists(table: str, email: str) -> bool:
    return bool(get_supabase().table(table).select("id").eq("email", email.lower()).limit(1).execute().data)


def _phone_exists(table: str, phone_number: str | None) -> bool:
    if not phone_number:
        return False
    return bool(get_supabase().table(table).select("id").eq("phone_number", phone_number).limit(1).execute().data)


async def register_admin(payload: AdminRegisterRequest) -> dict[str, Any]:
    """Register an admin with Supabase Auth and create the linked company profile."""

    db = get_supabase()
    email = str(payload.email).lower()
    if _email_exists("admins", email):
        raise AppError(409, "EMAIL_ALREADY_EXISTS", "An admin with this email already exists.", "email")
    if _phone_exists("admins", payload.phone_number):
        raise AppError(409, "PHONE_ALREADY_EXISTS", "An admin with this phone number already exists.", "phone_number")

    try:
        auth_response = db.auth.sign_up(
            {
                "email": email,
                "password": payload.password,
                "options": {
                    "data": {
                        "user_type": "admin",
                        "first_name": payload.first_name,
                        "last_name": payload.last_name,
                    }
                },
            }
        )
    except Exception as exc:
        raise AppError(400, "AUTH_SIGNUP_FAILED", "Unable to create Supabase Auth user.") from exc

    company = (
        db.table("companies")
        .insert({"name": payload.company_name, "size": payload.company_size, "industry": payload.industry})
        .execute()
        .data[0]
    )
    admin_payload = {
        "auth_user_id": _auth_user_id(auth_response),
        "company_id": company["id"],
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "middle_name": payload.middle_name,
        "email": email,
        "phone_number": payload.phone_number,
        "gender": payload.gender,
        "date_of_birth": payload.date_of_birth,
        "status": "ACTIVE",
        "verif_channel": payload.verif_channel,
    }
    admin = db.table("admins").insert(jsonable_encoder(admin_payload)).execute().data[0]
    await write_audit(admin["id"], "admin", "CREATE_COMPANY", company["id"], "company", {"after": company})
    return {"admin": _public_profile(admin), "company": company}


async def register_worker(payload: WorkerRegisterRequest) -> dict[str, Any]:
    """Register a worker with Supabase Auth using a valid role invite code."""

    db = get_supabase()
    email = str(payload.email).lower()
    roles = db.table("roles").select("*").eq("invite_code", payload.invite_code).eq("code_active", True).limit(1).execute().data
    if not roles:
        raise AppError(400, "INVALID_INVITE_CODE", "Invalid or expired invite code.", "invite_code")
    role = roles[0]
    if int(role["headcount_filled"]) >= int(role["headcount_max"]):
        raise AppError(400, "ROLE_FULL", "This role has no available headcount slots.")
    if _email_exists("workers", email):
        raise AppError(409, "EMAIL_ALREADY_EXISTS", "A worker with this email already exists.", "email")
    if _phone_exists("workers", payload.phone_number):
        raise AppError(409, "PHONE_ALREADY_EXISTS", "A worker with this phone number already exists.", "phone_number")

    try:
        auth_response = db.auth.sign_up(
            {
                "email": email,
                "password": payload.password,
                "options": {
                    "data": {
                        "user_type": "worker",
                        "first_name": payload.first_name,
                        "last_name": payload.last_name,
                    }
                },
            }
        )
    except Exception as exc:
        raise AppError(400, "AUTH_SIGNUP_FAILED", "Unable to create Supabase Auth user.") from exc

    worker_payload = payload.model_dump(exclude={"password", "confirm_password", "invite_code"})
    worker_payload["auth_user_id"] = _auth_user_id(auth_response)
    worker_payload["email"] = email
    worker_payload["company_id"] = role["company_id"]
    worker_payload["role_id"] = role["id"]
    worker_payload["status"] = "PENDING_BANK"
    worker_payload["completeness_score"] = calculate_completeness(worker_payload)
    worker = db.table("workers").insert(jsonable_encoder(worker_payload)).execute().data[0]
    db.table("roles").update({"headcount_filled": int(role["headcount_filled"]) + 1}).eq("id", role["id"]).execute()
    await write_audit(worker["id"], "worker", "REGISTER_WORKER", worker["id"], "worker", {"role_id": role["id"]})
    return {"worker": _public_profile(worker), "role": role}


async def login_user(user_type: UserType, payload: LoginRequest) -> dict[str, Any]:
    """Authenticate with Supabase Auth and return the linked GhostGuard profile."""

    db = get_supabase()
    try:
        auth_response = db.auth.sign_in_with_password({"email": str(payload.email).lower(), "password": payload.password})
    except Exception as exc:
        raise AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.") from exc

    user = getattr(auth_response, "user", None)
    session = _auth_session(auth_response)
    if not user:
        raise AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.")
    if getattr(user, "email_confirmed_at", None) is None:
        raise AppError(403, "EMAIL_NOT_VERIFIED", "Please verify your email first.")

    rows = db.table(_table_for(user_type)).select("*").eq("auth_user_id", user.id).limit(1).execute().data
    if not rows:
        raise AppError(404, "NOT_FOUND", f"{user_type.title()} profile was not found.")
    profile = rows[0]
    if user_type == "admin" and profile.get("status") != "ACTIVE":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Account suspended.")
    if user_type == "worker" and profile.get("status") == "SUSPENDED":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Account suspended.")
    if user_type == "worker" and profile.get("status") == "DELETED":
        raise AppError(403, "ACCOUNT_DELETED", "Account deleted.")

    update_data: dict[str, Any] = {"last_login": datetime.now(UTC).isoformat()}
    if user_type == "worker" and payload.device_id:
        update_data["device_id"] = payload.device_id
    profile = db.table(_table_for(user_type)).update(update_data).eq("id", profile["id"]).execute().data[0]
    await write_audit(profile["id"], user_type, "LOGIN", profile["id"], user_type, {})
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "token_type": "bearer",
        "user_type": user_type,
        "profile": _public_profile(profile),
    }


async def refresh_access_token(payload: RefreshRequest) -> dict[str, Any]:
    """Refresh a Supabase Auth session."""

    db = get_supabase()
    try:
        response = db.auth.refresh_session(payload.refresh_token)
    except TypeError:
        response = db.auth.refresh_session({"refresh_token": payload.refresh_token})
    except Exception as exc:
        raise AppError(401, "UNAUTHORIZED", "Refresh token is invalid or expired.") from exc
    session = _auth_session(response)
    return {"access_token": session.access_token, "refresh_token": session.refresh_token, "token_type": "bearer"}


async def logout_user(access_token: str) -> dict[str, Any]:
    """Sign out the current Supabase Auth session."""

    db = get_supabase()
    try:
        db.auth.admin.sign_out(access_token)
    except Exception:
        try:
            db.auth.sign_out()
        except Exception as exc:
            raise AppError(400, "LOGOUT_FAILED", "Unable to sign out the current session.") from exc
    return {"logged_out": True}


async def forgot_password(payload: ForgotPasswordRequest) -> dict[str, Any]:
    """Ask Supabase Auth to send a password reset email."""

    try:
        get_supabase().auth.reset_password_for_email(str(payload.email).lower())
    except Exception as exc:
        raise AppError(400, "PASSWORD_RESET_FAILED", "Unable to send password reset email.") from exc
    return {"sent": True}


async def reset_password(payload: ResetPasswordRequest) -> dict[str, Any]:
    """Update a user's password using the reset access token from Supabase."""

    db = get_supabase()
    try:
        db.auth.get_user(payload.access_token)
        db.auth.update_user({"password": payload.new_password}, jwt=payload.access_token)
    except TypeError:
        try:
            db.auth.update_user({"password": payload.new_password})
        except Exception as exc:
            raise AppError(400, "PASSWORD_RESET_FAILED", "Unable to reset password with the provided token.") from exc
    except Exception as exc:
        raise AppError(400, "PASSWORD_RESET_FAILED", "Unable to reset password with the provided token.") from exc
    return {"updated": True}


async def write_audit(
    actor_id: str,
    actor_type: str,
    action: str,
    target_id: str | None,
    target_type: str | None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Persist an audit log entry."""

    get_supabase().table("audit_logs").insert(
        {
            "actor_id": actor_id,
            "actor_type": actor_type,
            "action": action,
            "target_id": target_id,
            "target_type": target_type,
            "metadata": metadata or {},
            "ip_address": ip_address,
        }
    ).execute()
