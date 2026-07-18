from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from database import get_db
from schemas.sale import SaleCreate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.sale import Sale, SaleItem
from models.product import Product
from services import pos_service

router = APIRouter(prefix="/api/sales", tags=["sales"])


@router.post("")
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = pos_service.create_sale(
        db, data.branch_id, current_user.id,
        [item.model_dump() for item in data.items],
        data.payment_method
    )
    return {"id": sale.id, "detail": "Sale completed", "total": float(sale.total_amount)}


@router.get("")
def list_sales(
    branch_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    sd = date.fromisoformat(start_date) if start_date else None
    ed = date.fromisoformat(end_date) if end_date else None
    sales = pos_service.get_sales(db, branch_id, sd, ed)
    result = []
    for s in sales:
        user = db.query(User).filter(User.id == s.sold_by).first()
        branch = db.query(Branch).filter(Branch.id == s.branch_id).first()
        items = db.query(SaleItem).filter(SaleItem.sale_id == s.id).all()
        sale_items = []
        for si in items:
            prod = db.query(Product).filter(Product.id == si.product_id).first()
            sale_items.append({
                "product_name": prod.name if prod else None,
                "quantity": si.quantity,
                "unit_price": float(si.unit_price),
                "subtotal": float(si.subtotal)
            })
        result.append({
            "id": s.id,
            "branch_name": branch.name if branch else None,
            "seller_name": f"{user.first_name} {user.last_name}" if user else None,
            "total_amount": float(s.total_amount),
            "payment_method": s.payment_method,
            "items": sale_items,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return result


@router.get("/summary")
def sales_summary(
    branch_id: Optional[int] = None,
    period: str = "daily",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    return pos_service.get_sales_summary(db, branch_id, period)
