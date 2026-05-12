from typing import Any
from uuid import UUID
import secrets
import string

from fastapi.encoders import jsonable_encoder

from app.admin.schemas import BankReviewRequest, CompanyUpdate, RoleCreate, RoleUpdate, WorkerReassignRequest, WorkerSuspendRequest
from app.auth.service import write_audit
from app.database import get_supabase
from app.errors import AppError


def _random_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _invite_code(company_name: str, role_name: str) -> str:
    company_prefix = "".join(company_name.upper().split())[:4].ljust(4, "X")
    role_prefix = "".join(role_name.upper().split())[:3].ljust(3, "X")
    return f"GG-{company_prefix}-{role_prefix}-{_random_code(6)}"


def _require_row(data: Any, code: str, message: str) -> dict[str, Any]:
    if not data:
        raise AppError(500, code, message)
    return data[0] if isinstance(data, list) else data


def _require_response(response: Any, code: str, message: str) -> Any:
    if response is None:
        raise AppError(500, code, message)
    error = getattr(response, "error", None)
    if error:
        raise AppError(500, code, f"{message} {error}")
    return response


def _unique_invite_code(db: Any, company_name: str, role_name: str) -> str:
    if not company_name or not role_name:
        raise AppError(400, "INVALID_INPUT", "Company name and role name are required.")
    
    max_attempts = 10
    for attempt in range(max_attempts):
        code = _invite_code(company_name, role_name)
        try:
            existing = _require_response(
                db.table("roles").select("id").eq("invite_code", code).maybe_single().execute(),
                "DATABASE_QUERY_FAILED",
                "Could not verify invite code uniqueness."
            )
            if existing.data is None:
                return code
        except AppError:
            raise
        except Exception as e:
            raise AppError(500, "DATABASE_QUERY_FAILED", f"Failed to check invite code uniqueness: {str(e)}")
        if attempt == max_attempts - 1:
            raise AppError(500, "CODE_GENERATION_FAILED", "Could not generate unique code. Try again.")
    raise AppError(500, "CODE_GENERATION_FAILED", "Could not generate unique code. Try again.")


async def get_company(admin: dict[str, Any]) -> dict[str, Any]:
    """Return the authenticated admin's company profile."""

    result = _require_response(
        get_supabase().table("companies").select("*").eq("id", admin["company_id"]).maybe_single().execute(),
        "DATABASE_QUERY_FAILED",
        "Could not fetch company profile. Please try again."
    )
    if result.data is None:
        raise AppError(404, "COMPANY_NOT_FOUND", "Company profile was not found.")
    return result.data


async def update_company(admin: dict[str, Any], payload: CompanyUpdate) -> dict[str, Any]:
    """Update company settings and audit before/after changes."""

    db = get_supabase()
    before = await get_company(admin)
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return before
    after_result = db.table("companies").update(jsonable_encoder(update_data)).eq("id", admin["company_id"]).execute()
    after = _require_row(after_result.data, "DATABASE_UPDATE_FAILED", "Could not update company. Please try again.")
    await write_audit(admin["id"], "admin", "UPDATE_COMPANY", admin["company_id"], "company", {"before": before, "after": after})
    return after


async def create_role(admin: dict[str, Any], payload: RoleCreate) -> dict[str, Any]:
    """Create a payroll role with a unique GhostGuard invite code."""

    db = get_supabase()
    company = await get_company(admin)
    
    # Verify company data before using it
    if not company or not isinstance(company, dict):
        raise AppError(500, "INVALID_COMPANY_DATA", "Company data is corrupted. Please try again.")
    if not company.get("name"):
        raise AppError(500, "MISSING_COMPANY_NAME", "Company name is missing. Please update company profile.")
    
    role_data = jsonable_encoder(payload)
    role_data["company_id"] = admin["company_id"]
    role_data["invite_code"] = _unique_invite_code(db, company["name"], payload.role_name)
    
    try:
        role_result = _require_response(
            db.table("roles").insert(role_data).execute(),
            "DATABASE_INSERT_FAILED",
            "Could not create role. Please try again."
        )
        role = _require_row(role_result.data, "DATABASE_INSERT_FAILED", "Could not create role. Please try again.")
    except AppError:
        raise
    except Exception as e:
        raise AppError(500, "DATABASE_INSERT_FAILED", f"Could not create role: {str(e)}")
    
    await write_audit(admin["id"], "admin", "CREATE_ROLE", role["id"], "role", {"after": role})
    return role


async def list_roles(admin: dict[str, Any]) -> list[dict[str, Any]]:
    """List roles belonging to the admin's company."""

    return get_supabase().table("roles").select("*").eq("company_id", admin["company_id"]).order("created_at", desc=True).execute().data


