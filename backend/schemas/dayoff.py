from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class DayoffRequestBase(BaseModel):
    date: date
    reason: Optional[str] = None


class DayoffRequestCreate(DayoffRequestBase):
    branch_id: int


class DayoffReview(BaseModel):
    status: str
    notes: Optional[str] = None


class DayoffResponse(BaseModel):
    id: int
    user_id: int
    branch_id: int
    date: date
    reason: Optional[str]
    status: str
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    created_at: datetime
    user_name: Optional[str] = None
    branch_name: Optional[str] = None
    reviewer_name: Optional[str] = None

    class Config:
        from_attributes = True
