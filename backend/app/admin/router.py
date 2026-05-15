from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends

from app.admin import service
from app.admin.schemas import BankReviewRequest, CompanyUpdate, CreateRoleSchema, UpdateRoleSchema, WorkerReassignRequest, WorkerSuspendRequest
from app.dependencies import get_current_admin
from app.errors import success_response

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/company")
async def company(admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.get_company(admin), "Company profile retrieved.")


@router.put("/company")
async def update_company(payload: CompanyUpdate, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.update_company(admin, payload), "Company profile updated.")


@router.post("/roles", status_code=201)
async def create_role(data: CreateRoleSchema, current_admin: dict[str, Any] = Depends(get_current_admin)):
    """Create a new role. Returns the created role including the generated invite code."""

    return await service.create_role(data, current_admin)


@router.get("/roles")
async def roles(current_admin: dict[str, Any] = Depends(get_current_admin)):
    """List all roles for this admin's company."""

    return {"success": True, "data": await service.list_roles(current_admin) or []}


@router.get("/roles/{role_id}")
async def role(role_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.get_role(admin, role_id), "Role retrieved.")


@router.put("/roles/{role_id}")
async def update_role(role_id: UUID, data: UpdateRoleSchema, current_admin: dict[str, Any] = Depends(get_current_admin)):
    return await service.update_role(role_id, data, current_admin)


@router.post("/roles/{role_id}/regenerate-code")
async def regenerate_code(role_id: UUID, current_admin: dict[str, Any] = Depends(get_current_admin)):
    return await service.regenerate_invite_code(role_id, current_admin)


@router.delete("/roles/{role_id}")
async def delete_role(role_id: UUID, current_admin: dict[str, Any] = Depends(get_current_admin)):
    return await service.delete_role(role_id, current_admin)


@router.get("/workers")
async def workers(
    role_id: UUID | None = None,
    status: str | None = None,
    bank_verified: bool | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
    admin: dict[str, Any] = Depends(get_current_admin),
):
    return success_response(await service.list_workers(admin, role_id, status, bank_verified, search, max(page, 1), min(max(page_size, 1), 100)), "Workers retrieved.")


@router.get("/workers/{worker_id}")
async def worker(worker_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.get_worker(admin, worker_id), "Worker retrieved.")


@router.patch("/workers/{worker_id}/verify-bank")
async def verify_worker_bank(worker_id: UUID, payload: BankReviewRequest, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.review_worker_bank(admin, worker_id, payload), "Worker bank review saved.")


@router.patch("/workers/{worker_id}/suspend")
async def suspend(worker_id: UUID, payload: WorkerSuspendRequest, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.suspend_worker(admin, worker_id, payload), "Worker suspended.")


@router.patch("/workers/{worker_id}/reactivate")
async def reactivate(worker_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.reactivate_worker(admin, worker_id), "Worker reactivated.")


@router.patch("/workers/{worker_id}/reassign")
async def reassign(worker_id: UUID, payload: WorkerReassignRequest, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.reassign_worker(admin, worker_id, payload), "Worker reassigned.")


@router.delete("/workers/{worker_id}")
async def delete_worker(worker_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.soft_delete_worker(admin, worker_id), "Worker deleted.")