async def get_role(admin: dict[str, Any], role_id: UUID) -> dict[str, Any]:
    """Return a single company role."""

    result = get_supabase().table("roles").select("*").eq("id", str(role_id)).eq("company_id", admin["company_id"]).maybe_single().execute()
    if not result.data:
        raise AppError(404, "ROLE_NOT_FOUND", "Role was not found.")
    return result.data


async def update_role(admin: dict[str, Any], role_id: UUID, payload: RoleUpdate) -> dict[str, Any]:
    """Update a role and audit before/after values."""

    db = get_supabase()
    before = await get_role(admin, role_id)
    update_data = payload.model_dump(exclude_unset=True)
    if "headcount_max" in update_data and int(update_data["headcount_max"]) < int(before["headcount_filled"]):
        raise AppError(400, "HEADCOUNT_TOO_LOW", "headcount_max cannot be below current filled headcount.", "headcount_max")
    after_result = db.table("roles").update(jsonable_encoder(update_data)).eq("id", str(role_id)).eq("company_id", admin["company_id"]).execute()
    after = _require_row(after_result.data, "DATABASE_UPDATE_FAILED", "Could not update role. Please try again.")
    await write_audit(admin["id"], "admin", "UPDATE_ROLE", str(role_id), "role", {"before": before, "after": after})
    return after


async def regenerate_role_code(admin: dict[str, Any], role_id: UUID) -> dict[str, Any]:
    """Generate a replacement invite code for a role."""

    role = await get_role(admin, role_id)
    company = await get_company(admin)
    db = get_supabase()
    new_code = _unique_invite_code(db, company["name"], role["role_name"])
    after_result = db.table("roles").update({"invite_code": new_code, "code_active": True}).eq("id", str(role_id)).eq("company_id", admin["company_id"]).execute()
    after = _require_row(after_result.data, "DATABASE_UPDATE_FAILED", "Could not regenerate role code. Please try again.")
    await write_audit(admin["id"], "admin", "REGENERATE_ROLE_CODE", str(role_id), "role", {"old_code": role["invite_code"], "new_code": new_code})
    return after


async def delete_role(admin: dict[str, Any], role_id: UUID) -> dict[str, Any]:
    """Delete an empty role."""

    role = await get_role(admin, role_id)
    if int(role["headcount_filled"]) > 0:
        raise AppError(400, "ROLE_HAS_WORKERS", "Cannot delete role with active workers. Deactivate it instead.")
    get_supabase().table("roles").delete().eq("id", str(role_id)).execute()
    await write_audit(admin["id"], "admin", "DELETE_ROLE", str(role_id), "role", {"before": role})
    return {"deleted": True}


async def list_workers(
    admin: dict[str, Any],
    role_id: UUID | None,
    status: str | None,
    bank_verified: bool | None,
    search: str | None,
    page: int,
    page_size: int,
) -> dict[str, Any]:
    """List company workers with optional filters."""

    query = get_supabase().table("workers").select("*, roles(role_name), worker_bank_accounts(*)").eq("company_id", admin["company_id"])
    if role_id:
        query = query.eq("role_id", str(role_id))
    if status:
        query = query.eq("status", status)
    if bank_verified is not None:
        query = query.eq("bank_verified", bank_verified)
    workers = query.order("created_at", desc=True).execute().data
    if search:
        needle = search.lower()
        workers = [
            worker
            for worker in workers
            if needle in f"{worker.get('first_name', '')} {worker.get('last_name', '')} {worker.get('email', '')}".lower()
        ]
    total = len(workers)
    start = (page - 1) * page_size
    end = start + page_size
    return {"items": workers[start:end], "total": total, "page": page, "page_size": page_size}


