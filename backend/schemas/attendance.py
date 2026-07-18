from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClockInRequest(BaseModel):
    pin: str
    branch_id: int


class ClockOutRequest(BaseModel):
    pin: str


class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    branch_id: int
    clock_in: datetime
    clock_out: Optional[datetime]
    status: str
    notes: Optional[str]
    created_at: datetime
    user_name: Optional[str] = None
    branch_name: Optional[str] = None
    hours_worked: Optional[float] = None

    class Config:
        from_attributes = True


class AttendanceReport(BaseModel):
    user_id: int
    user_name: str
    total_days: int
    present_days: int
    late_days: int
    total_hours: float
    overtime_hours: float
