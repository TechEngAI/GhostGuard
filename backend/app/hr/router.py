from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends

from app.dependencies import get_current_admin, get_current_hr
from app.errors import success_response
from app.auth.schemas import RefreshRequest
from app.hr import service
from app.hr.schemas import HRCreateRequest, HRForgotPasswordRequest, HRLoginRequest, HRResetPasswordRequest, UpdateReceiptDecisionRequest

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


@router.get("/hr/receipts")
async def list_payment_receipts(page: int = 1, per_page: int = 20, hr: dict[str, Any] = Depends(get_current_hr)):
    return success_response(await service.list_payment_receipts(hr, page, per_page), "Payment receipts retrieved.")


@router.get("/hr/receipts/{receipt_id}")
async def get_payment_receipt(receipt_id: UUID, hr: dict[str, Any] = Depends(get_current_hr)):
    return success_response(await service.get_payment_receipt(hr, receipt_id), "Payment receipt retrieved.")


@router.patch("/hr/receipts/{receipt_id}/decision")
async def update_receipt_decision(receipt_id: UUID, payload: UpdateReceiptDecisionRequest, hr: dict[str, Any] = Depends(get_current_hr)):
    return success_response(await service.update_receipt_decision(hr, receipt_id, payload.decision, payload.note), "Receipt decision updated.")


@router.post("/hr/receipts/{receipt_id}/requery")
async def requery_receipt_status(receipt_id: UUID, hr: dict[str, Any] = Depends(get_current_hr)):
    return success_response(await service.requery_receipt_status(hr, receipt_id), "Receipt status requeried from Squad.")
