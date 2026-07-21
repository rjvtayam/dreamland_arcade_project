from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class TrackingSheetItemCreate(BaseModel):
    item_description: str
    opening: int = 0
    additional_pcs: int = 0
    total_count: int = 0
    pcs_tracking: int = 0
    srp: float = 0
    total_sold: int = 0
    amount: float = 0
    closing: int = 0


class TrackingSheetItemResponse(TrackingSheetItemCreate):
    id: int
    tracking_sheet_id: int

    class Config:
        from_attributes = True


class TrackingSheetCreate(BaseModel):
    branch_id: int
    area: str
    sheet_date: date
    cashier_name: Optional[str] = None
    total_sales: float = 0
    total_cash_on_hand: float = 0
    expenses: float = 0
    others: float = 0
    cashflow: float = 0
    remarks_short: Optional[str] = None
    remarks_over: Optional[str] = None
    data: Optional[dict] = None
    items: List[TrackingSheetItemCreate] = []


class TrackingSheetUpdate(BaseModel):
    cashier_name: Optional[str] = None
    total_sales: Optional[float] = None
    total_cash_on_hand: Optional[float] = None
    expenses: Optional[float] = None
    others: Optional[float] = None
    cashflow: Optional[float] = None
    remarks_short: Optional[str] = None
    remarks_over: Optional[str] = None
    data: Optional[dict] = None
    items: Optional[List[TrackingSheetItemCreate]] = None


class TrackingSheetResponse(BaseModel):
    id: int
    branch_id: int
    area: str
    sheet_date: date
    cashier_name: Optional[str] = None
    total_sales: float
    total_cash_on_hand: float
    expenses: float
    others: float
    cashflow: float
    remarks_short: Optional[str] = None
    remarks_over: Optional[str] = None
    data: Optional[dict] = None
    status: str
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    branch_name: Optional[str] = None
    creator_name: Optional[str] = None
    items: List[TrackingSheetItemResponse] = []

    class Config:
        from_attributes = True
