from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class HolidayBase(BaseModel):
    name: str
    date: date
    branch_id: Optional[int] = None
    is_recurring: bool = False


class HolidayCreate(HolidayBase):
    pass


class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    branch_id: Optional[int] = None
    is_recurring: Optional[bool] = None


class HolidayResponse(HolidayBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
