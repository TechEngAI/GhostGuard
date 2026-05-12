from uuid import UUID

from pydantic import BaseModel


class FraudSignalFilters(BaseModel):
    worker_id: UUID | None = None
    signal_type: str | None = None
    is_reviewed: bool | None = None
    severity: str | None = None
    page: int = 1
    page_size: int = 50

