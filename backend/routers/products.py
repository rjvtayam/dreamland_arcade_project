from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from schemas.sale import ProductCreate, ProductUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from services import pos_service

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
def list_products(
    branch_id: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    products = pos_service.get_products(db, branch_id, category)
    result = []
    for p in products:
        branch = db.query(Branch).filter(Branch.id == p.branch_id).first()
        result.append({
            "id": p.id,
            "branch_id": p.branch_id,
            "branch_name": branch.name if branch else None,
            "name": p.name,
            "category": p.category,
            "price": float(p.price),
            "stock": p.stock,
            "is_active": p.is_active,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return result


@router.post("")
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    product = pos_service.create_product(
        db, data.branch_id, data.name, data.category, data.price, data.stock
    )
    return {"id": product.id, "detail": "Product created"}


@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    product = pos_service.update_product(db, product_id, **data.model_dump(exclude_unset=True))
    return {"detail": "Product updated"}


@router.delete("/{product_id}")
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    product = pos_service.update_product(db, product_id, is_active=False)
    return {"detail": "Product deactivated"}
