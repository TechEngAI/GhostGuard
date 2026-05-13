from datetime import date
from pydantic import BaseModel, Field


class WorkerProfileUpdate(BaseModel):
    middle_name: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    home_address: str | None = None
    state_of_origin: str | None = None
    next_of_kin_name: str | None = None
    next_of_kin_phone: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    nin: str | None = None
    has_company_device: bool | None = None


class BankLookupRequest(BaseModel):
    account_number: str = Field(..., min_length=10, max_length=10, pattern=r"^\d{10}$")
    bank_code: str = Field(..., min_length=2, max_length=10, pattern=r"^\d+$")


class BankSubmitRequest(BaseModel):
    account_number: str = Field(..., min_length=10, max_length=10, pattern=r"^\d{10}$")
    bank_code: str = Field(..., min_length=2, max_length=10, pattern=r"^\d+$")
    bank_name: str
    confirmed_account_name: str


class BankChangeRequest(BaseModel):
    new_account_number: str = Field(..., min_length=10, max_length=10, pattern=r"^\d{10}$")
    new_bank_code: str = Field(..., min_length=2, max_length=10)
    reason: str
