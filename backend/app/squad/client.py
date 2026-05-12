import httpx

from app.config import get_settings
from app.errors import AppError


async def lookup_account(account_number: str, bank_code: str, squad_secret_key: str | None = None) -> dict:
    """Look up a Nigerian bank account through Squad's sandbox API."""

    settings = get_settings()
    url = f"{settings.squad_base_url.rstrip('/')}/payout/account/lookup"
    headers = {
        "Authorization": f"Bearer {squad_secret_key or settings.squad_secret_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"account_number": account_number, "bank_code": bank_code}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.TimeoutException as exc:
        raise AppError(422, "BANK_LOOKUP_FAILED", "Unable to verify this account. Check the details and try again.") from exc
    except httpx.HTTPError as exc:
        raise AppError(422, "BANK_LOOKUP_FAILED", "Unable to verify this account. Check the details and try again.") from exc

    if response.status_code >= 400:
        message = "Unable to verify bank account details."
        try:
            body = response.json()
            message = body.get("message") or body.get("error") or message
        except ValueError:
            message = message
        raise AppError(422, "BANK_LOOKUP_FAILED", message)

    response_payload = response.json()
    data = response_payload.get("data") or {}
    if response_payload.get("success") is False:
        raise AppError(422, "BANK_LOOKUP_FAILED", response_payload.get("message") or "Unable to verify this account. Check the details and try again.")
    account_name = data.get("account_name")
    if not account_name:
        raise AppError(422, "BANK_LOOKUP_FAILED", "Unable to verify this account. Check the details and try again.")
    return {"account_name": account_name, "account_number": data.get("account_number"), "bank_name": data.get("bank_name")}
