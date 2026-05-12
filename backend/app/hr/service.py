from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.auth.service import write_audit
from app.database import get_supabase, get_supabase_admin_client, get_supabase_auth_client
from app.errors import AppError
from app.hr.schemas import HRCreateRequest, HRForgotPasswordRequest, HRLoginRequest, HRResetPasswordRequest


def _public_hr(hr: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in hr.items() if not key.startswith("_")}


def _auth_user_id(response: Any) -> str:
    user = getattr(response, "user", None)
    if not user:
        raise AppError(502, "AUTH_PROVIDER_ERROR", "Supabase Auth did not return a user.")
    return str(user.id)


def _session(response: Any) -> Any:
    session = getattr(response, "session", None)
    if not session:
        raise AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.")
    return session


def _require_row(data: Any, code: str, message: str) -> dict[str, Any]:
    if not data:
        raise AppError(500, code, message)
    return data[0] if isinstance(data, list) else data


def _email_in_use(email: str) -> bool:
    db = get_supabase()
    for table in ("admins", "workers", "hr_officers"):
        if db.table(table).select("id").eq("email", email).maybe_single().execute().data:
            return True
    return False


async def create_hr_officer(admin: dict[str, Any], payload: HRCreateRequest) -> dict[str, Any]:
    db = get_supabase()
    email = str(payload.email).lower()
    if _email_in_use(email):
        raise AppError(409, "HR_ALREADY_EXISTS", "This email is already in use.", "email")
    try:
        invite = get_supabase_admin_client().auth.admin.invite_user_by_email(
            email,
            options={"data": {"user_type": "hr", "company_id": admin["company_id"]}},
        )
    except TypeError:
        invite = get_supabase_admin_client().auth.admin.invite_user_by_email(
            email,
            {"data": {"user_type": "hr", "company_id": admin["company_id"]}},
        )
    except Exception as exc:
        raise AppError(400, "AUTH_INVITE_FAILED", "Unable to send HR invitation.") from exc

    hr_result = (
        db.table("hr_officers")
        .insert(
            jsonable_encoder(
                {
                    "auth_user_id": _auth_user_id(invite),
                    "company_id": admin["company_id"],
                    "first_name": payload.first_name,
                    "last_name": payload.last_name,
                    "email": email,
                    "phone_number": payload.phone_number,
                    "created_by": admin["id"],
                }
            )
        )
        .execute()
    )
    hr = _require_row(hr_result.data, "DATABASE_INSERT_FAILED", "Could not create HR profile. Please try again.")
    await write_audit(admin["id"], "admin", "HR_OFFICER_CREATED", hr["id"], "hr_officer", {"email": email})
    return {"hr_officer": hr}


async def list_hr_officers(admin: dict[str, Any]) -> dict[str, Any]:
    rows = (
        get_supabase()
        .table("hr_officers")
        .select("id, first_name, last_name, email, status, last_login, created_at")
        .eq("company_id", admin["company_id"])
        .order("created_at", desc=True)
        .execute()
        .data
    )
    return {"hr_officers": rows}


async def get_company_hr(admin: dict[str, Any], hr_id: UUID) -> dict[str, Any]:
    rows = get_supabase().table("hr_officers").select("*").eq("id", str(hr_id)).eq("company_id", admin["company_id"]).limit(1).execute().data
    if not rows:
        raise AppError(404, "HR_NOT_FOUND", "HR officer does not exist for this company.")
    return rows[0]


async def suspend_hr(admin: dict[str, Any], hr_id: UUID) -> dict[str, Any]:
    db = get_supabase()
    hr = await get_company_hr(admin, hr_id)
    try:
        get_supabase_admin_client().auth.admin.update_user_by_id(hr["auth_user_id"], {"ban_duration": "876600h"})
    except Exception as exc:
        raise AppError(400, "AUTH_UPDATE_FAILED", "Unable to suspend HR auth account.") from exc
    updated_result = db.table("hr_officers").update({"status": "SUSPENDED"}).eq("id", str(hr_id)).eq("company_id", admin["company_id"]).execute()
    updated = _require_row(updated_result.data, "DATABASE_UPDATE_FAILED", "Could not suspend HR officer.")
    await write_audit(admin["id"], "admin", "HR_OFFICER_SUSPENDED", str(hr_id), "hr_officer", {"email": hr["email"]})
    return updated


