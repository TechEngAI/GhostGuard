import csv
import hashlib
import hmac
import json
from datetime import UTC, datetime
from io import StringIO
from typing import Any
from uuid import UUID

from app.auth.service import write_audit
from app.config import get_settings
from app.database import get_supabase
from app.errors import AppError
from app.payroll.schemas import PayrollDecisionRequest
from app.squad.payout import initiate_single_payment


VERDICT_ORDER = {"FLAGGED": 0, "SUSPICIOUS": 1, "VERIFIED": 2}


def _page(rows: list[dict[str, Any]], page: int, page_size: int) -> tuple[list[dict[str, Any]], dict[str, int]]:
    start = (page - 1) * page_size
    return rows[start : start + page_size], {"page": page, "page_size": page_size, "total": len(rows)}


def _money(value: Any) -> float:
    return float(value or 0)


def _require_row(data: Any, code: str, message: str) -> dict[str, Any]:
    if not data:
        raise AppError(500, code, message)
    return data[0] if isinstance(data, list) else data


async def _get_run_for_hr(hr: dict[str, Any], run_id: UUID | str) -> dict[str, Any]:
    rows = get_supabase().table("payroll_runs").select("*").eq("id", str(run_id)).eq("company_id", hr["company_id"]).limit(1).execute().data
    if not rows:
        raise AppError(404, "PAYROLL_RUN_NOT_FOUND", "Payroll run was not found.")
    return rows[0]


async def payroll_runs(hr: dict[str, Any]) -> dict[str, Any]:
    db = get_supabase()
    runs = db.table("payroll_runs").select("*").eq("company_id", hr["company_id"]).order("generated_at", desc=True).execute().data
    audit_rows = db.table("audit_logs").select("*").eq("actor_type", "hr").eq("action", "PAYROLL_APPROVED").execute().data
    approvers = {str((row.get("metadata") or {}).get("run_id")): (row.get("metadata") or {}).get("approved_by_name") for row in audit_rows}
    return {
        "runs": [
            {
                "id": run["id"],
                "month_year": run["month_year"],
                "status": run["status"],
                "total_workers": run["total_workers"],
                "flagged_count": run["flagged_count"],
                "suspicious_count": run["suspicious_count"],
                "verified_count": run["verified_count"],
                "generated_at": run["generated_at"],
                "approved_at": run.get("approved_at"),
                "approved_by_name": approvers.get(str(run["id"])),
            }
            for run in runs
        ]
    }


def _decorate_result(row: dict[str, Any]) -> dict[str, Any]:
    worker = row.get("workers") or {}
    role = worker.get("roles") or {}
    gross = _money(role.get("gross_salary") or row.get("gross_salary"))
    deductions = _money(role.get("pension_deduct")) + _money(role.get("health_deduct")) + _money(role.get("other_deductions"))
    return {
        "worker_id": row["worker_id"],
        "worker_name": f"{worker.get('first_name', '')} {worker.get('last_name', '')}".strip() or row.get("worker_name"),
        "role_name": role.get("role_name") or row.get("role_name"),
        "gross_salary": gross,
        "net_pay": round(gross - deductions, 2),
        "days_present": row.get("days_present"),
        "days_absent": row.get("days_absent"),
        "trust_score": row.get("trust_score"),
        "verdict": row.get("verdict"),
        "flag_reasons": row.get("flag_reasons"),
        "feature_values": row.get("feature_values"),
        "hr_decision": row.get("hr_decision") or "PENDING",
        "hr_note": row.get("hr_note"),
    }


