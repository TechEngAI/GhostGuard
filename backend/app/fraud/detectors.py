from datetime import UTC, datetime, timedelta
from statistics import mean, pstdev
from typing import Any

from app.database import get_supabase


def _month_bounds(month_year: str) -> tuple[datetime, datetime]:
    start = datetime.strptime(month_year, "%Y-%m").replace(tzinfo=UTC)
    end = datetime(start.year + (1 if start.month == 12 else 0), 1 if start.month == 12 else start.month + 1, 1, tzinfo=UTC)
    return start, end


async def detect_impossible_travel(*_: Any, **__: Any) -> dict[str, Any]:
    """Realtime impossible travel detection is implemented during check-in."""

    return {"flagged": False, "reason": "Realtime check-in detector handles impossible travel."}


async def detect_device_sharing(*_: Any, **__: Any) -> dict[str, Any]:
    """Realtime device sharing detection is implemented during check-in."""

    return {"flagged": False, "reason": "Realtime check-in detector handles device sharing."}


async def detect_gps_boundary_hugging(worker_id: str, month_year: str, company_geofence_radius: float) -> dict[str, Any]:
    """Detect workers who repeatedly check in near the geofence boundary."""

    db = get_supabase()
    rows = db.table("attendance_records").select("*").eq("worker_id", worker_id).eq("month_year", month_year).execute().data
    distances = [float(row["distance_from_office"]) for row in rows if row.get("distance_from_office") is not None]
    if not distances:
        return {"score": 0.0, "flagged": False}
    boundary_count = sum(1 for distance in distances if abs(distance - float(company_geofence_radius)) <= 10)
    score = boundary_count / len(distances)
    flagged = score > 0.5 and len(distances) >= 5
    if flagged:
        worker_result = db.table("workers").select("company_id").eq("id", worker_id).maybe_single().execute()
        if worker_result.data:
            db.table("fraud_signals").insert(
                {
                    "worker_id": worker_id,
                    "company_id": worker_result.data["company_id"],
                    "signal_type": "GPS_BOUNDARY_HUGGING",
                    "severity": "HIGH",
                    "metadata": {"boundary_hugging_score": round(score, 4), "boundary_hugging_count": boundary_count, "total_checkins": len(distances)},
                }
            ).execute()
    return {"score": round(score, 4), "flagged": flagged}


async def detect_approval_path_anomaly(company_id: str, month_year: str) -> list[dict[str, Any]]:
    """Detect admins with unusually high manual attendance edit counts."""

    db = get_supabase()
    start, end = _month_bounds(month_year)
    logs = (
        db.table("audit_logs")
        .select("*")
        .eq("action", "MANUAL_ATTENDANCE_EDIT")
        .gte("created_at", start.isoformat())
        .lt("created_at", end.isoformat())
        .execute()
        .data
    )
    company_logs = [log for log in logs if (log.get("metadata") or {}).get("company_id") == company_id]
    counts: dict[str, int] = {}
    for log in company_logs:
        counts[log["actor_id"]] = counts.get(log["actor_id"], 0) + 1
    if len(counts) < 2:
        return []
    values = list(counts.values())
    company_mean = mean(values)
    company_std = pstdev(values) or 0.0
    if company_std == 0:
        return []
    flagged = []
    for admin_id, edit_count in counts.items():
        if edit_count > company_mean + (2 * company_std):
            z_score = (edit_count - company_mean) / company_std
            signal = {
                "worker_id": None,
                "company_id": company_id,
                "signal_type": "APPROVAL_PATH_ANOMALY",
                "severity": "CRITICAL" if z_score > 3 else "HIGH",
                "metadata": {"admin_id": admin_id, "edit_count": edit_count, "company_mean": company_mean, "company_std_dev": company_std, "z_score": z_score, "month_year": month_year},
            }
            db.table("fraud_signals").insert(signal).execute()
            flagged.append(signal)
    return flagged


async def detect_bank_velocity(worker_id: str) -> dict[str, Any]:
    """Detect frequent bank account changes in the last 90 days."""

    db = get_supabase()
    since = (datetime.now(UTC) - timedelta(days=90)).isoformat()
    rows = db.table("bank_account_history").select("*").eq("worker_id", worker_id).gte("changed_at", since).execute().data
    account_numbers = [row.get("new_account") for row in rows if row.get("new_account")]
    flagged = len(rows) >= 2
    if flagged:
        worker_result = db.table("workers").select("company_id").eq("id", worker_id).maybe_single().execute()
        if worker_result.data:
            db.table("fraud_signals").insert(
                {
                    "worker_id": worker_id,
                    "company_id": worker_result.data["company_id"],
                    "signal_type": "BANK_VELOCITY",
                    "severity": "HIGH",
                    "metadata": {"change_count": len(rows), "period_days": 90, "account_numbers": account_numbers},
                }
            ).execute()
    return {"change_count": len(rows), "flagged": flagged}

