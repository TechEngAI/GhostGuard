import httpx
import time
from app.config import get_settings


def _make_deposit_reference(company_id: str) -> str:
    """
    Generate unique deposit transaction reference.
    Squad REQUIRES merchant ID to be prepended.
    Format: {MERCHANT_ID}_{company_short}_{timestamp}
    """
    merchant = get_settings().squad_merchant_id.upper()
    comp = company_id.replace("-", "")[:8].upper()
    ts = str(int(time.time()))
    return f"{merchant}_{comp}_{ts}"


async def initiate_deposit(
    amount_ngn: float,
    company_id: str,
    company_name: str,
    admin_email: str,
) -> dict:
    """
    Initiate a Squad payment checkout for admin to deposit funds.

    Squad API: POST /transaction/initiate
    Returns a checkout URL to redirect the admin to.
    Amount is in KOBO (NGN * 100).

    Request body:
      email: customer email
      amount: amount in kobo
      initiate_type: "inline" (Squad only accepts inline for web)
      currency: "NGN"
      transaction_ref: unique reference with merchant ID prepended
      callback_url: where Squad redirects after payment
      pass_charge: false (GhostGuard absorbs Squad fees)
    """
    amount_kobo = int(amount_ngn * 100)
    reference = _make_deposit_reference(company_id)

    payload = {
        "email": admin_email,
        "amount": amount_kobo,
        "initiate_type": "inline",
        "currency": "NGN",
        "transaction_ref": reference,
        "callback_url": get_settings().squad_callback_url,
        "pass_charge": False,
        "payment_channels": ["card", "bank", "ussd", "transfer"],
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{get_settings().squad_base_url}/transaction/initiate",
                json=payload,
                headers={
                    "Authorization": f"Bearer {get_settings().squad_secret_key}",
                    "Content-Type": "application/json"
                }
            )

        print(f"Squad initiate response: {response.status_code} — {response.text[:300]}")

        if response.status_code == 200:
            data = response.json()
            checkout_url = data.get("data", {}).get("checkout_url") or data.get("data", {}).get("url")
            if not checkout_url:
                return {"success": False, "error": "Squad did not return a checkout URL."}
            return {
                "success": True,
                "checkout_url": checkout_url,
                "transaction_reference": reference,
                "amount_kobo": amount_kobo
            }
        else:
            error_msg = response.json().get("message", f"Squad error {response.status_code}")
            return {"success": False, "error": error_msg}

    except httpx.TimeoutException:
        return {"success": False, "error": "Payment service timed out. Try again."}
    except Exception as e:
        print(f"Squad initiate error: {type(e).__name__}: {e}")
        return {"success": False, "error": "Payment service error. Try again."}


async def verify_payment(transaction_reference: str) -> dict:
    """
    Verify a payment after Squad webhook or callback.
    Squad API: GET /transaction/verify/{transaction_ref}

    Returns verified payment status and amount.
    Use this to confirm the payment before crediting company wallet.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{get_settings().squad_base_url}/transaction/verify/{transaction_reference}",
                headers={"Authorization": f"Bearer {get_settings().squad_secret_key}"}
            )

        print(f"Squad verify response: {response.status_code} — {response.text[:300]}")

        if response.status_code == 200:
            data = response.json().get("data", {})
            return {
                "success": True,
                "transaction_status": data.get("transaction_status"),  # success|failed
                "amount_kobo": data.get("transaction_amount"),
                "reference": transaction_reference,
                "raw": data
            }
        else:
            return {"success": False, "error": "Could not verify payment status."}

    except Exception as e:
        print(f"Squad verify error: {e}")
        return {"success": False, "error": "Verification service error."}