async def payroll_results(hr: dict[str, Any], run_id: UUID, verdict: str | None, page: int, page_size: int) -> dict[str, Any]:
    run = await _get_run_for_hr(hr, run_id)
    query = get_supabase().table("ghost_analysis_results").select("*, workers(first_name,last_name,roles(role_name,gross_salary,pension_deduct,health_deduct,other_deductions))").eq("payroll_run_id", str(run_id))
    if verdict:
        query = query.eq("verdict", verdict)
    rows = [_decorate_result(row) for row in query.execute().data]
    rows.sort(key=lambda row: (VERDICT_ORDER.get(row.get("verdict"), 99), _money(row.get("trust_score"))))
    pending_count = sum(1 for row in rows if row["verdict"] in {"FLAGGED", "SUSPICIOUS"} and row["hr_decision"] == "PENDING")
    items, pagination = _page(rows, page, page_size)
    return {
        "run": {
            "id": run["id"],
            "month_year": run["month_year"],
            "status": run["status"],
            "summary_counts": {
                "flagged_count": run["flagged_count"],
                "suspicious_count": run["suspicious_count"],
                "verified_count": run["verified_count"],
            },
        },
        "results": items,
        "pending_decisions_count": pending_count,
        "pagination": pagination,
    }


async def set_decision(hr: dict[str, Any], run_id: UUID, worker_id: UUID, payload: PayrollDecisionRequest) -> dict[str, Any]:
    run = await _get_run_for_hr(hr, run_id)
    if run.get("status") != "ANALYSED":
        raise AppError(409, "PAYROLL_ALREADY_APPROVED", "Payroll already approved.")
    if payload.decision not in {"INCLUDE", "EXCLUDE"}:
        raise AppError(400, "INVALID_HR_DECISION", "Decision value must be INCLUDE or EXCLUDE.", "decision")
    if payload.decision == "EXCLUDE" and not (payload.note and payload.note.strip()):
        raise AppError(400, "NOTE_REQUIRED", "A note is required when excluding a worker.", "note")
    db = get_supabase()
    rows = db.table("ghost_analysis_results").select("*").eq("payroll_run_id", str(run_id)).eq("worker_id", str(worker_id)).limit(1).execute().data
    if not rows:
        raise AppError(404, "PAYROLL_RESULT_NOT_FOUND", "Payroll result was not found.")
    result = rows[0]
    update_result = (
        db.table("ghost_analysis_results")
        .update({"hr_decision": payload.decision, "hr_reviewed_at": datetime.now(UTC).isoformat(), "hr_note": payload.note})
        .eq("id", result["id"])
        .execute()
    )
    updated = _require_row(update_result.data, "DATABASE_UPDATE_FAILED", "Could not save payroll decision.")
    await write_audit(
        hr["id"],
        "hr",
        "HR_PAYROLL_DECISION",
        str(worker_id),
        "worker",
        {"run_id": str(run_id), "decision": payload.decision, "note": payload.note, "worker_trust_score": result.get("trust_score"), "worker_verdict": result.get("verdict")},
    )
    return updated


def _needs_decision(row: dict[str, Any]) -> bool:
    return row.get("verdict") in {"FLAGGED", "SUSPICIOUS"} and (row.get("hr_decision") or "PENDING") == "PENDING"


async def approve_payroll(hr: dict[str, Any], run_id: UUID) -> dict[str, Any]:
    db = get_supabase()
    run = await _get_run_for_hr(hr, run_id)
    if run.get("status") != "ANALYSED":
        raise AppError(409, "PAYROLL_ALREADY_APPROVED", "Payroll run already locked and approved.")
    results = db.table("ghost_analysis_results").select("*, workers(roles(gross_salary,pension_deduct,health_deduct,other_deductions))").eq("payroll_run_id", str(run_id)).execute().data
    pending = sum(1 for row in results if _needs_decision(row))
    if pending:
        raise AppError(400, "PENDING_DECISIONS_REMAIN", f"{pending} workers still need your decision before you can approve payroll.")
    included = [row for row in results if row.get("hr_decision") == "INCLUDE" or ((row.get("hr_decision") or "PENDING") == "PENDING" and row.get("verdict") == "VERIFIED")]
    excluded = [row for row in results if row.get("hr_decision") == "EXCLUDE"]
    total = 0.0
    for row in included:
        role = ((row.get("workers") or {}).get("roles") or {})
        total += _money(role.get("gross_salary")) - _money(role.get("pension_deduct")) - _money(role.get("health_deduct")) - _money(role.get("other_deductions"))
    approved_at = datetime.now(UTC).isoformat()
    update_result = db.table("payroll_runs").update({"status": "APPROVED", "approved_at": approved_at}).eq("id", str(run_id)).eq("company_id", hr["company_id"]).execute()
    updated = _require_row(update_result.data, "DATABASE_UPDATE_FAILED", "Could not approve payroll.")
    hr_name = f"{hr.get('first_name', '')} {hr.get('last_name', '')}".strip()
    await write_audit(hr["id"], "hr", "PAYROLL_APPROVED", str(run_id), "payroll_run", {"run_id": str(run_id), "month_year": run["month_year"], "approved_worker_count": len(included), "approved_by_name": hr_name})
    return {
        "run_id": str(run_id),
        "approved_at": updated.get("approved_at") or approved_at,
        "workers_to_be_paid": len(included),
        "workers_excluded": len(excluded),
        "estimated_total_payout": round(total, 2),
    }


