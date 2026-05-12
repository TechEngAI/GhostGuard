from datetime import UTC, date, datetime, time, timedelta
from math import atan2, cos, radians, sin, sqrt
from typing import Any
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi.encoders import jsonable_encoder

from app.attendance.schemas import AttendanceCheckInRequest, AttendanceCheckOutRequest, AttendanceEditRequest
from app.auth.service import write_audit
from app.database import get_supabase
from app.errors import AppError


def haversine_metres(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates using the Haversine formula."""

    radius = 6_371_000
    phi1, phi2 = radians(lat1), radians(lat2)
    delta_phi = radians(lat2 - lat1)
    delta_lambda = radians(lng2 - lng1)
    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    return radius * 2 * atan2(sqrt(a), sqrt(1 - a))


def _today_bounds() -> tuple[str, str]:
    today = date.today()
    start = datetime.combine(today, time.min, tzinfo=UTC)
    end = start + timedelta(days=1)
    return start.isoformat(), end.isoformat()


def _month_year(now: datetime) -> str:
    return now.strftime("%Y-%m")


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


async def _get_role(role_id: str) -> dict[str, Any]:
    rows = get_supabase().table("roles").select("*").eq("id", role_id).limit(1).execute().data
    if not rows:
        raise AppError(404, "NOT_FOUND", "Worker role was not found.")
    return rows[0]


async def _get_company(company_id: str) -> dict[str, Any]:
    rows = get_supabase().table("companies").select("*").eq("id", company_id).limit(1).execute().data
    if not rows:
        raise AppError(404, "NOT_FOUND", "Company was not found.")
    return rows[0]


def _assert_worker_active(worker: dict[str, Any]) -> None:
    if worker.get("status") == "PENDING_BANK":
        raise AppError(403, "BANK_NOT_VERIFIED", "Complete your bank verification first.")
    if worker.get("status") == "SUSPENDED":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Account suspended. Contact admin.")
    if worker.get("status") != "ACTIVE":
        raise AppError(403, "ACCOUNT_SUSPENDED", "Worker account is not active.")


async def _open_record_today(worker_id: str) -> dict[str, Any] | None:
    start, end = _today_bounds()
    rows = (
        get_supabase()
        .table("attendance_records")
        .select("*")
        .eq("worker_id", worker_id)
        .eq("status", "OPEN")
        .gte("check_in_time", start)
        .lt("check_in_time", end)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


async def _detect_impossible_travel(worker: dict[str, Any], latitude: float, longitude: float) -> str | None:
    db = get_supabase()
    rows = (
        db.table("attendance_records")
        .select("*")
        .eq("worker_id", worker["id"])
        .eq("status", "CLOSED")
        .order("check_in_time", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        return None
    previous = rows[0]
    distance = haversine_metres(float(previous["check_in_lat"]), float(previous["check_in_lng"]), latitude, longitude)
    gap_seconds = (datetime.now(UTC) - _parse_dt(previous["check_in_time"])).total_seconds()
    speed_kmh = float("inf") if gap_seconds <= 0 else (distance / 1000) / (gap_seconds / 3600)
    if speed_kmh <= 200:
        return None
    metadata = {
        "distance_km": round(distance / 1000, 2),
        "time_gap_minutes": round(max(gap_seconds, 0) / 60, 2),
        "speed_kmh": round(speed_kmh, 2) if speed_kmh != float("inf") else "inf",
        "from_lat": previous["check_in_lat"],
        "from_lng": previous["check_in_lng"],
        "to_lat": latitude,
        "to_lng": longitude,
        "previous_attendance_id": previous["id"],
    }
    db.table("fraud_signals").insert(
        {"worker_id": worker["id"], "company_id": worker["company_id"], "signal_type": "IMPOSSIBLE_TRAVEL", "severity": "CRITICAL", "metadata": metadata}
    ).execute()
    await write_audit(worker["id"], "worker", "IMPOSSIBLE_TRAVEL_DETECTED", previous["id"], "attendance_record", metadata)
    return "IMPOSSIBLE_TRAVEL"


async def _detect_device_sharing(worker: dict[str, Any], device_id: str | None) -> str | None:
    if not device_id:
        return None
    db = get_supabase()
    rows = db.table("attendance_records").select("worker_id").eq("device_id", device_id).neq("worker_id", worker["id"]).limit(10).execute().data
    other_worker_ids = sorted({row["worker_id"] for row in rows})
    if not other_worker_ids:
        return None
    shared_count = len(other_worker_ids) + 1
    severity = "CRITICAL" if shared_count >= 3 else "HIGH"
    all_workers = [worker["id"], *other_worker_ids]
    for flagged_worker_id in all_workers:
        db.table("fraud_signals").insert(
            {
                "worker_id": flagged_worker_id,
                "company_id": worker["company_id"],
                "signal_type": "DEVICE_SHARED",
                "severity": severity,
                "metadata": {"device_id": device_id, "shared_with_worker_ids": [wid for wid in all_workers if wid != flagged_worker_id], "shared_count": shared_count},
            }
        ).execute()
    await write_audit(worker["id"], "worker", "DEVICE_SHARING_DETECTED", worker["id"], "worker", {"device_id": device_id, "shared_count": shared_count})
    return "DEVICE_SHARED"


def _is_late(company: dict[str, Any], now: datetime) -> bool:
    timezone = ZoneInfo(company.get("timezone") or "Africa/Lagos")
    local_now = now.astimezone(timezone)
    start_raw = company.get("work_start_time") or "08:00"
    start_time = time.fromisoformat(str(start_raw)[:8])
    threshold = datetime.combine(local_now.date(), start_time, tzinfo=timezone) + timedelta(minutes=15)
    return local_now > threshold


async def check_in(worker: dict[str, Any], payload: AttendanceCheckInRequest, ip_address: str | None, user_agent: str | None) -> dict[str, Any]:
    """Record worker check-in after role, geofence, and fraud checks."""

    _assert_worker_active(worker)
    if await _open_record_today(worker["id"]):
        raise AppError(409, "ALREADY_CHECKED_IN", "You are already checked in. Check out first.")

    db = get_supabase()
    now = datetime.now(UTC)
    role = await _get_role(worker["role_id"])
    company = await _get_company(worker["company_id"])
    is_remote = role.get("work_type") == "REMOTE"
    distance = None
    if not is_remote:
        if company.get("office_lat") is None or company.get("office_lng") is None:
            raise AppError(400, "OFFICE_LOCATION_NOT_SET", "Admin has not set office location yet.")
        distance = haversine_metres(float(company["office_lat"]), float(company["office_lng"]), payload.latitude, payload.longitude)
        geofence_radius = float(company.get("geofence_radius") or 100)
        if distance > geofence_radius:
            raise AppError(403, "OUTSIDE_GEOFENCE", f"You are {distance:.0f}m from the office. You must be within {geofence_radius:.0f}m.")

    detected = []
    impossible = await _detect_impossible_travel(worker, payload.latitude, payload.longitude)
    if impossible:
        detected.append(impossible)
    shared = await _detect_device_sharing(worker, payload.device_id)
    if shared:
        detected.append(shared)

    record = (
        db.table("attendance_records")
        .insert(
            {
                "worker_id": worker["id"],
                "company_id": worker["company_id"],
                "check_in_time": now.isoformat(),
                "check_in_lat": payload.latitude,
                "check_in_lng": payload.longitude,
                "distance_from_office": round(distance, 2) if distance is not None else None,
                "device_id": payload.device_id,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "is_late": False if is_remote else _is_late(company, now),
                "status": "OPEN",
                "month_year": _month_year(now),
            }
        )
        .execute()
        .data[0]
    )
    db.table("workers").update({"last_login": now.isoformat(), "device_id": payload.device_id}).eq("id", worker["id"]).execute()
    return {
        "attendance_id": record["id"],
        "check_in_time": record["check_in_time"],
        "distance_from_office": record["distance_from_office"],
        "is_late": record["is_late"],
        "is_remote": is_remote,
        "fraud_signals_detected": detected,
    }


async def check_out(worker: dict[str, Any], payload: AttendanceCheckOutRequest) -> dict[str, Any]:
    """Close today's open attendance record for a worker."""

    record = await _open_record_today(worker["id"])
    if not record:
        raise AppError(404, "NOT_CHECKED_IN", "No active check-in found. Check in first.")
    now = datetime.now(UTC)
    hours = round((now - _parse_dt(record["check_in_time"])).total_seconds() / 3600, 2)
    updated = (
        get_supabase()
        .table("attendance_records")
        .update({"check_out_time": now.isoformat(), "check_out_lat": payload.latitude, "check_out_lng": payload.longitude, "hours_worked": hours, "status": "CLOSED"})
        .eq("id", record["id"])
        .execute()
        .data[0]
    )
    return {"check_out_time": updated["check_out_time"], "hours_worked": hours, "attendance_id": updated["id"]}


async def today(worker: dict[str, Any]) -> dict[str, Any]:
    """Return today's attendance record for a worker."""

    start, end = _today_bounds()
    rows = get_supabase().table("attendance_records").select("*").eq("worker_id", worker["id"]).gte("check_in_time", start).lt("check_in_time", end).limit(1).execute().data
    if not rows:
        return {"status": "NOT_CHECKED_IN", "record": None}
    record = rows[0]
    status = "CHECKED_IN" if record["status"] == "OPEN" else "CHECKED_OUT"
    return {"status": status, "record": record}


async def worker_history(worker: dict[str, Any], month: str, page: int, page_size: int) -> dict[str, Any]:
    """Return paginated attendance history for a worker."""

    rows = get_supabase().table("attendance_records").select("*").eq("worker_id", worker["id"]).eq("month_year", month).order("check_in_time", desc=True).execute().data
    total_hours = round(sum(float(row.get("hours_worked") or 0) for row in rows), 2)
    start = (page - 1) * page_size
    return {
        "records": rows[start : start + page_size],
        "total_days_present": len({row["check_in_time"][:10] for row in rows}),
        "total_hours_worked": total_hours,
        "pagination": {"page": page, "page_size": page_size, "total": len(rows)},
    }


async def admin_worker_attendance(admin: dict[str, Any], worker_id: UUID, month: str, page: int, page_size: int) -> dict[str, Any]:
    """Return a company worker's attendance records for admin review."""

    worker_rows = get_supabase().table("workers").select("*").eq("id", str(worker_id)).eq("company_id", admin["company_id"]).limit(1).execute().data
    if not worker_rows:
        raise AppError(404, "NOT_FOUND", "Worker was not found.")
    rows = get_supabase().table("attendance_records").select("*").eq("worker_id", str(worker_id)).eq("month_year", month).order("check_in_time", desc=True).execute().data
    total_hours = round(sum(float(row.get("hours_worked") or 0) for row in rows), 2)
    start = (page - 1) * page_size
    days_present = len({row["check_in_time"][:10] for row in rows})
    return {"records": rows[start : start + page_size], "summary": {"days_present": days_present, "days_absent": max(0, 22 - days_present), "total_hours": total_hours}, "pagination": {"page": page, "page_size": page_size, "total": len(rows)}}


async def edit_record(admin: dict[str, Any], record_id: UUID, payload: AttendanceEditRequest) -> dict[str, Any]:
    """Apply an admin manual attendance correction and audit it."""

    db = get_supabase()
    rows = db.table("attendance_records").select("*, workers(company_id)").eq("id", str(record_id)).limit(1).execute().data
    if not rows or rows[0]["workers"]["company_id"] != admin["company_id"]:
        raise AppError(404, "NOT_FOUND", "Attendance record was not found.")
    before = rows[0]
    update_data = payload.model_dump(exclude_unset=True, exclude={"reason"})
    if payload.check_in_time and payload.check_out_time:
        update_data["hours_worked"] = round((payload.check_out_time - payload.check_in_time).total_seconds() / 3600, 2)
    elif payload.check_in_time and before.get("check_out_time"):
        update_data["hours_worked"] = round((_parse_dt(before["check_out_time"]) - payload.check_in_time).total_seconds() / 3600, 2)
    elif payload.check_out_time and before.get("check_in_time"):
        update_data["hours_worked"] = round((payload.check_out_time - _parse_dt(before["check_in_time"])).total_seconds() / 3600, 2)
    update_data.update({"is_manual_edit": True, "edited_by": admin["id"], "edited_at": datetime.now(UTC).isoformat(), "edit_reason": payload.reason, "status": "MANUAL"})
    updated = db.table("attendance_records").update(jsonable_encoder(update_data)).eq("id", str(record_id)).execute().data[0]
    await write_audit(
        admin["id"],
        "admin",
        "MANUAL_ATTENDANCE_EDIT",
        str(record_id),
        "attendance_record",
        {"old_check_in": before.get("check_in_time"), "new_check_in": updated.get("check_in_time"), "old_check_out": before.get("check_out_time"), "new_check_out": updated.get("check_out_time"), "reason": payload.reason, "worker_id": before["worker_id"], "company_id": admin["company_id"]},
    )
    return updated

