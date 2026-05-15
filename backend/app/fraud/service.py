from typing import Any
from uuid import UUID

from app.database import get_supabase


async def list_fraud_signals(
    admin: dict[str, Any],
    worker_id: UUID | None,
    signal_type: str | None,
    is_reviewed: bool | None,
    severity: str | None,
    page: int,
    page_size: int,
) -> dict[str, Any]:
    """Return company fraud signals with worker context."""

    query = get_supabase().table("fraud_signals").select("*, workers(first_name,last_name,email,roles(role_name))").eq("company_id", admin["company_id"])
    if worker_id:
        query = query.eq("worker_id", str(worker_id))
    if signal_type:
        query = query.eq("signal_type", signal_type)
    if is_reviewed is not None:
        query = query.eq("is_reviewed", is_reviewed)
    if severity:
        query = query.eq("severity", severity)
    rows = query.order("detected_at", desc=True).execute().data
    start = (page - 1) * page_size
    return {"signals": rows[start : start + page_size], "pagination": {"page": page, "page_size": page_size, "total": len(rows)}}