async def disburse_payroll(run_id: str) -> dict[str, Any]:
    db = get_supabase()
    settings = get_settings()
    runs = db.table("payroll_runs").select("*").eq("id", run_id).limit(1).execute().data
    if not runs:
        raise AppError(404, "PAYROLL_RUN_NOT_FOUND", "Payroll run was not found.")
    run = runs[0]
    results = db.table("ghost_analysis_results").select("*").eq("payroll_run_id", run_id).execute().data
    workers = [row for row in results if row.get("hr_decision") == "INCLUDE" or ((row.get("hr_decision") or "PENDING") == "PENDING" and row.get("verdict") == "VERIFIED")]
    db.table("payroll_runs").update({"status": "DISBURSING"}).eq("id", run_id).execute()
    summary = {"paid": 0, "failed": 0, "total_amount_kobo": 0}
    for result in workers:
        attempt = await initiate_single_payment(result, run_id, settings.squad_secret_key)
        if attempt.get("success"):
            summary["paid"] += 1
            summary["total_amount_kobo"] += int(attempt.get("amount_kobo") or 0)
        else:
            summary["failed"] += 1
        await write_audit(None or result["worker_id"], "system", "SQUAD_PAYMENT_INITIATED", result["worker_id"], "worker", {"run_id": run_id, **attempt})
    db.table("payroll_runs").update({"status": "DISBURSED"}).eq("id", run_id).execute()
    await write_audit(run.get("generated_by") or "00000000-0000-0000-0000-000000000000", "system", "PAYROLL_DISBURSEMENT_COMPLETE", run_id, "payroll_run", {"run_id": run_id, "paid_count": summary["paid"], "failed_count": summary["failed"], "total_amount_kobo": summary["total_amount_kobo"]})
    return summary


async def receipts(hr: dict[str, Any], run_id: UUID, squad_status: str | None, page: int, page_size: int) -> dict[str, Any]:
    await _get_run_for_hr(hr, run_id)
    query = get_supabase().table("payment_receipts").select("*, workers(first_name,last_name,roles(role_name))").eq("payroll_run_id", str(run_id))
    if squad_status:
        query = query.eq("squad_status", squad_status)
    rows = query.order("created_at", desc=True).execute().data
    summary_rows = get_supabase().table("payment_receipts").select("*").eq("payroll_run_id", str(run_id)).execute().data
    decorated = [_decorate_receipt(row) for row in rows]
    items, pagination = _page(decorated, page, page_size)
    return {
        "summary": {
            "total_paid": sum(1 for row in summary_rows if row.get("squad_status") == "PAID"),
            "total_failed": sum(1 for row in summary_rows if row.get("squad_status") == "FAILED"),
            "total_pending": sum(1 for row in summary_rows if row.get("squad_status") == "PENDING"),
            "total_amount_disbursed": round(sum(_money(row.get("net_pay")) for row in summary_rows if row.get("squad_status") == "PAID"), 2),
        },
        "receipts": items,
        "pagination": pagination,
    }


