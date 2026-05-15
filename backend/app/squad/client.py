import httpx

from app.config import get_settings
from app.errors import AppError


async def lookup_account(account_number: str, bank_code: str, squad_secret_key: str | None = None) -> dict:
    """Look up a Nigerian bank account through Squad's sandbox API."""

    settings = get_settings()
    paths = [settings.squad_account_lookup_path]
    if settings.squad_account_lookup_path != "/payout/account/lookup":
        paths.append("/payout/account/lookup")

    headers = {
        "Authorization": f"Bearer {squad_secret_key or settings.squad_secret_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"account_number": account_number, "bank_code": bank_code}

    async with httpx.AsyncClient(timeout=15.0) as client:
        for path in paths:
            url = f"{settings.squad_base_url.rstrip('/')}/{path.lstrip('/')}"
            try:
                response = await client.post(url, json=payload, headers=headers)
            except httpx.TimeoutException as exc:
                raise AppError(422, "BANK_LOOKUP_TIMEOUT", "Bank lookup timed out. Try again.") from exc
            except httpx.RequestError as exc:
                raise AppError(422, "BANK_LOOKUP_UNAVAILABLE", "Could not reach bank verification service.") from exc

            if response.status_code == 404 and path != paths[-1]:
                continue

            if response.status_code >= 400:
                message = "Unable to verify bank account details."
                try:
                    body = response.json()
                    message = body.get("message") or body.get("error") or message
                except ValueError:
                    message = response.text or message
                raise AppError(422, "BANK_LOOKUP_FAILED", message)

            response_payload = response.json()
            if response_payload.get("success") is False:
                raise AppError(422, "BANK_LOOKUP_FAILED", response_payload.get("message") or "Unable to verify this account. Check the details and try again.")

            data = response_payload.get("data") or {}
            account_name = data.get("account_name")
            if not account_name:
                raise AppError(422, "BANK_LOOKUP_FAILED", "Unable to verify this account. Check the details and try again.")

            return {
                "account_name": account_name,
                "account_number": data.get("account_number"),
                "bank_name": data.get("bank_name"),
            }

    raise AppError(422, "BANK_LOOKUP_FAILED", "Unable to verify this account. Check the details and try again.")


async def requery_transfer(transaction_reference: str, squad_secret_key: str | None = None) -> dict:
    """Re-query the status of a Squad transfer."""

    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {squad_secret_key or settings.squad_secret_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"transaction_reference": transaction_reference}
    url = f"{settings.squad_base_url.rstrip('/')}/payout/requery"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            raise AppError(422, "TRANSFER_REQUERY_TIMEOUT", "Transfer status check timed out. Try again.") from exc
        except httpx.RequestError as exc:
            raise AppError(422, "TRANSFER_REQUERY_UNAVAILABLE", "Could not reach transfer status service.") from exc

        if response.status_code >= 400:
            message = "Unable to check transfer status."
            try:
                body = response.json()
                message = body.get("message") or body.get("error") or message
            except ValueError:
                message = response.text or message
            raise AppError(422, "TRANSFER_REQUERY_FAILED", message)

        response_payload = response.json()
        if response_payload.get("success") is False:
            raise AppError(422, "TRANSFER_REQUERY_FAILED", response_payload.get("message") or "Unable to check transfer status.")

        data = response_payload.get("data") or {}
        return {
            "transaction_reference": data.get("transaction_reference"),
            "transaction_status": data.get("transaction_status"),  # e.g., "success", "pending", "failed"
            "amount": data.get("amount"),
            "account_number": data.get("account_number"),
            "account_name": data.get("account_name"),
            "bank_code": data.get("bank_code"),
            "currency_id": data.get("currency_id"),
            "remark": data.get("remark"),
            "response_description": data.get("response_description"),
            "nip_transaction_reference": data.get("nip_transaction_reference"),
            "destination_institution_name": data.get("destination_institution_name"),
        }
