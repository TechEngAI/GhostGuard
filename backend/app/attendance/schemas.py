from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AttendanceCheckInRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = Field(
        default=None,
        description="GPS accuracy in metres from browser Geolocation API"
    )
    device_id: Optional[str] = None

    class Config:
        extra = "ignore"  # ignore any extra fields from frontend


class AttendanceCheckOutRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = None

    class Config:
        extra = "ignore"


class AttendanceEditRequest(BaseModel):
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    reason: str = Field(..., min_length=3)

