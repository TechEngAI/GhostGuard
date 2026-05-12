from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends

from app.dependencies import get_current_admin, get_current_hr
from app.errors import success_response
from app.auth.schemas import RefreshRequest
from app.hr import service
from app.hr.schemas import HRCreateRequest, HRForgotPasswordRequest, HRLoginRequest, HRResetPasswordRequest

router = APIRouter(tags=["hr"])


@router.post("/admin/hr/create")
async def create_hr(payload: HRCreateRequest, admin: dict[str, Any] = Depends(get_current_admin)):
    data = await service.create_hr_officer(admin, payload)
    return success_response(data, f"HR officer invitation sent to {payload.email}")


@router.get("/admin/hr")
async def list_hr(admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.list_hr_officers(admin), "HR officers retrieved.")


@router.patch("/admin/hr/{hr_id}/suspend")
async def suspend_hr(hr_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.suspend_hr(admin, hr_id), "HR officer suspended.")


@router.patch("/admin/hr/{hr_id}/reactivate")
async def reactivate_hr(hr_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.reactivate_hr(admin, hr_id), "HR officer reactivated.")


@router.delete("/admin/hr/{hr_id}")
async def delete_hr(hr_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.delete_hr(admin, hr_id), "HR officer deleted.")


@router.post("/auth/hr/login")
async def login(payload: HRLoginRequest):
    return success_response(await service.login(payload), "HR logged in successfully.")


@router.post("/auth/hr/logout")
async def logout(hr: dict[str, Any] = Depends(get_current_hr)):
    return success_response(await service.logout(hr), "HR logged out successfully.")


@router.post("/auth/hr/refresh")
async def refresh(payload: RefreshRequest):
    return success_response(await service.refresh_access_token(payload), "Access token refreshed.")


@router.post("/auth/hr/forgot-password")
async def forgot_password(payload: HRForgotPasswordRequest):
    return success_response(await service.forgot_password(payload), "Password reset email sent.")


@router.post("/auth/hr/reset-password")
async def reset_password(payload: HRResetPasswordRequest):
    return success_response(await service.reset_password(payload), "Password updated successfully.")
