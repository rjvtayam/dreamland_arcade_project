from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class SpecialEventBase(BaseModel):
    name: str
    description: Optional[str] = None
    date: date
    icon: Optional[str] = "🎉"
    branch_id: Optional[int] = None


class SpecialEventCreate(SpecialEventBase):
    pass


class SpecialEventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    icon: Optional[str] = None
    branch_id: Optional[int] = None


class SpecialEventResponse(SpecialEventBase):
    id: int
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
