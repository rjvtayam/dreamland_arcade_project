from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    branch_id: Optional[int] = None


class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class MemberResponse(BaseModel):
    id: int
    card_number: str
    card_tier: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    total_spent: float
    total_points: int
    bonus_tokens_earned: int
    total_visits: int
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    issued_date: Optional[date] = None
    expiry_date: Optional[date] = None
    is_active: bool
    created_at: Optional[datetime] = None
    next_tier: Optional[str] = None
    points_to_next_tier: Optional[int] = None

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    member_id: int
    amount: float
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    member_id: int
    branch_id: Optional[int] = None
    amount: float
    points_earned: int
    bonus_tokens: int
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
