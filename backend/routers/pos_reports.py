from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import Optional
from datetime import date

from database import get_db
from dependencies import get_current_user, require_role
from models.user import User
from models.sale import Sale, SaleItem
from models.product import Product
from models.pos_report import POSReport

router = APIRouter(prefix="/api/pos-reports", tags=["pos-reports"])


@router.post("")
def submit_daily_report(
    report_date: Optional[str] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    target_date = date.fromisoformat(report_date) if report_date else date.today()

    existing = db.query(POSReport).filter(
        POSReport.branch_id == current_user.branch_id,
        POSReport.report_date == target_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Report already submitted for this date")

    sales = db.query(Sale).filter(
        Sale.branch_id == current_user.branch_id,
        sql_func.date(Sale.created_at) == target_date
    ).all()

    total_sales = sum(float(s.total_amount) for s in sales)
    total_transactions = len(sales)

    arcade_sales = sum(float(s.total_amount) for s in sales if s.area == "Arcade")
    playhouse_sales = sum(float(s.total_amount) for s in sales if s.area == "Playhouse")
    cafe_sales = sum(float(s.total_amount) for s in sales if s.area == "Cafe")

    cash_sales = sum(float(s.total_amount) for s in sales if s.payment_method == "Cash")
    gcash_sales = sum(float(s.total_amount) for s in sales if s.payment_method == "GCash")
    card_sales = sum(float(s.total_amount) for s in sales if s.payment_method == "Card")

    product_totals = {}
    smash_sales = 0
    extra_token_count = 0
    for s in sales:
        items = db.query(SaleItem).filter(SaleItem.sale_id == s.id).all()
        for si in items:
            if si.item_type == "smash":
                smash_sales += float(si.subtotal)
                name = f"Smash ({si.token_count} tokens)"
                if name not in product_totals:
                    product_totals[name] = {"name": name, "quantity": 0, "revenue": 0, "type": "smash"}
                product_totals[name]["quantity"] += si.quantity
                product_totals[name]["revenue"] += float(si.subtotal)
            elif si.item_type == "extra":
                extra_token_count += si.token_count
                name = f"Extra Token ({si.token_count} tokens)"
                if name not in product_totals:
                    product_totals[name] = {"name": name, "quantity": 0, "revenue": 0, "type": "extra"}
                product_totals[name]["quantity"] += si.quantity
                product_totals[name]["revenue"] += float(si.subtotal)
            else:
                prod = db.query(Product).filter(Product.id == si.product_id).first()
                name = prod.name if prod else "Unknown"
                if name not in product_totals:
                    product_totals[name] = {"name": name, "quantity": 0, "revenue": 0, "type": "regular"}
                product_totals[name]["quantity"] += si.quantity
                product_totals[name]["revenue"] += float(si.subtotal)

    items_summary = sorted(product_totals.values(), key=lambda x: x["revenue"], reverse=True)

    report = POSReport(
        branch_id=current_user.branch_id,
        admin_id=current_user.id,
        report_date=target_date,
        total_sales=total_sales,
        total_transactions=total_transactions,
        arcade_sales=arcade_sales,
        playhouse_sales=playhouse_sales,
        cafe_sales=cafe_sales,
        cash_sales=cash_sales,
        gcash_sales=gcash_sales,
        card_sales=card_sales,
        smash_sales=smash_sales,
        extra_token_count=extra_token_count,
        items_summary=items_summary,
        notes=notes
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "detail": "Daily report submitted",
        "total_sales": float(report.total_sales),
        "total_transactions": report.total_transactions
    }


@router.get("")
def list_reports(
    branch_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(POSReport)
    if current_user.role != "owner":
        branch_id = current_user.branch_id
    if branch_id:
        query = query.filter(POSReport.branch_id == branch_id)
    if start_date:
        query = query.filter(POSReport.report_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(POSReport.report_date <= date.fromisoformat(end_date))

    reports = query.order_by(POSReport.report_date.desc()).all()
    result = []
    for r in reports:
        admin = db.query(User).filter(User.id == r.admin_id).first()
        result.append({
            "id": r.id,
            "branch_id": r.branch_id,
            "admin_name": f"{admin.first_name} {admin.last_name}" if admin else None,
            "report_date": r.report_date.isoformat() if r.report_date else None,
            "total_sales": float(r.total_sales),
            "total_transactions": r.total_transactions,
            "arcade_sales": float(r.arcade_sales),
            "playhouse_sales": float(r.playhouse_sales),
            "cafe_sales": float(r.cafe_sales),
            "cash_sales": float(r.cash_sales),
            "gcash_sales": float(r.gcash_sales),
            "card_sales": float(r.card_sales),
            "smash_sales": float(r.smash_sales) if r.smash_sales else 0,
            "extra_token_count": r.extra_token_count or 0,
            "items_summary": r.items_summary or [],
            "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return result


@router.get("/latest")
def latest_report(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(POSReport)
    if current_user.role != "owner":
        branch_id = current_user.branch_id
    if branch_id:
        query = query.filter(POSReport.branch_id == branch_id)

    report = query.order_by(POSReport.report_date.desc()).first()
    if not report:
        return None

    admin = db.query(User).filter(User.id == report.admin_id).first()
    return {
        "id": report.id,
        "branch_id": report.branch_id,
        "admin_name": f"{admin.first_name} {admin.last_name}" if admin else None,
        "report_date": report.report_date.isoformat() if report.report_date else None,
        "total_sales": float(report.total_sales),
        "total_transactions": report.total_transactions,
        "arcade_sales": float(report.arcade_sales),
        "playhouse_sales": float(report.playhouse_sales),
        "cafe_sales": float(report.cafe_sales),
        "cash_sales": float(report.cash_sales),
        "gcash_sales": float(report.gcash_sales),
        "card_sales": float(report.card_sales),
        "smash_sales": float(report.smash_sales) if report.smash_sales else 0,
        "extra_token_count": report.extra_token_count or 0,
        "items_summary": report.items_summary or [],
        "notes": report.notes,
        "created_at": report.created_at.isoformat() if report.created_at else None
    }
