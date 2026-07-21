from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from typing import Optional
from datetime import date

from database import get_db
from schemas.tracking_sheet import TrackingSheetCreate, TrackingSheetUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.product import Product
from models.tracking_sheet import TrackingSheet, TrackingSheetItem

router = APIRouter(prefix="/api/tracking-sheets", tags=["tracking-sheets"])


def build_response(ts, db):
    branch = db.query(Branch).filter(Branch.id == ts.branch_id).first()
    creator = db.query(User).filter(User.id == ts.created_by).first() if ts.created_by else None
    items = db.query(TrackingSheetItem).filter(TrackingSheetItem.tracking_sheet_id == ts.id).all()
    return {
        "id": ts.id,
        "branch_id": ts.branch_id,
        "branch_name": branch.name if branch else None,
        "area": ts.area,
        "sheet_date": ts.sheet_date.isoformat() if ts.sheet_date else None,
        "cashier_name": ts.cashier_name,
        "total_sales": float(ts.total_sales or 0),
        "total_cash_on_hand": float(ts.total_cash_on_hand or 0),
        "expenses": float(ts.expenses or 0),
        "others": float(ts.others or 0),
        "cashflow": float(ts.cashflow or 0),
        "remarks_short": ts.remarks_short,
        "remarks_over": ts.remarks_over,
        "status": ts.status,
        "created_by": ts.created_by,
        "creator_name": f"{creator.first_name} {creator.last_name}" if creator else None,
        "created_at": ts.created_at.isoformat() if ts.created_at else None,
        "updated_at": ts.updated_at.isoformat() if ts.updated_at else None,
        "items": [{
            "id": item.id,
            "tracking_sheet_id": item.tracking_sheet_id,
            "item_description": item.item_description,
            "opening": item.opening,
            "additional_pcs": item.additional_pcs,
            "total_count": item.total_count,
            "pcs_tracking": item.pcs_tracking,
            "srp": float(item.srp or 0),
            "total_sold": item.total_sold,
            "amount": float(item.amount or 0),
            "closing": item.closing
        } for item in items]
    }


