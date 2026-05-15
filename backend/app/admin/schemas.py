from datetime import time
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


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


class CreateRoleSchema(BaseModel):
    role_name: str = Field(..., min_length=2, max_length=150)
    department: Optional[str] = Field(None, max_length=100)
    grade_level: Optional[str] = Field(None, max_length=50)
    headcount_max: int = Field(..., ge=1, le=10000)
    gross_salary: Decimal = Field(..., ge=0)
    pension_deduct: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    health_deduct: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    other_deductions: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    work_type: Optional[str] = Field(default="ONSITE")

    @field_validator("role_name", "department", "grade_level", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("work_type", mode="before")
    @classmethod
    def validate_work_type(cls, v):
        allowed = {"ONSITE", "REMOTE", "HYBRID"}
        if v and str(v).upper() not in allowed:
            raise ValueError(f"work_type must be one of: {allowed}")
        return str(v).upper() if v else "ONSITE"

    @field_validator("gross_salary", "pension_deduct", "health_deduct", "other_deductions", mode="before")
    @classmethod
    def coerce_decimal(cls, v):
        # Accept string numbers from frontend JSON
        if v is None:
            return Decimal("0.00")
        try:
            return Decimal(str(v))
        except Exception:
            raise ValueError(f"Must be a valid number, got: {v}")


class UpdateRoleSchema(BaseModel):
    role_name: Optional[str] = Field(None, min_length=2, max_length=150)
    department: Optional[str] = None
    grade_level: Optional[str] = None
    headcount_max: Optional[int] = Field(None, ge=1)
    gross_salary: Optional[Decimal] = Field(None, ge=0)
    pension_deduct: Optional[Decimal] = Field(None, ge=0)
    health_deduct: Optional[Decimal] = Field(None, ge=0)
    other_deductions: Optional[Decimal] = Field(None, ge=0)
    work_type: Optional[str] = None

    @field_validator("gross_salary", "pension_deduct", "health_deduct", "other_deductions", mode="before")
    @classmethod
    def coerce_decimal(cls, v):
        if v is None:
            return None
        try:
            return Decimal(str(v))
        except Exception:
            raise ValueError(f"Must be a valid number, got: {v}")


class RoleResponse(BaseModel):
    id: str
    company_id: str
    role_name: str
    department: Optional[str]
    grade_level: Optional[str]
    headcount_max: int
    headcount_filled: int
    gross_salary: float
    pension_deduct: float
    health_deduct: float
    other_deductions: float
    work_type: str
    invite_code: str
    code_active: bool
    created_at: str
    updated_at: str


RoleCreate = CreateRoleSchema
RoleUpdate = UpdateRoleSchema


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
