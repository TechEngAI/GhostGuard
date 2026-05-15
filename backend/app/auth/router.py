from typing import Any

from fastapi import APIRouter, Depends

from app.auth import service
from app.auth.schemas import (
    AdminRegisterRequest,
    ForgotPasswordRequest,
    LoginRequest,
    OtpVerifyRequest,
    RefreshRequest,
    ResendOtpRequest,
    ResetPasswordRequest,
    WorkerRegisterRequest,
)
from app.dependencies import get_current_admin, get_current_worker
from app.errors import success_response

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/admin/register")
async def admin_register(payload: AdminRegisterRequest):
    return success_response(await service.register_admin(payload), "Check your email/phone to verify your account.")


@router.post("/admin/login")
async def admin_login(payload: LoginRequest):
    return success_response(await service.login_user("admin", payload), "Login successful.")


@router.post("/admin/verify-otp")
async def admin_verify_otp(payload: OtpVerifyRequest):
    return success_response(await service.verify_otp("admin", payload), "Account verified successfully.")


@router.post("/admin/resend-otp")
async def admin_resend_otp(payload: ResendOtpRequest):
    return success_response(await service.resend_otp("admin", payload), "Verification email resent.")


@router.post("/admin/refresh")
async def admin_refresh(payload: RefreshRequest):
    return success_response(await service.refresh_access_token(payload), "Access token refreshed.")


@router.post("/admin/logout")
async def admin_logout(admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.logout_user(admin["_access_token"]), "Logout successful.")


@router.post("/admin/forgot-password")
async def admin_forgot_password(payload: ForgotPasswordRequest):
    return success_response(await service.forgot_password(payload), "Password reset email sent.")


@router.post("/admin/reset-password")
async def admin_reset_password(payload: ResetPasswordRequest):
    return success_response(await service.reset_password(payload), "Password reset successfully.")


@router.post("/worker/register")
async def worker_register(payload: WorkerRegisterRequest):
    result = await service.register_worker(payload)
    return success_response(result, "Account created. Check your email to verify.")


@router.post("/worker/login")
async def worker_login(payload: LoginRequest):
    return success_response(await service.login_user("worker", payload), "Login successful.")


@router.post("/worker/verify-otp")
async def worker_verify_otp(payload: OtpVerifyRequest):
    return success_response(await service.verify_otp("worker", payload), "Account verified successfully.")


@router.post("/worker/resend-otp")
async def worker_resend_otp(payload: ResendOtpRequest):
    return success_response(await service.resend_otp("worker", payload), "Verification email resent.")


@router.post("/worker/refresh")
async def worker_refresh(payload: RefreshRequest):
    return success_response(await service.refresh_access_token(payload), "Access token refreshed.")


@router.post("/worker/logout")
async def worker_logout(worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.logout_user(worker["_access_token"]), "Logout successful.")


@router.post("/worker/forgot-password")
async def worker_forgot_password(payload: ForgotPasswordRequest):
    return success_response(await service.forgot_password(payload), "Password reset email sent.")


@router.post("/worker/reset-password")
async def worker_reset_password(payload: ResetPasswordRequest):
    return success_response(await service.reset_password(payload), "Password reset successfully.")
