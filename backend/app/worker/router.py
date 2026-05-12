from typing import Any

from fastapi import APIRouter, Depends

from app.dependencies import get_current_worker
from app.errors import success_response
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
    return success_response(await service.bank_lookup(payload), "Bank account retrieved.")


@router.post("/bank/submit")
async def bank_submit(payload: BankSubmitRequest, worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.submit_bank(worker, payload), "Bank account submitted.")


@router.get("/bank")
async def bank(worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.current_bank(worker), "Bank account retrieved.")


@router.post("/bank/change-request")
async def bank_change_request(payload: BankChangeRequest, worker: dict[str, Any] = Depends(get_current_worker)):
    return success_response(await service.request_bank_change(worker, payload), "Bank change request submitted.")