async def reactivate_hr(admin: dict[str, Any], hr_id: UUID) -> dict[str, Any]:
    db = get_supabase()
    hr = await get_company_hr(admin, hr_id)
    try:
        get_supabase_admin_client().auth.admin.update_user_by_id(hr["auth_user_id"], {"ban_duration": "none"})
    except Exception as exc:
        raise AppError(400, "AUTH_UPDATE_FAILED", "Unable to reactivate HR auth account.") from exc
    updated_result = db.table("hr_officers").update({"status": "ACTIVE"}).eq("id", str(hr_id)).eq("company_id", admin["company_id"]).execute()
    updated = _require_row(updated_result.data, "DATABASE_UPDATE_FAILED", "Could not reactivate HR officer.")
    await write_audit(admin["id"], "admin", "HR_OFFICER_REACTIVATED", str(hr_id), "hr_officer", {"email": hr["email"]})
    return updated


async def delete_hr(admin: dict[str, Any], hr_id: UUID) -> dict[str, Any]:
    db = get_supabase()
    hr = await get_company_hr(admin, hr_id)
    try:
        get_supabase_admin_client().auth.admin.delete_user(hr["auth_user_id"])
    except Exception as exc:
        raise AppError(400, "AUTH_DELETE_FAILED", "Unable to delete HR auth account.") from exc
    db.table("hr_officers").delete().eq("id", str(hr_id)).execute()
    await write_audit(admin["id"], "admin", "HR_OFFICER_DELETED", str(hr_id), "hr_officer", {"email": hr["email"]})
    return {"deleted": True}


async def login(payload: HRLoginRequest) -> dict[str, Any]:
    db = get_supabase()
    try:
        response = get_supabase_auth_client().auth.sign_in_with_password({"email": str(payload.email).strip().lower(), "password": payload.password})
    except Exception as exc:
        print(f"HR login error for {payload.email}: {exc}")
        raise AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.") from exc
    user = getattr(response, "user", None)
    session = _session(response)
    if not user:
        raise AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.")
    profile_result = db.table("hr_officers").select("*").eq("auth_user_id", user.id).maybe_single().execute()
    if not profile_result.data:
        raise AppError(403, "UNAUTHORIZED", "This account does not have HR access.")
    hr = profile_result.data
    if hr.get("status") != "ACTIVE":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Account suspended.")
    update_result = db.table("hr_officers").update({"last_login": datetime.now(UTC).isoformat()}).eq("id", hr["id"]).execute()
    hr = _require_row(update_result.data, "DATABASE_UPDATE_FAILED", "Could not update last login.")
    await write_audit(hr["id"], "hr", "LOGIN", hr["id"], "hr_officer", {})
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "token_type": "bearer",
        "user_type": "hr",
        "hr_profile": {
            "id": hr["id"],
            "first_name": hr["first_name"],
            "last_name": hr["last_name"],
            "email": hr["email"],
            "company_id": hr["company_id"],
        },
    }


async def logout(hr: dict[str, Any]) -> dict[str, Any]:
    db = get_supabase()
    try:
        get_supabase_admin_client().auth.admin.sign_out(hr["_access_token"])
    except Exception:
        try:
            get_supabase_auth_client().auth.sign_out()
        except Exception as exc:
            raise AppError(400, "LOGOUT_FAILED", "Unable to sign out the current session.") from exc
    return {"logged_out": True}


async def forgot_password(payload: HRForgotPasswordRequest) -> dict[str, Any]:
    try:
        get_supabase_auth_client().auth.reset_password_for_email(str(payload.email).lower())
    except Exception as exc:
        raise AppError(400, "PASSWORD_RESET_FAILED", "Unable to send password reset email.") from exc
    return {"sent": True}


async def reset_password(payload: HRResetPasswordRequest) -> dict[str, Any]:
    try:
        get_supabase_auth_client().auth.get_user(payload.access_token)
        get_supabase_auth_client().auth.update_user({"password": payload.new_password}, jwt=payload.access_token)
    except TypeError:
        try:
            get_supabase_auth_client().auth.update_user({"password": payload.new_password})
        except Exception as exc:
            raise AppError(400, "PASSWORD_RESET_FAILED", "Unable to reset password with the provided token.") from exc
    except Exception as exc:
        raise AppError(400, "PASSWORD_RESET_FAILED", "Unable to reset password with the provided token.") from exc
    return {"updated": True}