def _decorate_receipt(row: dict[str, Any]) -> dict[str, Any]:
    worker = row.get("workers") or {}
    role = worker.get("roles") or {}
    return {
        "id": row["id"],
        "worker_id": row["worker_id"],
        "worker_name": f"{worker.get('first_name', '')} {worker.get('last_name', '')}".strip(),
        "role_name": role.get("role_name"),
        "net_pay": row.get("net_pay"),
        "amount_kobo": row.get("amount_kobo"),
        "bank_account_number": row.get("bank_account_number"),
        "bank_name": row.get("bank_name"),
        "account_name": row.get("account_name"),
        "squad_tx_id": row.get("squad_tx_id"),
        "squad_reference": row.get("squad_reference"),
        "squad_status": row.get("squad_status"),
        "trust_score": row.get("trust_score"),
        "verdict": row.get("verdict"),
        "days_present": row.get("days_present"),
        "hr_decision": row.get("hr_decision"),
        "hr_note": row.get("hr_note"),
        "paid_at": row.get("paid_at"),
    }


async def receipts_csv(hr: dict[str, Any], run_id: UUID) -> tuple[str, str]:
    run = await _get_run_for_hr(hr, run_id)
    rows = get_supabase().table("payment_receipts").select("*, workers(first_name,last_name,roles(role_name))").eq("payroll_run_id", str(run_id)).order("created_at").execute().data
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=["worker_name", "role", "gross_salary", "deductions", "net_pay", "bank_account", "bank_name", "squad_tx_id", "squad_status", "trust_score", "verdict", "days_present", "hr_decision", "paid_at"])
    writer.writeheader()
    for row in rows:
        worker = row.get("workers") or {}
        role = worker.get("roles") or {}
        writer.writerow(
            {
                "worker_name": f"{worker.get('first_name', '')} {worker.get('last_name', '')}".strip(),
                "role": role.get("role_name"),
                "gross_salary": row.get("gross_salary"),
                "deductions": row.get("total_deductions"),
                "net_pay": row.get("net_pay"),
                "bank_account": row.get("bank_account_number"),
                "bank_name": row.get("bank_name"),
                "squad_tx_id": row.get("squad_tx_id"),
                "squad_status": row.get("squad_status"),
                "trust_score": row.get("trust_score"),
                "verdict": row.get("verdict"),
                "days_present": row.get("days_present"),
                "hr_decision": row.get("hr_decision"),
                "paid_at": row.get("paid_at"),
            }
        )
    return output.getvalue(), f"ghostguard_receipts_{run['month_year']}.csv"


async def retry_receipt(hr: dict[str, Any], run_id: UUID, receipt_id: UUID) -> dict[str, Any]:
    run = await _get_run_for_hr(hr, run_id)
    db = get_supabase()
    rows = db.table("payment_receipts").select("*").eq("id", str(receipt_id)).eq("payroll_run_id", str(run_id)).eq("company_id", hr["company_id"]).limit(1).execute().data
    if not rows:
        raise AppError(404, "RECEIPT_NOT_FOUND", "Payment receipt not found.")
    receipt = rows[0]
    if receipt.get("squad_status") != "FAILED":
        raise AppError(400, "PAYMENT_NOT_FAILED", "Retry requested but payment is not in FAILED status.")
    result_rows = db.table("ghost_analysis_results").select("*").eq("payroll_run_id", str(run_id)).eq("worker_id", receipt["worker_id"]).limit(1).execute().data
    if not result_rows:
        raise AppError(404, "PAYROLL_RESULT_NOT_FOUND", "Payroll result was not found.")
    db.table("payment_receipts").update({"squad_status": "PENDING", "failure_reason": None}).eq("id", str(receipt_id)).execute()
    attempt = await initiate_single_payment(result_rows[0], str(run_id), get_settings().squad_secret_key, receipt["squad_reference"])
    await write_audit(hr["id"], "hr", "PAYMENT_RETRY", str(receipt_id), "payment_receipt", {"receipt_id": str(receipt_id), "worker_id": receipt["worker_id"], "squad_reference": receipt["squad_reference"], "attempt": attempt, "month_year": run["month_year"]})
    return {"success": True, "message": "Payment retry initiated."}


