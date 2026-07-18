from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from fastapi import HTTPException

from models.inventory import InventoryCategory, InventoryItem, InventoryLog


def create_category(db: Session, name: str, description: str = None) -> InventoryCategory:
    cat = InventoryCategory(name=name, description=description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def get_categories(db: Session) -> List[InventoryCategory]:
    return db.query(InventoryCategory).all()


def create_item(db: Session, category_id: int, branch_id: int, name: str, description: str = None,
                quantity: int = 0, unit: str = None, reorder_level: int = 10, cost_price: float = None) -> InventoryItem:
    item = InventoryItem(
        category_id=category_id,
        branch_id=branch_id,
        name=name,
        description=description,
        quantity=quantity,
        unit=unit,
        reorder_level=reorder_level,
        cost_price=cost_price
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_items(db: Session, branch_id: Optional[int] = None, category_id: Optional[int] = None, active_only: bool = True):
    query = db.query(InventoryItem)
    if active_only:
        query = query.filter(InventoryItem.is_active == True)
    if branch_id:
        query = query.filter(InventoryItem.branch_id == branch_id)
    if category_id:
        query = query.filter(InventoryItem.category_id == category_id)
    return query.order_by(InventoryItem.name).all()


def get_item(db: Session, item_id: int) -> InventoryItem:
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


def update_item(db: Session, item_id: int, **kwargs) -> InventoryItem:
    item = get_item(db, item_id)
    for key, value in kwargs.items():
        if value is not None:
            setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def stock_in(db: Session, item_id: int, quantity: int, user_id: int, notes: str = None) -> InventoryLog:
    item = get_item(db, item_id)
    item.quantity += quantity
    log = InventoryLog(
        item_id=item_id,
        branch_id=item.branch_id,
        type="stock_in",
        quantity=quantity,
        performed_by=user_id,
        notes=notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def stock_out(db: Session, item_id: int, quantity: int, user_id: int, notes: str = None) -> InventoryLog:
    item = get_item(db, item_id)
    if item.quantity < quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    item.quantity -= quantity
    log = InventoryLog(
        item_id=item_id,
        branch_id=item.branch_id,
        type="stock_out",
        quantity=quantity,
        performed_by=user_id,
        notes=notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def adjust_stock(db: Session, item_id: int, new_quantity: int, user_id: int, notes: str = None) -> InventoryLog:
    item = get_item(db, item_id)
    diff = new_quantity - item.quantity
    item.quantity = new_quantity
    log = InventoryLog(
        item_id=item_id,
        branch_id=item.branch_id,
        type="adjustment",
        quantity=diff,
        performed_by=user_id,
        notes=notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_low_stock(db: Session, branch_id: Optional[int] = None):
    query = db.query(InventoryItem).filter(
        InventoryItem.is_active == True,
        InventoryItem.quantity <= InventoryItem.reorder_level
    )
    if branch_id:
        query = query.filter(InventoryItem.branch_id == branch_id)
    return query.all()


def get_logs(db: Session, item_id: Optional[int] = None, branch_id: Optional[int] = None, limit: int = 100):
    query = db.query(InventoryLog)
    if item_id:
        query = query.filter(InventoryLog.item_id == item_id)
    if branch_id:
        query = query.filter(InventoryLog.branch_id == branch_id)
    return query.order_by(InventoryLog.created_at.desc()).limit(limit).all()
