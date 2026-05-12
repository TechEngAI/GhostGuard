from datetime import time
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class CompanyUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None
    size: str | None = None
    office_lat: float | None = None
    office_lng: float | None = None
    geofence_radius: int | None = Field(None, ge=1)
    work_start_time: time | None = None
    work_end_time: time | None = None
    working_days: str | None = None
    payroll_cycle: str | None = None
    timezone: str | None = None


class RoleCreate(BaseModel):
    role_name: str
    department: str | None = None
    grade_level: str | None = None
    headcount_max: int = Field(..., ge=1)
    gross_salary: Decimal = Field(..., ge=0)
    pension_deduct: Decimal = Field(0, ge=0)
    health_deduct: Decimal = Field(0, ge=0)
    other_deductions: Decimal = Field(0, ge=0)
    work_type: Literal["ONSITE", "REMOTE", "HYBRID"] = "ONSITE"


class RoleUpdate(BaseModel):
    role_name: str | None = None
    department: str | None = None
    grade_level: str | None = None
    headcount_max: int | None = Field(None, ge=1)
    gross_salary: Decimal | None = Field(None, ge=0)
    pension_deduct: Decimal | None = Field(None, ge=0)
    health_deduct: Decimal | None = Field(None, ge=0)
    other_deductions: Decimal | None = Field(None, ge=0)
    work_type: Literal["ONSITE", "REMOTE", "HYBRID"] | None = None
    code_active: bool | None = None


class BankReviewRequest(BaseModel):
    action: Literal["approve", "reject"]
    note: str | None = None


class WorkerSuspendRequest(BaseModel):
    reason: str


class WorkerReassignRequest(BaseModel):
    new_role_id: UUID


class WorkerFilters(BaseModel):
    role_id: UUID | None = None
    status: str | None = None
    bank_verified: bool | None = None
