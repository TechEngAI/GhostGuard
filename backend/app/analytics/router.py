from typing import Any

from fastapi import APIRouter, Depends

from app.analytics import service
from app.dependencies import get_current_admin
from app.errors import success_response

router = APIRouter(prefix="/admin/analytics", tags=["analytics"])


@router.get("/summary")
async def summary(admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.summary(admin), "Analytics summary retrieved.")


@router.get("/payroll-history")
async def payroll_history(admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.payroll_history(admin), "Payroll history retrieved.")


@router.get("/fraud-breakdown")
async def fraud_breakdown(admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.fraud_breakdown(admin), "Fraud breakdown retrieved.")


@router.get("/top-risk-workers")
async def top_risk_workers(limit: int = 10, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.top_risk_workers(admin, limit), "Top risk workers retrieved.")


@router.get("/attendance-overview")
async def attendance_overview(month_year: str | None = None, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.attendance_overview(admin, month_year), "Attendance overview retrieved.")
