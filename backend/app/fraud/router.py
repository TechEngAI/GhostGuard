from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends

from app.dependencies import get_current_admin
from app.errors import success_response
from app.fraud import service

router = APIRouter(prefix="/admin", tags=["fraud"])


@router.get("/fraud-signals")
async def fraud_signals(
    worker_id: UUID | None = None,
    signal_type: str | None = None,
    is_reviewed: bool | None = None,
    severity: str | None = None,
    page: int = 1,
    page_size: int = 50,
    admin: dict[str, Any] = Depends(get_current_admin),
):
    return success_response(
        await service.list_fraud_signals(admin, worker_id, signal_type, is_reviewed, severity, max(page, 1), min(max(page_size, 1), 100)),
        "Fraud signals retrieved.",
    )

