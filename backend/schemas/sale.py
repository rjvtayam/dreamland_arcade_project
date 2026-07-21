from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductBase(BaseModel):
    branch_id: int
    name: str
    category: Optional[str] = None
    price: float
    stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int


class SaleCreate(BaseModel):
    branch_id: int
    items: List[SaleItemCreate]
    payment_method: str = "cash"
    area: str = "Arcade"


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    branch_id: int
    sold_by: int
    total_amount: float
    payment_method: str
    area: Optional[str] = None
    created_at: datetime
    seller_name: Optional[str] = None
    branch_name: Optional[str] = None
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True


class SalesSummary(BaseModel):
    total_sales: float
    total_transactions: int
    average_sale: float
    period: str
