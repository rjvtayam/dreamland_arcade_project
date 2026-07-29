from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import Optional
from datetime import date, timedelta

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
        data.payment_method,
        data.area
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

    if current_user.role != "owner":
        branch_id = current_user.branch_id

    sales = pos_service.get_sales(db, branch_id, sd, ed)
    result = []
    for s in sales:
        user = db.query(User).filter(User.id == s.sold_by).first()
        branch = db.query(Branch).filter(Branch.id == s.branch_id).first()
        items = db.query(SaleItem).filter(SaleItem.sale_id == s.id).all()
        sale_items = []
        for si in items:
            if si.item_type == "smash":
                pname = "Smash Token"
            elif si.item_type == "extra":
                pname = "Extra Token"
            else:
                prod = db.query(Product).filter(Product.id == si.product_id).first()
                pname = prod.name if prod else None
            sale_items.append({
                "product_name": pname,
                "quantity": si.quantity,
                "unit_price": float(si.unit_price),
                "subtotal": float(si.subtotal),
                "item_type": si.item_type,
                "token_count": si.token_count
            })
        result.append({
            "id": s.id,
            "branch_name": branch.name if branch else None,
            "seller_name": f"{user.first_name} {user.last_name}" if user else None,
            "total_amount": float(s.total_amount),
            "payment_method": s.payment_method,
            "area": s.area,
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
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    return pos_service.get_sales_summary(db, branch_id, period)


@router.get("/comparison")
def sales_comparison(
    period: str = "daily",
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    today = date.today()
    if period == "daily":
        current_start = today - timedelta(days=today.weekday())
        prev_start = current_start - timedelta(days=7)
        prev_end = current_start - timedelta(days=1)
    elif period == "monthly":
        current_start = today.replace(day=1)
        prev_month_end = current_start - timedelta(days=1)
        prev_start = prev_month_end.replace(day=1)
        prev_end = prev_month_end
    else:
        current_start = today - timedelta(days=today.weekday())
        prev_start = current_start - timedelta(days=7)
        prev_end = current_start - timedelta(days=1)

    current_end = today

    def fetch_daily_sales(start, end, branch_id):
        query = db.query(
            sql_func.date(Sale.created_at).label("day"),
            sql_func.coalesce(sql_func.sum(Sale.total_amount), 0).label("total_sales"),
            sql_func.count(Sale.id).label("total_transactions")
        ).filter(
            sql_func.date(Sale.created_at) >= start,
            sql_func.date(Sale.created_at) <= end
        )
        if branch_id:
            query = query.filter(Sale.branch_id == branch_id)
        rows = query.group_by(sql_func.date(Sale.created_at)).order_by(sql_func.date(Sale.created_at)).all()
        return {str(r.day): {"total_sales": float(r.total_sales), "total_transactions": r.total_transactions} for r in rows}

    current_data = fetch_daily_sales(current_start, current_end, branch_id)
    prev_data = fetch_daily_sales(prev_start, prev_end, branch_id)

    current_total = sum(v["total_sales"] for v in current_data.values())
    prev_total = sum(v["total_sales"] for v in prev_data.values())
    change_pct = round(((current_total - prev_total) / prev_total * 100) if prev_total > 0 else 0, 1)

    if period == "daily":
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for i in range(7):
            d = (current_start + timedelta(days=i)).isoformat()
            if d > current_end.isoformat():
                break
        current_values = []
        prev_values = []
        current_labels = []
        for i in range(7):
            d = current_start + timedelta(days=i)
            if d > current_end:
                break
            current_values.append(current_data.get(d.isoformat(), {}).get("total_sales", 0))
            prev_d = prev_start + timedelta(days=i)
            prev_values.append(prev_data.get(prev_d.isoformat(), {}).get("total_sales", 0))
            current_labels.append(d.strftime("%a"))
    elif period == "monthly":
        import calendar
        days_in_month = calendar.monthrange(current_start.year, current_start.month)[1]
        current_values = []
        prev_values = []
        current_labels = []
        for day in range(1, days_in_month + 1):
            d = current_start.replace(day=day)
            if d > current_end:
                break
            current_values.append(current_data.get(d.isoformat(), {}).get("total_sales", 0))
            prev_d = prev_start.replace(day=day)
            if prev_d.month == prev_start.month and prev_d <= prev_end:
                prev_values.append(prev_data.get(prev_d.isoformat(), {}).get("total_sales", 0))
            else:
                prev_values.append(0)
            current_labels.append(str(day))
    else:
        current_values = list(current_data.values())[:7] if current_data else []
        prev_values = list(prev_data.values())[:7] if prev_data else []
        current_labels = list(current_data.keys())[:7] if current_data else []

    return {
        "labels": current_labels,
        "current": current_values,
        "previous": prev_values,
        "current_total": current_total,
        "previous_total": prev_total,
        "change_pct": change_pct,
        "period": period
    }


@router.get("/my")
def my_sales(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sd = date.fromisoformat(start_date) if start_date else None
    ed = date.fromisoformat(end_date) if end_date else None

    query = db.query(Sale).filter(Sale.branch_id == current_user.branch_id)
    if sd:
        query = query.filter(sql_func.date(Sale.created_at) >= sd)
    if ed:
        query = query.filter(sql_func.date(Sale.created_at) <= ed)
    sales = query.order_by(Sale.created_at.desc()).all()

    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    result = []
    for s in sales:
        seller = db.query(User).filter(User.id == s.sold_by).first()
        items = db.query(SaleItem).filter(SaleItem.sale_id == s.id).all()
        sale_items = []
        for si in items:
            if si.item_type == "smash":
                pname = "Smash Token"
            elif si.item_type == "extra":
                pname = "Extra Token"
            else:
                prod = db.query(Product).filter(Product.id == si.product_id).first()
                pname = prod.name if prod else None
            sale_items.append({
                "product_name": pname,
                "quantity": si.quantity,
                "unit_price": float(si.unit_price),
                "subtotal": float(si.subtotal),
                "item_type": si.item_type,
                "token_count": si.token_count
            })
        result.append({
            "id": s.id,
            "branch_name": branch.name if branch else None,
            "seller_name": f"{seller.first_name} {seller.last_name}" if seller else None,
            "total_amount": float(s.total_amount),
            "payment_method": s.payment_method,
            "area": s.area,
            "items": sale_items,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return result


@router.get("/tracking")
def area_tracking(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    today = date.today()
    areas = ["Arcade", "Playhouse", "Cafe"]
    result = []
    for area in areas:
        query = db.query(
            sql_func.coalesce(sql_func.sum(Sale.total_amount), 0).label("total_sales"),
            sql_func.count(Sale.id).label("total_transactions")
        ).filter(
            sql_func.date(Sale.created_at) == today,
            Sale.area == area
        )
        if branch_id:
            query = query.filter(Sale.branch_id == branch_id)
        row = query.first()
        total_sales = float(row.total_sales)
        total_transactions = row.total_transactions
        result.append({
            "area": area,
            "total_sales": total_sales,
            "total_transactions": total_transactions,
            "period": "daily",
            "date": today.isoformat()
        })
    return result
