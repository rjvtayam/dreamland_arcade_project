from datetime import datetime, date, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func

from models.user import User
from models.branch import Branch
from models.attendance import Attendance
from models.inventory import InventoryItem, InventoryLog
from models.sale import Sale, SaleItem
from models.product import Product


def get_dashboard_stats(db: Session, branch_id: Optional[int] = None):
    today = date.today()
    now = datetime.now(timezone.utc)

    user_query = db.query(User).filter(User.is_active == True)
    if branch_id:
        user_query = user_query.filter(User.branch_id == branch_id)
    total_employees = user_query.count()

    att_query = db.query(Attendance).filter(sql_func.date(Attendance.clock_in) == today)
    if branch_id:
        att_query = att_query.filter(Attendance.branch_id == branch_id)
    today_attendance = att_query.count()
    clocked_out = att_query.filter(Attendance.clock_out != None).count()

    inventory_query = db.query(InventoryItem).filter(
        InventoryItem.is_active == True,
        InventoryItem.quantity <= InventoryItem.reorder_level
    )
    if branch_id:
        inventory_query = inventory_query.filter(InventoryItem.branch_id == branch_id)
    low_stock_count = inventory_query.count()

    sales_query = db.query(
        sql_func.coalesce(sql_func.sum(Sale.total_amount), 0),
        sql_func.count(Sale.id)
    ).filter(sql_func.date(Sale.created_at) == today)
    if branch_id:
        sales_query = sales_query.filter(Sale.branch_id == branch_id)
    sales_result = sales_query.first()

    attendance_rate = (today_attendance / total_employees * 100) if total_employees > 0 else 0

    return {
        "total_employees": total_employees,
        "today_attendance": today_attendance,
        "clocked_out": clocked_out,
        "attendance_rate": round(attendance_rate, 1),
        "low_stock_count": low_stock_count,
        "today_sales": float(sales_result[0]),
        "today_transactions": sales_result[1],
        "branches": db.query(Branch).filter(Branch.is_active == True).count()
    }


def get_attendance_report(db: Session, branch_id: Optional[int] = None,
                          start_date: Optional[date] = None, end_date: Optional[date] = None):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    user_query = db.query(User).filter(User.is_active == True, User.role == "employee")
    if branch_id:
        user_query = user_query.filter(User.branch_id == branch_id)
    users = user_query.all()

    report = []
    for user in users:
        att_records = db.query(Attendance).filter(
            Attendance.user_id == user.id,
            sql_func.date(Attendance.clock_in) >= start_date,
            sql_func.date(Attendance.clock_in) <= end_date
        ).all()

        total_days = len(att_records)
        present_days = sum(1 for a in att_records if a.status in ("present", "late", "overtime"))
        late_days = sum(1 for a in att_records if a.status == "late")

        total_hours = 0
        overtime_hours = 0
        for a in att_records:
            if a.clock_out:
                hours = (a.clock_out - a.clock_in).total_seconds() / 3600
                total_hours += hours
                if hours > 9:
                    overtime_hours += hours - 9

        report.append({
            "user_id": user.id,
            "user_name": f"{user.first_name} {user.last_name}",
            "total_days": total_days,
            "present_days": present_days,
            "late_days": late_days,
            "total_hours": round(total_hours, 1),
            "overtime_hours": round(overtime_hours, 1)
        })

    return report


def get_inventory_report(db: Session, branch_id: Optional[int] = None):
    query = db.query(InventoryItem).filter(InventoryItem.is_active == True)
    if branch_id:
        query = query.filter(InventoryItem.branch_id == branch_id)
    items = query.all()

    total_items = len(items)
    total_value = sum(float(item.cost_price or 0) * item.quantity for item in items)
    low_stock = sum(1 for item in items if item.quantity <= item.reorder_level)

    by_category = {}
    for item in items:
        cat_name = "Uncategorized"
        if item.category:
            cat_name = item.category.name
        if cat_name not in by_category:
            by_category[cat_name] = {"count": 0, "value": 0}
        by_category[cat_name]["count"] += 1
        by_category[cat_name]["value"] += float(item.cost_price or 0) * item.quantity

    return {
        "total_items": total_items,
        "total_value": round(total_value, 2),
        "low_stock_count": low_stock,
        "by_category": by_category
    }


def get_sales_report(db: Session, branch_id: Optional[int] = None,
                     start_date: Optional[date] = None, end_date: Optional[date] = None):
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    query = db.query(
        sql_func.coalesce(sql_func.sum(Sale.total_amount), 0),
        sql_func.count(Sale.id)
    ).filter(
        sql_func.date(Sale.created_at) >= start_date,
        sql_func.date(Sale.created_at) <= end_date
    )
    if branch_id:
        query = query.filter(Sale.branch_id == branch_id)
    result = query.first()

    item_query = db.query(
        Product.name,
        sql_func.sum(SaleItem.quantity).label("qty"),
        sql_func.sum(SaleItem.subtotal).label("rev")
    ).join(SaleItem, SaleItem.product_id == Product.id).join(Sale, Sale.id == SaleItem.sale_id).filter(
        sql_func.date(Sale.created_at) >= start_date,
        sql_func.date(Sale.created_at) <= end_date
    ).group_by(Product.name).order_by(sql_func.sum(SaleItem.subtotal).desc())
    if branch_id:
        item_query = item_query.filter(Sale.branch_id == branch_id)

    top_products = [{"name": r[0], "quantity": int(r[1]), "revenue": float(r[2])} for r in item_query.all()]

    return {
        "total_revenue": float(result[0]),
        "total_transactions": result[1],
        "average_sale": round(float(result[0]) / result[1], 2) if result[1] > 0 else 0,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "top_products": top_products
    }
