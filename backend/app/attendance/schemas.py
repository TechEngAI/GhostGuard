from datetime import datetime

from pydantic import BaseModel, Field


class AttendanceCheckInRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    device_id: str | None = None


class AttendanceCheckOutRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class AttendanceEditRequest(BaseModel):
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    reason: str = Field(..., min_length=3)

