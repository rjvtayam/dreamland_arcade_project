from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from schemas.inventory import (
    InventoryCategoryCreate, InventoryItemCreate, InventoryItemUpdate, StockMovement
)
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.inventory import InventoryItem, InventoryLog, InventoryCategory
from services import inventory_service

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/categories")
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return inventory_service.get_categories(db)


@router.post("/categories")
def create_category(
    data: InventoryCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    cat = inventory_service.create_category(db, data.name, data.description)
    return {"id": cat.id, "detail": "Category created"}


@router.get("")
def list_items(
    branch_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    items = inventory_service.get_items(db, branch_id, category_id)
    result = []
    for item in items:
        cat = db.query(InventoryCategory).filter(InventoryCategory.id == item.category_id).first()
        branch = db.query(Branch).filter(Branch.id == item.branch_id).first()
        result.append({
            "id": item.id,
            "category_id": item.category_id,
            "category_name": cat.name if cat else None,
            "branch_id": item.branch_id,
            "branch_name": branch.name if branch else None,
            "name": item.name,
            "description": item.description,
            "quantity": item.quantity,
            "unit": item.unit,
            "reorder_level": item.reorder_level,
            "cost_price": float(item.cost_price) if item.cost_price else None,
            "is_active": item.is_active,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None
        })
    return result


@router.post("")
def create_item(
    data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner" and data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only create items for their own branch")

    item = inventory_service.create_item(
        db, data.category_id, data.branch_id, data.name, data.description,
        data.quantity, data.unit, data.reorder_level, data.cost_price
    )
    return {"id": item.id, "detail": "Item created"}


@router.put("/{item_id}")
def update_item(
    item_id: int,
    data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if current_user.role != "owner" and item.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only update items for their own branch")

    item = inventory_service.update_item(db, item_id, **data.model_dump(exclude_unset=True))
    return {"detail": "Item updated"}


@router.post("/{item_id}/stock-in")
def stock_in(
    item_id: int,
    data: StockMovement,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if current_user.role != "owner" and item.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only manage stock for their own branch")

    log = inventory_service.stock_in(db, item_id, data.quantity, current_user.id, data.notes)
    return {"detail": "Stock added", "log_id": log.id}


@router.post("/{item_id}/stock-out")
def stock_out(
    item_id: int,
    data: StockMovement,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if current_user.role != "owner" and item.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only manage stock for their own branch")

    log = inventory_service.stock_out(db, item_id, data.quantity, current_user.id, data.notes)
    return {"detail": "Stock removed", "log_id": log.id}


@router.get("/low-stock")
def low_stock(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    items = inventory_service.get_low_stock(db, branch_id)
    result = []
    for item in items:
        cat = db.query(InventoryCategory).filter(InventoryCategory.id == item.category_id).first()
        branch = db.query(Branch).filter(Branch.id == item.branch_id).first()
        result.append({
            "id": item.id,
            "name": item.name,
            "category_name": cat.name if cat else None,
            "branch_name": branch.name if branch else None,
            "quantity": item.quantity,
            "reorder_level": item.reorder_level,
            "unit": item.unit
        })
    return result


@router.get("/logs")
def list_logs(
    item_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    logs = inventory_service.get_logs(db, item_id, branch_id, limit)
    result = []
    for log in logs:
        item = db.query(InventoryItem).filter(InventoryItem.id == log.item_id).first()
        performer = db.query(User).filter(User.id == log.performed_by).first()
        branch = db.query(Branch).filter(Branch.id == log.branch_id).first()
        result.append({
            "id": log.id,
            "item_id": log.item_id,
            "item_name": item.name if item else None,
            "branch_name": branch.name if branch else None,
            "type": log.type,
            "quantity": log.quantity,
            "performer_name": f"{performer.first_name} {performer.last_name}" if performer else None,
            "notes": log.notes,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return result
