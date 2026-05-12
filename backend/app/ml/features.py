from calendar import monthrange
from datetime import UTC, datetime, timedelta
from statistics import mean, stdev
from typing import Any

import numpy as np

from app.database import get_supabase


def working_days_in_month(month_year: str) -> int:
    year, month = [int(part) for part in month_year.split("-")]
    days = monthrange(year, month)[1]
    return sum(1 for day in range(1, days + 1) if datetime(year, month, day).weekday() < 5)


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _month_bounds(month_year: str) -> tuple[str, str]:
    start = datetime.strptime(month_year, "%Y-%m").replace(tzinfo=UTC)
    end = datetime(start.year + (1 if start.month == 12 else 0), 1 if start.month == 12 else start.month + 1, 1, tzinfo=UTC)
    return start.isoformat(), end.isoformat()


def _checkin_minutes(records: list[dict[str, Any]]) -> list[float]:
    values = []
    for record in records:
        dt = _parse_dt(record.get("check_in_time"))
        if dt:
            values.append(dt.hour * 60 + dt.minute)
    return values


def _peer_correlation(worker_id: str, company_id: str, month_year: str, current_values: list[float]) -> float:
    if len(current_values) < 2:
        return 0.0
    rows = get_supabase().table("attendance_records").select("worker_id, check_in_time").eq("company_id", company_id).eq("month_year", month_year).neq("worker_id", worker_id).execute().data
    grouped: dict[str, list[float]] = {}
    for row in rows:
        dt = _parse_dt(row.get("check_in_time"))
        if dt:
            grouped.setdefault(row["worker_id"], []).append(dt.hour * 60 + dt.minute)
    best = 0.0
    for values in grouped.values():
        length = min(len(values), len(current_values))
        if length >= 2:
            corr = float(np.corrcoef(current_values[:length], values[:length])[0, 1])
            if not np.isnan(corr):
                best = max(best, corr)
    return round(best, 4)


async def compute_worker_features(worker_id: str, company_id: str, month_year: str) -> dict:
    """Compute the exact GhostGuard ML feature set for one worker."""

    db = get_supabase()
    worker = db.table("workers").select("*, roles(*)").eq("id", worker_id).eq("company_id", company_id).limit(1).execute().data[0]
    role = worker.get("roles") or {}
    company = db.table("companies").select("geofence_radius").eq("id", company_id).limit(1).execute().data[0]
    records = db.table("attendance_records").select("*").eq("worker_id", worker_id).eq("month_year", month_year).execute().data
    working_days = working_days_in_month(month_year)
    present_dates = {record["check_in_time"][:10] for record in records if record.get("check_in_time")}
    days_present = len(present_dates)
    values = _checkin_minutes(records)
    std_dev = stdev(values) if len(values) >= 2 else 0.0
    geofence = float(company.get("geofence_radius") or 100)
    boundary_count = sum(1 for record in records if record.get("distance_from_office") is not None and abs(float(record["distance_from_office"]) - geofence) <= 10)
    gps_boundary_score = boundary_count / len(records) if records else 0.0
    start, end = _month_bounds(month_year)
    frauds = db.table("fraud_signals").select("*").eq("worker_id", worker_id).gte("detected_at", start).lt("detected_at", end).execute().data
    impossible_count = sum(1 for fraud in frauds if fraud["signal_type"] == "IMPOSSIBLE_TRAVEL")
    shared_counts = [int((fraud.get("metadata") or {}).get("shared_count") or 0) for fraud in frauds if fraud["signal_type"] == "DEVICE_SHARED"]
    since = (datetime.now(UTC) - timedelta(days=90)).isoformat()
    bank_changes = db.table("bank_account_history").select("*").eq("worker_id", worker_id).gte("changed_at", since).execute().data
    login_gaps = []
    last_login = _parse_dt(worker.get("last_login"))
    if last_login:
        for record in records:
            checkin = _parse_dt(record.get("check_in_time"))
            if checkin:
                login_gaps.append(abs((checkin - last_login).total_seconds()) / 60)
    gross_salary = float(role.get("gross_salary") or 0)
    deductions = float(role.get("pension_deduct") or 0) + float(role.get("health_deduct") or 0) + float(role.get("other_deductions") or 0)
    return {
        "worker_id": str(worker_id),
        "worker_name": f"{worker['first_name']} {worker['last_name']}",
        "role_name": role.get("role_name") or "",
        "gross_salary": gross_salary,
        "days_present": days_present,
        "days_absent": max(0, working_days - days_present),
        "working_days": working_days,
        "days_present_ratio": round(days_present / working_days, 4) if working_days else 0.0,
        "checkin_time_std_dev": round(float(std_dev), 4),
        "gps_boundary_score": round(gps_boundary_score, 4),
        "device_shared_count": max(shared_counts) if shared_counts else 0,
        "impossible_travel_count": impossible_count,
        "peer_checkin_correlation": _peer_correlation(worker_id, company_id, month_year, values),
        "bank_change_velocity": round(len(bank_changes) / 3.0, 4),
        "completeness_score": float(worker.get("completeness_score") or 0),
        "deduction_ratio": round(deductions / gross_salary, 4) if gross_salary else 0.0,
        "login_to_checkin_gap": round(mean(login_gaps), 4) if login_gaps else 0.0,
    }


async def compute_company_features(company_id: str, month_year: str) -> list[dict]:
    """Compute feature rows for every active worker in a company."""

    workers = get_supabase().table("workers").select("id").eq("company_id", company_id).eq("status", "ACTIVE").execute().data
    return [await compute_worker_features(worker["id"], company_id, month_year) for worker in workers]

