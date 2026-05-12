from datetime import UTC, datetime
from io import StringIO
from typing import Any
from uuid import UUID

import pandas as pd

from app.auth.service import write_audit
from app.database import get_supabase
from app.errors import AppError
from app.fraud.detectors import detect_approval_path_anomaly, detect_bank_velocity, detect_gps_boundary_hugging
from app.ml.engine import run_ghost_detection
from app.ml.features import compute_company_features
from app.ml.schemas import PayrollGenerateRequest


def _month_year(month: int, year: int) -> str:
    return f"{year}-{month:02d}"


def _validate_month(payload: PayrollGenerateRequest) -> None:
    current = datetime.now(UTC)
    if (payload.year, payload.month) > (current.year, current.month):
        raise AppError(400, "FUTURE_MONTH", "Payroll analysis cannot be generated for a future month.")


def _require_row(data: Any, code: str, message: str) -> dict[str, Any]:
    if not data:
        raise AppError(500, code, message)
    return data[0] if isinstance(data, list) else data


async def generate_payroll(admin: dict[str, Any], payload: PayrollGenerateRequest) -> dict[str, Any]:
    """Generate payroll analysis and ghost-worker ML results for a company month."""

    _validate_month(payload)
    db = get_supabase()
    month_year = _month_year(payload.month, payload.year)
    existing = db.table("payroll_runs").select("id").eq("company_id", admin["company_id"]).eq("month_year", month_year).limit(1).execute().data
    if existing:
        raise AppError(409, "PAYROLL_ALREADY_GENERATED", "Payroll analysis already generated for this month. Use GET /admin/payroll/{run_id}/results")

    await detect_approval_path_anomaly(admin["company_id"], month_year)
    company_result = db.table("companies").select("geofence_radius").eq("id", admin["company_id"]).maybe_single().execute()
    if not company_result.data:
        raise AppError(404, "COMPANY_NOT_FOUND", "Company profile was not found.")
    company = company_result.data
    workers = db.table("workers").select("id").eq("company_id", admin["company_id"]).eq("status", "ACTIVE").execute().data
    for worker in workers:
        await detect_gps_boundary_hugging(worker["id"], month_year, float(company.get("geofence_radius") or 100))
        await detect_bank_velocity(worker["id"])

    feature_rows = await compute_company_features(admin["company_id"], month_year)
    if len(feature_rows) == 0:
        raise AppError(400, "NO_WORKERS", "No active workers found for this period.")
    results = run_ghost_detection(feature_rows)
    counts = {
        "flagged_count": sum(1 for result in results if result["verdict"] == "FLAGGED"),
        "suspicious_count": sum(1 for result in results if result["verdict"] == "SUSPICIOUS"),
        "verified_count": sum(1 for result in results if result["verdict"] == "VERIFIED"),
    }
    run_result = (
        db.table("payroll_runs")
        .insert(
            {
                "company_id": admin["company_id"],
                "month_year": month_year,
                "month": payload.month,
                "year": payload.year,
                "total_workers": len(results),
                **counts,
                "status": "ANALYSED",
                "generated_by": admin["id"],
                "csv_data": feature_rows,
            }
        )
        .execute()
    )
    run = _require_row(run_result.data, "DATABASE_INSERT_FAILED", "Could not create payroll run. Please try again.")
    for result in results:
        db.table("ghost_analysis_results").insert(
            {
                "payroll_run_id": run["id"],
                "worker_id": result["worker_id"],
                "company_id": admin["company_id"],
                "trust_score": result["trust_score"],
                "anomaly_score": result["anomaly_score"],
                "verdict": result["verdict"],
                "flag_reasons": result["flag_reasons"],
                "feature_values": result["feature_values"],
                "days_present": result["days_present"],
                "days_absent": result["days_absent"],
                "gross_salary": result["gross_salary"],
                "hr_decision": "PENDING",
            }
        ).execute()
    await write_audit(admin["id"], "admin", "PAYROLL_ANALYSIS_GENERATED", run["id"], "payroll_run", {"month_year": month_year, "total_workers": len(results), "flagged_count": counts["flagged_count"]})
    return {"payroll_run_id": run["id"], "month_year": month_year, "total_workers": len(results), **counts, "summary": f"{counts['flagged_count']} workers flagged as ghost workers. {counts['suspicious_count']} require manual review."}


async def list_runs(admin: dict[str, Any]) -> dict[str, Any]:
    """Return payroll runs for a company."""

    runs = get_supabase().table("payroll_runs").select("id, month_year, total_workers, flagged_count, suspicious_count, verified_count, status, generated_at").eq("company_id", admin["company_id"]).order("generated_at", desc=True).execute().data
    return {"runs": runs}


async def get_results(admin: dict[str, Any], run_id: UUID, verdict: str | None, page: int, page_size: int) -> dict[str, Any]:
    """Return paginated ghost analysis results for a payroll run."""

    db = get_supabase()
    runs = db.table("payroll_runs").select("*").eq("id", str(run_id)).eq("company_id", admin["company_id"]).limit(1).execute().data
    if not runs:
        raise AppError(404, "PAYROLL_RUN_NOT_FOUND", "Payroll run was not found.")
    query = db.table("ghost_analysis_results").select("*, workers(first_name,last_name,roles(role_name))").eq("payroll_run_id", str(run_id))
    if verdict:
        query = query.eq("verdict", verdict)
    rows = query.order("trust_score", desc=False).execute().data
    start = (page - 1) * page_size
    return {"run": runs[0], "results": rows[start : start + page_size], "pagination": {"page": page, "page_size": page_size, "total": len(rows)}}


async def csv_for_run(admin: dict[str, Any], run_id: UUID) -> tuple[str, str]:
    """Build a CSV export for a payroll run."""

    db = get_supabase()
    runs = db.table("payroll_runs").select("*, companies(name)").eq("id", str(run_id)).eq("company_id", admin["company_id"]).limit(1).execute().data
    if not runs:
        raise AppError(404, "PAYROLL_RUN_NOT_FOUND", "Payroll run was not found.")
    run = runs[0]
    results = db.table("ghost_analysis_results").select("worker_id, trust_score, verdict").eq("payroll_run_id", str(run_id)).execute().data
    result_map = {row["worker_id"]: row for row in results}
    rows = []
    for row in run.get("csv_data") or []:
        result = result_map.get(row["worker_id"], {})
        rows.append({**row, "trust_score": result.get("trust_score"), "verdict": result.get("verdict")})
    output = StringIO()
    pd.DataFrame(rows).to_csv(output, index=False)
    company_name = (run.get("companies") or {}).get("name", "company").replace(" ", "_").lower()
    return output.getvalue(), f"ghostguard_payroll_{run['month_year']}_{company_name}.csv"

