import httpx
import time
from app.config import settings


def _make_transfer_reference(company_id: str, worker_id: str) -> str:
    """
    Generate unique transfer reference.
    Squad REQUIRES merchant ID prepended — format: MERCHANTID_xxxx
    """
    merchant = settings.squad_merchant_id.upper()
    comp = company_id.replace("-", "")[:8].upper()
    work = worker_id.replace("-", "")[:8].upper()
    ts = str(int(time.time()))
    return f"{merchant}_{comp}_{work}_{ts}"


async def get_ledger_balance() -> dict:
    """
    Get GhostGuard's Squad wallet ledger balance.
    Squad API: GET /merchant/balance?currency_id=NGN
    Returns balance in KOBO.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{settings.squad_base_url}/merchant/balance",
                params={"currency_id": "NGN"},
                headers={"Authorization": f"Bearer {settings.squad_secret_key}"}
            )

        if response.status_code == 200:
            data = response.json().get("data", {})
            return {
                "success": True,
                "balance_kobo": int(data.get("balance", 0)),
                "merchant_id": data.get("merchant_id")
            }
        return {"success": False, "error": "Could not retrieve balance."}

    except Exception as e:
        print(f"Squad balance error: {e}")
        return {"success": False, "error": "Balance check failed."}


async def transfer_to_worker(
    account_number: str,
    bank_code: str,
    account_name: str,
    amount_kobo: int,
    company_id: str,
    worker_id: str,
    remark: str,
) -> dict:
    """
    Transfer funds from GhostGuard's Squad ledger to a worker's bank account.
    Squad API: POST /payout/transfer

    Rules from Squad docs:
    - amount is in KOBO (NGN * 100)
    - transaction_reference MUST start with merchant ID
    - account_number must have been looked up first
    - remark must be provided
    - currency_id must be "NGN"
    """
    reference = _make_transfer_reference(company_id, worker_id)

    payload = {
        "transaction_reference": reference,
        "amount": str(amount_kobo),           # Squad expects string
        "bank_code": bank_code,
        "account_number": account_number,
        "account_name": account_name,
        "currency_id": "NGN",
        "remark": remark[:50]                 # keep remark concise
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.squad_base_url}/payout/transfer",
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.squad_secret_key}",
                    "Content-Type": "application/json"
                }
            )

        print(f"Squad transfer [{reference}]: {response.status_code} — {response.text[:300]}")
        response_data = response.json()

        if response.status_code == 200:
            data = response_data.get("data", {})
            nip_ref = data.get("nip_transaction_reference")

            # Squad best practice: check nip_transaction_reference exists
            # If it does not exist, the transfer may not have gone through
            if not nip_ref:
                print(f"WARNING: No NIP reference returned for {reference} — requery recommended")

            return {
                "success": True,
                "squad_reference": reference,
                "squad_tx_id": data.get("transaction_reference", reference),
                "nip_reference": nip_ref,
                "amount_kobo": amount_kobo,
                "raw": data
            }

        # Handle specific Squad error codes
        status_code = response.status_code
        message = response_data.get("message", f"Transfer failed ({status_code})")

        if status_code == 424:
            # Timeout/failed — Squad says to requery, not retry
            return {
                "success": False,
                "should_requery": True,
                "squad_reference": reference,
                "error": "Transfer timeout — will requery to confirm status."
            }

        return {
            "success": False,
            "should_requery": False,
            "squad_reference": reference,
            "error": message
        }

    except httpx.TimeoutException:
        # On timeout — requery, do not retry with new reference
        return {
            "success": False,
            "should_requery": True,
            "squad_reference": reference,
            "error": "Transfer request timed out — requery will confirm status."
        }
    except Exception as e:
        print(f"Squad transfer error: {type(e).__name__}: {e}")
        return {
            "success": False,
            "should_requery": False,
            "squad_reference": reference,
            "error": "Unexpected transfer error."
        }


async def requery_transfer(transaction_reference: str) -> dict:
    """
    Re-query transfer status. Use after timeout or 424 error.
    Squad API: POST /payout/requery
    NEVER retry a transfer with a new reference if you got a timeout —
    always requery first to avoid double payment.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{settings.squad_base_url}/payout/requery",
                json={"transaction_reference": transaction_reference},
                headers={
                    "Authorization": f"Bearer {settings.squad_secret_key}",
                    "Content-Type": "application/json"
                }
            )

        if response.status_code == 200:
            data = response.json()
            return {"success": True, "status": "success", "raw": data}
        elif response.status_code == 404:
            return {"success": False, "status": "not_found", "error": "Transfer not found — safe to retry."}
        elif response.status_code == 412:
            return {"success": False, "status": "reversed", "error": "Transfer was reversed."}
        else:
            return {"success": False, "status": "unknown", "error": f"Requery status {response.status_code}"}

    except Exception as e:
        return {"success": False, "status": "error", "error": str(e)}