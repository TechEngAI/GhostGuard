from decimal import Decimal
from typing import Any

import httpx

from app.config import get_settings
from app.database import get_supabase


def _money(value: Any) -> Decimal:
    return Decimal(str(value or 0))


def _safe_error(response: httpx.Response) -> str:
    try:
        body = response.json()
        return str(body.get("message") or body.get("error") or body)[:500]
    except ValueError:
        return response.text[:500]


def _first_row(data: Any) -> dict[str, Any] | None:
    if not data:
        return None
    return data[0] if isinstance(data, list) else data


async def initiate_single_payment(worker_result: dict[str, Any], run_id: str, squad_secret_key: str | None = None, reference: str | None = None) -> dict[str, Any]:
    """Create a receipt, then initiate one Squad transfer for one worker."""

    db = get_supabase()
    settings = get_settings()
    worker_id = str(worker_result["worker_id"])
    runs = db.table("payroll_runs").select("*").eq("id", run_id).limit(1).execute().data
    if not runs:
        return {"success": False, "error": "Payroll run not found"}
    run = runs[0]
    workers = db.table("workers").select("*, roles(*)").eq("id", worker_id).limit(1).execute().data
    if not workers:
        return {"success": False, "error": "Worker not found"}
    worker = workers[0]
    bank_rows = db.table("worker_bank_accounts").select("*").eq("worker_id", worker_id).eq("is_active", True).limit(1).execute().data
    if not bank_rows:
        return {"success": False, "error": "No active bank account", "code": "NO_ACTIVE_BANK_ACCOUNT"}
    bank = bank_rows[0]
    role = worker.get("roles") or {}
    gross = _money(role.get("gross_salary"))
    deductions = _money(role.get("pension_deduct")) + _money(role.get("health_deduct")) + _money(role.get("other_deductions"))
    net_pay = gross - deductions
    if net_pay <= 0:
        return {"success": False, "error": "Net pay is zero or negative", "code": "ZERO_NET_PAY"}
    amount_kobo = int(net_pay * 100)
    if not reference:
        import time

        reference = f"GG-PAY-{run_id[:8].upper()}-{worker_id[:8].upper()}-{int(time.time())}"
    existing = db.table("payment_receipts").select("*").eq("squad_reference", reference).limit(1).execute().data
    if existing:
        receipt = existing[0]
    else:
        receipt_result = (
            db.table("payment_receipts")
            .insert(
                {
                    "payroll_run_id": run_id,
                    "worker_id": worker_id,
                    "company_id": run["company_id"],
                    "squad_reference": reference,
                    "gross_salary": float(gross),
                    "total_deductions": float(deductions),
                    "net_pay": float(net_pay),
                    "amount_kobo": amount_kobo,
                    "bank_account_number": bank["account_number"],
                    "bank_code": bank["bank_code"],
                    "bank_name": bank["bank_name"],
                    "account_name": bank["account_name"],
                    "trust_score": worker_result.get("trust_score"),
                    "verdict": worker_result.get("verdict"),
                    "days_present": worker_result.get("days_present"),
                    "hr_decision": worker_result.get("hr_decision"),
                    "hr_note": worker_result.get("hr_note"),
                    "squad_status": "PENDING",
                    "month_year": run["month_year"],
                }
            )
            .execute()
        )
        receipt = _first_row(receipt_result.data)
        if not receipt:
            return {"success": False, "error": "Could not create payment receipt", "code": "RECEIPT_CREATE_FAILED"}
    worker_name = f"{worker.get('first_name', '')} {worker.get('last_name', '')}".strip()
    payload = {
        "amount": str(amount_kobo),
        "bank_code": bank["bank_code"],
        "account_number": bank["account_number"],
        "account_name": bank["account_name"],
        "currency_id": "NGN",
        "transaction_reference": reference,
        "remark": f"GhostGuard Salary - {worker_name} - {run['month_year']}",
    }
    headers = {
        "Authorization": f"Bearer {squad_secret_key or settings.squad_secret_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    url = f"{settings.squad_base_url.rstrip('/')}/payout/transfer"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        message = str(exc)[:500]
        db.table("payment_receipts").update({"squad_status": "FAILED", "failure_reason": message}).eq("id", receipt["id"]).execute()
        return {"success": False, "error": message, "receipt_id": receipt["id"], "amount_kobo": amount_kobo}
    if response.status_code == 200:
        data = response.json().get("data") or {}
        squad_tx_id = data.get("transaction_reference") or data.get("reference") or reference
        db.table("payment_receipts").update({"squad_tx_id": squad_tx_id, "squad_status": "PENDING", "failure_reason": None}).eq("id", receipt["id"]).execute()
        return {"success": True, "squad_tx_id": squad_tx_id, "reference": reference, "receipt_id": receipt["id"], "amount_kobo": amount_kobo}
    message = _safe_error(response)
    db.table("payment_receipts").update({"squad_status": "FAILED", "failure_reason": message}).eq("id", receipt["id"]).execute()
    return {"success": False, "error": message, "receipt_id": receipt["id"], "amount_kobo": amount_kobo}
