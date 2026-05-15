from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from io import BytesIO

from app.dependencies import get_current_admin
from app.errors import success_response
from app.ml import service
from app.ml.schemas import PayrollGenerateRequest

router = APIRouter(prefix="/admin/payroll", tags=["payroll"])


@router.post("/generate")
async def generate(payload: PayrollGenerateRequest, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.generate_payroll(admin, payload), "Payroll analysis complete")


@router.get("/runs")
async def runs(admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.list_runs(admin), "Payroll runs retrieved.")


@router.get("/{run_id}/results")
async def results(run_id: UUID, verdict: str | None = None, page: int = 1, page_size: int = 50, admin: dict[str, Any] = Depends(get_current_admin)):
    return success_response(await service.get_results(admin, run_id, verdict, max(page, 1), min(max(page_size, 1), 100)), "Payroll results retrieved.")


@router.get("/{run_id}/csv")
async def csv(run_id: UUID, admin: dict[str, Any] = Depends(get_current_admin)):
    csv_text, filename = await service.csv_for_run(admin, run_id)
    return StreamingResponse(
        BytesIO(csv_text.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