async def get_worker(admin: dict[str, Any], worker_id: UUID) -> dict[str, Any]:
    """Return a worker profile with role and bank account details."""

    rows = (
        get_supabase()
        .table("workers")
        .select("*, roles(*), worker_bank_accounts(*), bank_account_history(count)")
        .eq("id", str(worker_id))
        .eq("company_id", admin["company_id"])
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        raise AppError(404, "WORKER_NOT_FOUND", "Worker was not found.")
    return rows[0]


async def review_worker_bank(admin: dict[str, Any], worker_id: UUID, payload: BankReviewRequest) -> dict[str, Any]:
    """Manually approve or reject a worker's bank match."""

    db = get_supabase()
    worker = await get_worker(admin, worker_id)
    approved = payload.action == "approve"
    status = "ACTIVE" if approved else "PENDING_BANK"
    updated_result = db.table("workers").update({"bank_verified": approved, "status": status}).eq("id", str(worker_id)).eq("company_id", admin["company_id"]).execute()
    updated = _require_row(updated_result.data, "DATABASE_UPDATE_FAILED", "Could not update worker bank status.")
    db.table("worker_bank_accounts").update({"match_status": "MANUALLY_APPROVED" if approved else "REJECTED"}).eq("worker_id", str(worker_id)).eq("is_active", True).execute()
    await write_audit(admin["id"], "admin", "MANUAL_BANK_VERIFY", str(worker_id), "worker", {"before": worker, "after": updated, "note": payload.note})
    return updated


async def suspend_worker(admin: dict[str, Any], worker_id: UUID, payload: WorkerSuspendRequest) -> dict[str, Any]:
    """Suspend a company worker."""

    worker = await get_worker(admin, worker_id)
    updated_result = get_supabase().table("workers").update({"status": "SUSPENDED"}).eq("id", str(worker_id)).eq("company_id", admin["company_id"]).execute()
    updated = _require_row(updated_result.data, "DATABASE_UPDATE_FAILED", "Could not suspend worker.")
    await write_audit(admin["id"], "admin", "SUSPEND_WORKER", str(worker_id), "worker", {"before": worker, "after": updated, "reason": payload.reason})
    return updated


async def reactivate_worker(admin: dict[str, Any], worker_id: UUID) -> dict[str, Any]:
    """Reactivate a suspended worker."""

    worker = await get_worker(admin, worker_id)
    if worker.get("bank_verified") is not True:
        raise AppError(400, "BANK_NAME_MISMATCH", "Worker bank account must be verified before reactivation.")
    updated_result = get_supabase().table("workers").update({"status": "ACTIVE"}).eq("id", str(worker_id)).eq("company_id", admin["company_id"]).execute()
    updated = _require_row(updated_result.data, "DATABASE_UPDATE_FAILED", "Could not reactivate worker.")
    await write_audit(admin["id"], "admin", "REACTIVATE_WORKER", str(worker_id), "worker", {"before": worker, "after": updated})
    return updated


async def reassign_worker(admin: dict[str, Any], worker_id: UUID, payload: WorkerReassignRequest) -> dict[str, Any]:
    """Move a worker to a different role while preserving headcount constraints."""

    db = get_supabase()
    worker = await get_worker(admin, worker_id)
    new_role = await get_role(admin, payload.new_role_id)
    if int(new_role["headcount_filled"]) >= int(new_role["headcount_max"]):
        raise AppError(400, "ROLE_FULL", "Target role has no available headcount slots.")
    old_role = await get_role(admin, UUID(worker["role_id"]))
    db.table("roles").update({"headcount_filled": max(0, int(old_role["headcount_filled"]) - 1)}).eq("id", old_role["id"]).execute()
    db.table("roles").update({"headcount_filled": int(new_role["headcount_filled"]) + 1}).eq("id", new_role["id"]).execute()
    updated_result = db.table("workers").update({"role_id": str(payload.new_role_id)}).eq("id", str(worker_id)).eq("company_id", admin["company_id"]).execute()
    updated = _require_row(updated_result.data, "DATABASE_UPDATE_FAILED", "Could not reassign worker.")
    await write_audit(admin["id"], "admin", "REASSIGN_WORKER", str(worker_id), "worker", {"old_role_id": old_role["id"], "new_role_id": new_role["id"], "before": worker, "after": updated})
    return updated


async def soft_delete_worker(admin: dict[str, Any], worker_id: UUID) -> dict[str, Any]:
    """Soft delete a worker and release the role headcount slot."""

    db = get_supabase()
    worker = await get_worker(admin, worker_id)
    if worker.get("status") != "DELETED":
        role = await get_role(admin, UUID(worker["role_id"]))
        db.table("roles").update({"headcount_filled": max(0, int(role["headcount_filled"]) - 1)}).eq("id", role["id"]).execute()
    updated_result = db.table("workers").update({"status": "DELETED"}).eq("id", str(worker_id)).eq("company_id", admin["company_id"]).execute()
    updated = _require_row(updated_result.data, "DATABASE_UPDATE_FAILED", "Could not delete worker.")
    await write_audit(admin["id"], "admin", "DELETE_WORKER", str(worker_id), "worker", {"before": worker, "after": updated})
    return updated


async def notify_admins(company_id: str, subject: str, html: str) -> None:
    """Store an admin notification audit event for dashboard review."""

    admins = get_supabase().table("admins").select("id").eq("company_id", company_id).eq("status", "ACTIVE").execute().data
    for admin in admins:
        await write_audit(admin["id"], "admin", "ADMIN_NOTIFICATION", None, "notification", {"subject": subject, "html": html})
