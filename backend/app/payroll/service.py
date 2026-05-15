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


from app.squad.transfer import get_ledger_balance, transfer_to_worker, requery_transfer
from datetime import datetime, timezone


async def disburse_payroll(run_id: str, hr_officer: dict) -> dict:
    """
    Disburse payroll for a payroll run.
    Called after HR approves. Checks wallet balance first.
    Transfers to each verified worker via Squad Transfer API.
    Updates company wallet and creates payment receipts.
    """
    now = datetime.now(timezone.utc)
    company_id = hr_officer["company_id"]

    # Load payroll run
    run = get_supabase().table("payroll_runs").select("*").eq(
        "id", run_id
    ).single().execute().data
    if not run:
        raise AppError(404, "RUN_NOT_FOUND", "Payroll run not found.")

    # Load workers to pay: VERIFIED verdict (any HR decision) + hr_decision=INCLUDE
    results = get_supabase().table("ghost_analysis_results").select(
        "*, workers(id, first_name, last_name, company_id, "
        "worker_bank_accounts(account_number, bank_code, bank_name, account_name, is_active))"
    ).eq("payroll_run_id", run_id).execute().data or []

    workers_to_pay = [
        r for r in results
        if r["hr_decision"] == "INCLUDE"
        or (r["verdict"] == "VERIFIED" and r["hr_decision"] == "PENDING")
    ]

    if not workers_to_pay:
        raise AppError(400, "NO_WORKERS_TO_PAY", "No workers approved for payment in this payroll run.")

    # Calculate total net pay needed
    total_kobo_needed = 0
    worker_pay_details = []

    for result in workers_to_pay:
        worker = result.get("workers", {})

        # Get active bank account
        bank_accounts = worker.get("worker_bank_accounts", [])
        active_bank = next((b for b in bank_accounts if b["is_active"]), None)
        if not active_bank:
            print(f"Worker {worker['id']} has no active bank account — skipping")
            continue

        # Load salary details from role
        role_data = get_supabase().table("roles").select(
            "gross_salary, pension_deduct, health_deduct, other_deductions"
        ).eq("id", get_supabase().table("workers").select("role_id").eq(
            "id", worker["id"]
        ).single().execute().data["role_id"]).single().execute().data

        if not role_data:
            continue

        gross = float(role_data["gross_salary"])
        deductions = (
            float(role_data["pension_deduct"] or 0) +
            float(role_data["health_deduct"] or 0) +
            float(role_data["other_deductions"] or 0)
        )
        net_ngn = gross - deductions
        net_kobo = int(net_ngn * 100)

        if net_kobo <= 0:
            print(f"Worker {worker['id']} net pay is zero — skipping")
            continue

        total_kobo_needed += net_kobo
        worker_pay_details.append({
            "result": result,
            "worker": worker,
            "bank": active_bank,
            "gross_ngn": gross,
            "deductions_ngn": deductions,
            "net_ngn": net_ngn,
            "net_kobo": net_kobo
        })

    # CHECK COMPANY WALLET BALANCE
    wallet = get_supabase().table("company_wallet").select("*").eq(
        "company_id", company_id
    ).single().execute().data

    if not wallet:
        raise AppError(400, "WALLET_NOT_FOUND", "Company wallet not found. Contact support.")

    if wallet["balance_kobo"] < total_kobo_needed:
        shortfall_ngn = (total_kobo_needed - wallet["balance_kobo"]) / 100
        available_ngn = wallet["balance_kobo"] / 100
        needed_ngn = total_kobo_needed / 100
        raise AppError(402, "INSUFFICIENT_WALLET_BALANCE", (
            f"Insufficient funds. Payroll requires NGN {needed_ngn:,.2f} "
            f"but wallet has NGN {available_ngn:,.2f}. "
            f"Please deposit at least NGN {shortfall_ngn:,.2f} to proceed."
        ))

    # Update payroll run status
    get_supabase().table("payroll_runs").update({
        "status": "DISBURSING"
    }).eq("id", run_id).execute()

    # DISBURSE TO EACH WORKER
    paid_count = 0
    failed_count = 0
    total_paid_kobo = 0

    for detail in worker_pay_details:
        worker = detail["worker"]
        bank = detail["bank"]
        net_kobo = detail["net_kobo"]
        result = detail["result"]
        month_year = run["month_year"]

        remark = f"GhostGuard Salary {month_year} - {worker['first_name']} {worker['last_name']}"

        # Create wallet_transaction record BEFORE Squad call
        tx_insert = get_supabase().table("wallet_transactions").insert({
            "company_id": company_id,
            "type": "DISBURSEMENT",
            "amount_kobo": net_kobo,
            "status": "PENDING",
            "description": remark,
            "worker_id": worker["id"],
            "payroll_run_id": run_id,
            "created_at": now.isoformat()
        }).execute()

        tx_id = tx_insert.data[0]["id"] if tx_insert.data else None

        # Create payment receipt BEFORE Squad call
        receipt_insert = get_supabase().table("payment_receipts").insert({
            "payroll_run_id": run_id,
            "worker_id": worker["id"],
            "company_id": company_id,
            "gross_salary": detail["gross_ngn"],
            "total_deductions": detail["deductions_ngn"],
            "net_pay": detail["net_ngn"],
            "amount_kobo": net_kobo,
            "bank_account_number": bank["account_number"],
            "bank_code": bank["bank_code"],
            "bank_name": bank["bank_name"],
            "account_name": bank["account_name"],
            "trust_score": result.get("trust_score"),
            "verdict": result.get("verdict"),
            "days_present": result.get("days_present"),
            "hr_decision": result.get("hr_decision"),
            "squad_status": "PENDING",
            "month_year": month_year,
            "created_at": now.isoformat()
        }).execute()

        receipt_id = receipt_insert.data[0]["id"] if receipt_insert.data else None

        # CALL SQUAD TRANSFER
        if get_settings().use_squad_lookup:
            transfer_result = await transfer_to_worker(
                account_number=bank["account_number"],
                bank_code=bank["bank_code"],
                account_name=bank["account_name"],
                amount_kobo=net_kobo,
                company_id=company_id,
                worker_id=worker["id"],
                remark=remark
            )
        else:
            # Mock mode — simulate payment for demo
            import asyncio, uuid
            await asyncio.sleep(0.3)
            transfer_result = {
                "success": True,
                "squad_reference": f"{get_settings().squad_merchant_id}_{worker['id'][:8].upper()}_{int(now.timestamp())}",
                "squad_tx_id": f"SQPYT{uuid.uuid4().hex[:12].upper()}",
                "nip_reference": f"NIP{uuid.uuid4().hex[:20].upper()}",
                "amount_kobo": net_kobo
            }

        if transfer_result["success"]:
            squad_ref = transfer_result["squad_reference"]
            squad_tx = transfer_result["squad_tx_id"]
            nip_ref = transfer_result.get("nip_reference")

            # Update wallet_transaction
            if tx_id:
                get_supabase().table("wallet_transactions").update({
                    "status": "SUCCESS",
                    "squad_reference": squad_ref,
                    "squad_tx_id": squad_tx,
                    "squad_nip_ref": nip_ref,
                    "squad_response": transfer_result.get("raw"),
                    "updated_at": now.isoformat()
                }).eq("id", tx_id).execute()

            # Update payment receipt
            if receipt_id:
                get_supabase().table("payment_receipts").update({
                    "squad_reference": squad_ref,
                    "squad_tx_id": squad_tx,
                    "squad_status": "PAID" if get_settings().use_squad_lookup else "PAID",
                    "paid_at": now.isoformat()
                }).eq("id", receipt_id).execute()

            # Deduct from company wallet
            get_supabase().table("company_wallet").update({
                "balance_kobo": wallet["balance_kobo"] - net_kobo,
                "total_disbursed_kobo": wallet.get("total_disbursed_kobo", 0) + net_kobo,
                "last_disburse_at": now.isoformat(),
                "updated_at": now.isoformat()
            }).eq("company_id", company_id).execute()

            # Update wallet reference for next iteration
            wallet["balance_kobo"] -= net_kobo

            paid_count += 1
            total_paid_kobo += net_kobo

        else:
            # Handle requery case (424 timeout)
            final_status = "FAILED"
            if transfer_result.get("should_requery"):
                import asyncio
                await asyncio.sleep(2)
                requery = await requery_transfer(transfer_result.get("squad_reference", ""))
                if requery.get("status") == "success":
                    final_status = "SUCCESS"
                    paid_count += 1
                    total_paid_kobo += net_kobo
                    # Deduct from wallet
                    get_supabase().table("company_wallet").update({
                        "balance_kobo": wallet["balance_kobo"] - net_kobo,
                        "total_disbursed_kobo": wallet.get("total_disbursed_kobo", 0) + net_kobo,
                    }).eq("company_id", company_id).execute()
                    wallet["balance_kobo"] -= net_kobo

            if tx_id:
                get_supabase().table("wallet_transactions").update({
                    "status": final_status,
                    "failure_reason": transfer_result.get("error"),
                    "updated_at": now.isoformat()
                }).eq("id", tx_id).execute()

            if receipt_id:
                get_supabase().table("payment_receipts").update({
                    "squad_status": final_status,
                    "failure_reason": transfer_result.get("error")
                }).eq("id", receipt_id).execute()

            if final_status == "FAILED":
                failed_count += 1

    # Update payroll run to DISBURSED
    get_supabase().table("payroll_runs").update({
        "status": "DISBURSED",
        "approved_at": now.isoformat()
    }).eq("id", run_id).execute()

    # Audit log
    get_supabase().table("audit_logs").insert({
        "actor_id": hr_officer["id"],
        "actor_type": "hr",
        "action": "PAYROLL_DISBURSEMENT_COMPLETE",
        "target_id": run_id,
        "target_type": "payroll_run",
        "metadata": {
            "paid_count": paid_count,
            "failed_count": failed_count,
            "total_paid_ngn": total_paid_kobo / 100,
            "month_year": run["month_year"]
        }
    }).execute()

    return {
        "success": True,
        "message": f"Payroll disbursed. {paid_count} workers paid, {failed_count} failed.",
        "data": {
            "paid_count": paid_count,
            "failed_count": failed_count,
            "total_paid_ngn": total_paid_kobo / 100,
            "run_id": run_id
        }
    }


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
