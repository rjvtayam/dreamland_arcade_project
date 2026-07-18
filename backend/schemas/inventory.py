from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class InventoryCategoryCreate(InventoryCategoryBase):
    pass


class InventoryCategoryResponse(InventoryCategoryBase):
    id: int

    class Config:
        from_attributes = True


class InventoryItemBase(BaseModel):
    category_id: int
    branch_id: int
    name: str
    description: Optional[str] = None
    quantity: int = 0
    unit: Optional[str] = None
    reorder_level: int = 10
    cost_price: Optional[float] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    reorder_level: Optional[int] = None
    cost_price: Optional[float] = None
    is_active: Optional[bool] = None


class StockMovement(BaseModel):
    quantity: int
    notes: Optional[str] = None


class InventoryItemResponse(InventoryItemBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True


class InventoryLogResponse(BaseModel):
    id: int
    item_id: int
    branch_id: int
    type: str
    quantity: int
    performed_by: int
    notes: Optional[str]
    created_at: datetime
    item_name: Optional[str] = None
    performer_name: Optional[str] = None
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True