async def worker_payslip(worker: dict[str, Any], month_year: str | None) -> dict[str, Any]:
    db = get_supabase()
    query = db.table("payment_receipts").select("*, workers(first_name,last_name,roles(role_name))").eq("worker_id", worker["id"])
    if month_year:
        query = query.eq("month_year", month_year)
    rows = query.order("created_at", desc=True).limit(1).execute().data
    if not rows:
        raise AppError(404, "RECEIPT_NOT_FOUND", "No payslip found for this period.")
    row = rows[0]
    result_rows = db.table("ghost_analysis_results").select("days_absent").eq("payroll_run_id", row["payroll_run_id"]).eq("worker_id", worker["id"]).limit(1).execute().data
    worker_data = row.get("workers") or {}
    role = worker_data.get("roles") or {}
    payload = {
        "worker_name": f"{worker_data.get('first_name', '')} {worker_data.get('last_name', '')}".strip(),
        "role_name": role.get("role_name"),
        "month_year": row.get("month_year"),
        "gross_salary": row.get("gross_salary"),
        "total_deductions": row.get("total_deductions"),
        "net_pay": row.get("net_pay"),
        "days_present": row.get("days_present"),
        "days_absent": result_rows[0].get("days_absent") if result_rows else None,
        "bank_account_number": row.get("bank_account_number"),
        "bank_name": row.get("bank_name"),
        "squad_tx_id": row.get("squad_tx_id"),
        "squad_status": row.get("squad_status"),
        "paid_at": row.get("paid_at"),
        "trust_score": row.get("trust_score"),
        "verdict": row.get("verdict"),
    }
    if _money(row.get("trust_score")) < 70 and row.get("verdict") == "SUSPICIOUS":
        payload["message"] = "Your attendance patterns triggered a review. Contact HR if you have questions."
    return payload


async def worker_payslips(worker: dict[str, Any]) -> dict[str, Any]:
    rows = get_supabase().table("payment_receipts").select("month_year, net_pay, squad_status, paid_at, trust_score").eq("worker_id", worker["id"]).order("created_at", desc=True).execute().data
    return {"payslips": rows}


async def handle_squad_webhook(raw_body: bytes, signature: str | None) -> dict[str, Any]:
    settings = get_settings()
    expected = hmac.new(settings.squad_secret_key.encode(), raw_body, hashlib.sha512).hexdigest().upper()
    if not signature or not hmac.compare_digest(expected, signature.upper()):
        await write_audit("00000000-0000-0000-0000-000000000000", "system", "SQUAD_WEBHOOK_INVALID_SIGNATURE", None, "payment_receipt", {})
        return {"ignored": True}
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        return {"ignored": True}
    reference = payload.get("transaction_reference") or payload.get("reference")
    status = str(payload.get("transaction_status") or payload.get("status") or "").lower()
    amount = payload.get("amount")
    if not reference:
        return {"ignored": True}
    db = get_supabase()
    rows = db.table("payment_receipts").select("*").eq("squad_reference", reference).limit(1).execute().data
    if not rows:
        return {"ignored": True}
    receipt = rows[0]
    if status == "success":
        update_result = db.table("payment_receipts").update({"squad_status": "PAID", "paid_at": datetime.now(UTC).isoformat(), "squad_tx_id": reference}).eq("id", receipt["id"]).execute()
        updated = _require_row(update_result.data, "DATABASE_UPDATE_FAILED", "Could not update payment receipt.")
        await write_audit(receipt["worker_id"], "system", "SQUAD_PAYMENT_CONFIRMED", receipt["id"], "payment_receipt", {"receipt_id": receipt["id"], "worker_id": receipt["worker_id"], "amount": amount})
        return updated
    if status == "failed":
        message = payload.get("message") or payload.get("status_message") or "Payment failed."
        update_result = db.table("payment_receipts").update({"squad_status": "FAILED", "failure_reason": message}).eq("id", receipt["id"]).execute()
        updated = _require_row(update_result.data, "DATABASE_UPDATE_FAILED", "Could not update payment receipt.")
        await write_audit(receipt["worker_id"], "system", "SQUAD_PAYMENT_FAILED", receipt["id"], "payment_receipt", {"receipt_id": receipt["id"], "worker_id": receipt["worker_id"], "amount": amount, "message": message})
        return updated
    return {"ignored": True}
