from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BranchBase(BaseModel):
    name: str
    location: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class BranchResponse(BranchBase):
    id: int
    is_active: bool
    created_at: datetime
    employee_count: Optional[int] = 0

    class Config:
        from_attributes = True
