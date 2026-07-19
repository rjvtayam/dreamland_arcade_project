from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class PayslipBase(BaseModel):
    user_id: int
    branch_id: int
    period_start: date
    period_end: date
    base_pay: float = 0
    overtime_pay: float = 0
    bonuses: float = 0
    deductions: float = 0
    total_pay: float = 0
    hours_worked: float = 0
    overtime_hours: float = 0
    notes: Optional[str] = None


class PayslipCreate(BaseModel):
    user_id: int
    branch_id: int
    period_start: date
    period_end: date
    base_pay: float = 0
    overtime_pay: float = 0
    bonuses: float = 0
    deductions: float = 0
    hours_worked: float = 0
    overtime_hours: float = 0
    notes: Optional[str] = None


class PayslipUpdate(BaseModel):
    base_pay: Optional[float] = None
    overtime_pay: Optional[float] = None
    bonuses: Optional[float] = None
    deductions: Optional[float] = None
    hours_worked: Optional[float] = None
    overtime_hours: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class PayslipResponse(BaseModel):
    id: int
    user_id: int
    branch_id: int
    period_start: date
    period_end: date
    base_pay: float
    overtime_pay: float
    bonuses: float
    deductions: float
    total_pay: float
    hours_worked: float
    overtime_hours: float
    notes: Optional[str]
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    branch_name: Optional[str] = None
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True
