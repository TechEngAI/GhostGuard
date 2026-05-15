from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.attendance import service
from app.attendance.schemas import AttendanceCheckInRequest, AttendanceCheckOutRequest, AttendanceEditRequest
from app.dependencies import get_current_admin, get_current_worker
from app.errors import success_response

router = APIRouter(tags=["attendance"])


@router.post("/worker/attendance/checkin")
async def check_in(payload: AttendanceCheckInRequest, request: Request, worker: dict[str, Any] = Depends(get_current_worker)):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return success_response(await service.check_in(worker, payload, ip_address, user_agent), "Check-in recorded successfully")


@router.post("/worker/attendance/checkout")
async def check_out(payload: AttendanceCheckOutRequest, worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.check_out(worker, payload), "Checked out successfully")


@router.get("/worker/attendance/today")
async def today(worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.today(worker), "Today's attendance retrieved.")


@router.get("/worker/attendance/history")
async def history(month: str | None = None, page: int = 1, page_size: int = 50, worker: dict[str, Any] = Depends(get_current_worker)):
    month = month or datetime.utcnow().strftime("%Y-%m")
    return success_response(await service.worker_history(worker, month, max(page, 1), min(max(page_size, 1), 100)), "Attendance history retrieved.")


@router.get("/admin/attendance/{worker_id}")
async def admin_attendance(worker_id: UUID, month: str | None = None, page: int = 1, page_size: int = 50, admin: dict[str, Any] = Depends(get_current_admin)):
    month = month or datetime.utcnow().strftime("%Y-%m")
    return success_response(await service.admin_worker_attendance(admin, worker_id, month, max(page, 1), min(max(page_size, 1), 100)), "Worker attendance retrieved.")


@router.patch("/admin/attendance/{record_id}/edit")
async def edit(record_id: UUID, payload: AttendanceEditRequest, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.edit_record(admin, record_id, payload), "Attendance record updated.")

