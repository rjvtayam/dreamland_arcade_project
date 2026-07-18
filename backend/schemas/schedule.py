from pydantic import BaseModel
from typing import Optional
from datetime import date, time
from datetime import datetime


class ScheduleBase(BaseModel):
    user_id: int
    branch_id: int
    day_of_week: int
    start_time: str
    end_time: str


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    user_id: Optional[int] = None
    branch_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: Optional[bool] = None


class ScheduleResponse(ScheduleBase):
    id: int
    is_active: bool
    created_at: datetime
    user_name: Optional[str] = None
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True
