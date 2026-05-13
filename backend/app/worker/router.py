from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError

from app.dependencies import get_current_worker
from app.errors import AppError, success_response
from app.worker import service
from app.worker.schemas import BankChangeRequest, BankLookupRequest, BankSubmitRequest, WorkerProfileUpdate

router = APIRouter(prefix="/worker", tags=["worker"])


@router.get("/profile")
async def profile(worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.get_profile(worker), "Profile retrieved.")


@router.put("/profile")
async def update_profile(payload: WorkerProfileUpdate, worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.update_profile(worker, payload), "Profile updated.")


@router.post("/bank/lookup")
async def bank_lookup(payload: BankLookupRequest, worker: dict[str, Any] = Depends(get_current_worker)):
    try:
        return success_response(await service.bank_lookup(payload), "Bank account retrieved.")
    except ValidationError as exc:
        raise AppError(422, "VALIDATION_ERROR", "Bank lookup request is malformed. Ensure account_number and bank_code are valid.") from exc
    except AppError:
        raise
    except Exception as exc:
        print(f"Unexpected error in bank_lookup: {exc}")
        raise AppError(500, "BANK_LOOKUP_ERROR", "Unable to verify bank account at this time.") from exc


@router.post("/bank/lookup/debug")
async def bank_lookup_debug(request: Request):
    """Temporary debug endpoint — remove after fixing."""
    body = await request.json()
    print(f"DEBUG bank lookup body: {body}")
    print(f"DEBUG content-type: {request.headers.get('content-type')}")
    return {"received": body, "content_type": request.headers.get("content-type")}


@router.get("/bank/auth-debug")
async def auth_debug(
    request: Request,
    current_worker: dict = Depends(get_current_worker),
):
    """Temporary — remove after debugging."""
    return {
        "worker_id": current_worker.get("id"),
        "status": current_worker.get("status"),
        "bank_verified": current_worker.get("bank_verified"),
        "auth_header_present": bool(request.headers.get("authorization")),
        "message": "JWT dependency working correctly",
    }


@router.post("/bank/submit")
async def bank_submit(payload: BankSubmitRequest, worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.submit_bank(worker, payload), "Bank account submitted.")


@router.get("/bank")
async def bank(worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.current_bank(worker), "Bank account retrieved.")


@router.post("/bank/change-request")
async def bank_change_request(payload: BankChangeRequest, worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.request_bank_change(worker, payload), "Bank change request submitted.")