@router.get("")
def list_sheets(
    branch_id: Optional[int] = None,
    area: Optional[str] = None,
    sheet_date: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    query = db.query(TrackingSheet)
    if branch_id:
        query = query.filter(TrackingSheet.branch_id == branch_id)
    if area:
        query = query.filter(TrackingSheet.area == area)
    if sheet_date:
        query = query.filter(TrackingSheet.sheet_date == sheet_date)
    if status:
        query = query.filter(TrackingSheet.status == status)

    sheets = query.order_by(TrackingSheet.sheet_date.desc(), TrackingSheet.area).all()
    return [build_response(s, db) for s in sheets]


@router.get("/history")
def history(
    branch_id: Optional[int] = None,
    area: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    query = db.query(TrackingSheet).filter(TrackingSheet.status == "submitted")
    if branch_id:
        query = query.filter(TrackingSheet.branch_id == branch_id)
    if area:
        query = query.filter(TrackingSheet.area == area)
    if start_date:
        query = query.filter(TrackingSheet.sheet_date >= start_date)
    if end_date:
        query = query.filter(TrackingSheet.sheet_date <= end_date)

    sheets = query.order_by(TrackingSheet.sheet_date.desc(), TrackingSheet.area).all()
    return [build_response(s, db) for s in sheets]


@router.get("/today")
def today_sheets(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    today = date.today()
    query = db.query(TrackingSheet).filter(TrackingSheet.sheet_date == today)
    if branch_id:
        query = query.filter(TrackingSheet.branch_id == branch_id)

    sheets = query.order_by(TrackingSheet.area).all()
    return [build_response(s, db) for s in sheets]


@router.get("/{sheet_id}")
def get_sheet(
    sheet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    ts = db.query(TrackingSheet).filter(TrackingSheet.id == sheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Tracking sheet not found")
    if current_user.role != "owner" and ts.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return build_response(ts, db)


@router.post("")
def create_sheet(
    data: TrackingSheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        if data.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Access denied to this branch")

    existing = db.query(TrackingSheet).filter(
        TrackingSheet.branch_id == data.branch_id,
        TrackingSheet.area == data.area,
        TrackingSheet.sheet_date == data.sheet_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tracking sheet already exists for this area and date")

    ts = TrackingSheet(
        branch_id=data.branch_id,
        area=data.area,
        sheet_date=data.sheet_date,
        cashier_name=data.cashier_name,
        total_sales=data.total_sales,
        total_cash_on_hand=data.total_cash_on_hand,
        expenses=data.expenses,
        others=data.others,
        cashflow=data.cashflow,
        remarks_short=data.remarks_short,
        remarks_over=data.remarks_over,
        status="draft",
        created_by=current_user.id
    )
    db.add(ts)
    db.flush()

    for item_data in data.items:
        item = TrackingSheetItem(
            tracking_sheet_id=ts.id,
            item_description=item_data.item_description,
            opening=item_data.opening,
            additional_pcs=item_data.additional_pcs,
            total_count=item_data.total_count,
            pcs_tracking=item_data.pcs_tracking,
            srp=item_data.srp,
            total_sold=item_data.total_sold,
            amount=item_data.amount,
            closing=item_data.closing
        )
        db.add(item)

    db.commit()
    db.refresh(ts)
    return build_response(ts, db)


@router.put("/{sheet_id}")
def update_sheet(
    sheet_id: int,
    data: TrackingSheetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    ts = db.query(TrackingSheet).filter(TrackingSheet.id == sheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Tracking sheet not found")
    if current_user.role != "owner" and ts.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if ts.status == "submitted":
        raise HTTPException(status_code=400, detail="Cannot edit a submitted sheet")

    if data.cashier_name is not None: ts.cashier_name = data.cashier_name
    if data.total_sales is not None: ts.total_sales = data.total_sales
    if data.total_cash_on_hand is not None: ts.total_cash_on_hand = data.total_cash_on_hand
    if data.expenses is not None: ts.expenses = data.expenses
    if data.others is not None: ts.others = data.others
    if data.cashflow is not None: ts.cashflow = data.cashflow
    if data.remarks_short is not None: ts.remarks_short = data.remarks_short
    if data.remarks_over is not None: ts.remarks_over = data.remarks_over

    if data.items is not None:
        db.query(TrackingSheetItem).filter(TrackingSheetItem.tracking_sheet_id == ts.id).delete()
        for item_data in data.items:
            item = TrackingSheetItem(
                tracking_sheet_id=ts.id,
                item_description=item_data.item_description,
                opening=item_data.opening,
                additional_pcs=item_data.additional_pcs,
                total_count=item_data.total_count,
                pcs_tracking=item_data.pcs_tracking,
                srp=item_data.srp,
                total_sold=item_data.total_sold,
                amount=item_data.amount,
                closing=item_data.closing
            )
            db.add(item)

    db.commit()
    db.refresh(ts)
    return build_response(ts, db)


@router.post("/{sheet_id}/submit")
def submit_sheet(
    sheet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    ts = db.query(TrackingSheet).filter(TrackingSheet.id == sheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Tracking sheet not found")
    if current_user.role != "owner" and ts.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if ts.status == "submitted":
        raise HTTPException(status_code=400, detail="Sheet already submitted")

    ts.status = "submitted"
    db.commit()
    db.refresh(ts)
    return build_response(ts, db)


@router.get("/products/items")
def get_products_for_sheet(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    products = db.query(Product).filter(
        Product.branch_id == branch_id,
        Product.is_active == True
    ).order_by(Product.category, Product.name).all()
    return [{
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "price": float(p.price),
        "stock": p.stock
    } for p in products]
