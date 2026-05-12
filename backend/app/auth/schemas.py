from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


VerificationChannel = Literal["email", "phone"]
UserType = Literal["admin", "worker"]


class AdminRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    middle_name: str | None = None
    email: EmailStr
    phone_number: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    company_name: str = Field(..., min_length=2, max_length=255)
    company_size: str | None = None
    industry: str | None = None
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    verif_channel: VerificationChannel = "email"

    @model_validator(mode="after")
    def validate_passwords(self) -> "AdminRegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class WorkerRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    middle_name: str | None = None
    email: EmailStr
    phone_number: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    home_address: str | None = None
    state_of_origin: str | None = None
    next_of_kin_name: str | None = None
    next_of_kin_phone: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    nin: str | None = None
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    verif_channel: VerificationChannel = "email"
    invite_code: str

    @model_validator(mode="after")
    def validate_passwords(self) -> "WorkerRegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    access_token: str
    new_password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
