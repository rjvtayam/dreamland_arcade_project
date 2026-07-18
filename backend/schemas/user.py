from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    role: str = "employee"
    branch_id: Optional[int] = None


class UserCreate(UserBase):
    pin: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    branch_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserPINUpdate(BaseModel):
    current_pin: str
    new_pin: str


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str]
    role: str
    branch_id: Optional[int]
    is_active: bool
    created_at: datetime
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True
