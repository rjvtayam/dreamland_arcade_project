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

    area_sales = {}
    for area in ["Arcade", "Playhouse", "Cafe"]:
        area_q = db.query(sql_func.coalesce(sql_func.sum(Sale.total_amount), 0)).filter(
            sql_func.date(Sale.created_at) == today, Sale.area == area
        )
        if branch_id:
            area_q = area_q.filter(Sale.branch_id == branch_id)
        area_sales[area] = float(area_q.scalar() or 0)

    token_sales = {}
    token_rows = db.query(
        Product.name, sql_func.sum(SaleItem.quantity).label("qty")
    ).join(SaleItem, SaleItem.product_id == Product.id).join(Sale, Sale.id == SaleItem.sale_id).filter(
        sql_func.date(Sale.created_at) == today, Product.category == 'Tokens'
    ).group_by(Product.name)
    if branch_id:
        token_rows = token_rows.filter(Sale.branch_id == branch_id)
    for r in token_rows.all():
        name = r[0] or ''
        pack_qty = int(r[1] or 0)
        token_per_pack = 0
        for part in name.split():
            try:
                token_per_pack = int(part)
                break
            except ValueError:
                continue
        token_sales[name] = token_per_pack if token_per_pack > 0 else pack_qty

    smash_query = db.query(
        sql_func.coalesce(sql_func.sum(SaleItem.token_count), 0)
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        sql_func.date(Sale.created_at) == today, SaleItem.item_type == 'smash'
    )
    if branch_id:
        smash_query = smash_query.filter(Sale.branch_id == branch_id)
    smash_qty = int(smash_query.scalar() or 0)
    if smash_qty > 0:
        token_sales['Smash'] = smash_qty

    extra_query = db.query(
        sql_func.coalesce(sql_func.sum(SaleItem.token_count), 0)
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        sql_func.date(Sale.created_at) == today, SaleItem.item_type == 'extra'
    )
    if branch_id:
        extra_query = extra_query.filter(Sale.branch_id == branch_id)
    extra_qty = int(extra_query.scalar() or 0)
    if extra_qty > 0:
        token_sales['Extra'] = extra_qty

    return {
        "total_employees": total_employees,
        "today_attendance": today_attendance,
        "clocked_out": clocked_out,
        "attendance_rate": round(attendance_rate, 1),
        "low_stock_count": low_stock_count,
        "today_sales": float(sales_result[0]),
        "today_transactions": sales_result[1],
        "branches": db.query(Branch).filter(Branch.is_active == True).count(),
        "area_sales": area_sales,
        "token_sales": token_sales
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
    total_present = 0
    total_late = 0
    total_overtime = 0
    total_absent = 0
    all_hours = []

    for user in users:
        att_records = db.query(Attendance).filter(
            Attendance.user_id == user.id,
            sql_func.date(Attendance.clock_in) >= start_date,
            sql_func.date(Attendance.clock_in) <= end_date
        ).all()

        total_days = len(att_records)
        present_days = sum(1 for a in att_records if a.status in ("present", "late", "overtime"))
        late_days = sum(1 for a in att_records if a.status == "late")
        overtime_days = sum(1 for a in att_records if a.status == "overtime")
        absent_days = sum(1 for a in att_records if a.status in ("absent", "day-off"))

        total_hours = 0
        overtime_hours = 0
        for a in att_records:
            if a.clock_out:
                hours = (a.clock_out - a.clock_in).total_seconds() / 3600
                total_hours += hours
                all_hours.append(hours)
                if hours > 9:
                    overtime_hours += hours - 9

        total_present += present_days
        total_late += late_days
        total_overtime += overtime_days
        total_absent += absent_days

        branch = db.query(Branch).filter(Branch.id == user.branch_id).first()

        report.append({
            "user_id": user.id,
            "user_name": f"{user.first_name} {user.last_name}",
            "branch_name": branch.name if branch else None,
            "role": user.role,
            "total_days": total_days,
            "present_days": present_days,
            "late_days": late_days,
            "overtime_days": overtime_days,
            "absent_days": absent_days,
            "total_hours": round(total_hours, 1),
            "overtime_hours": round(overtime_hours, 1),
            "avg_hours": round(total_hours / total_days, 1) if total_days > 0 else 0
        })

    all_hours_avg = round(sum(all_hours) / len(all_hours), 1) if all_hours else 0

    return {
        "records": report,
        "summary": {
            "total_employees": len(users),
            "total_present": total_present,
            "total_late": total_late,
            "total_overtime": total_overtime,
            "total_absent": total_absent,
            "avg_hours": all_hours_avg,
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat()
        }
    }


def get_inventory_report(db: Session, branch_id: Optional[int] = None):
    query = db.query(InventoryItem).filter(InventoryItem.is_active == True)
    if branch_id:
        query = query.filter(InventoryItem.branch_id == branch_id)
    items = query.all()

    total_items = len(items)
    total_value = sum(float(item.cost_price or 0) * item.quantity for item in items)
    in_stock = sum(1 for item in items if item.quantity > (item.reorder_level or 0))
    low_stock = sum(1 for item in items if item.quantity <= (item.reorder_level or 0) and item.quantity > 0)
    out_of_stock = sum(1 for item in items if item.quantity <= 0)

    by_category = {}
    for item in items:
        cat_name = "Uncategorized"
        if item.category:
            cat_name = item.category.name
        if cat_name not in by_category:
            by_category[cat_name] = {"count": 0, "value": 0, "in_stock": 0, "low_stock": 0, "out_of_stock": 0}
        by_category[cat_name]["count"] += 1
        by_category[cat_name]["value"] += float(item.cost_price or 0) * item.quantity
        if item.quantity <= 0:
            by_category[cat_name]["out_of_stock"] += 1
        elif item.quantity <= (item.reorder_level or 0):
            by_category[cat_name]["low_stock"] += 1
        else:
            by_category[cat_name]["in_stock"] += 1

    by_branch = {}
    for item in items:
        branch_name = "Unknown"
        if item.branch:
            branch_name = item.branch.name
        if branch_name not in by_branch:
            by_branch[branch_name] = {"count": 0, "value": 0, "low_stock": 0}
        by_branch[branch_name]["count"] += 1
        by_branch[branch_name]["value"] += float(item.cost_price or 0) * item.quantity
        if item.quantity <= (item.reorder_level or 0):
            by_branch[branch_name]["low_stock"] += 1

    recent_logs_query = db.query(InventoryLog).order_by(InventoryLog.created_at.desc()).limit(20)
    if branch_id:
        recent_logs_query = recent_logs_query.join(InventoryItem, InventoryItem.id == InventoryLog.inventory_item_id).filter(InventoryItem.branch_id == branch_id)
    recent_logs = []
    for log in recent_logs_query.all():
        item = db.query(InventoryItem).filter(InventoryItem.id == log.inventory_item_id).first()
        performer = db.query(User).filter(User.id == log.performed_by).first() if log.performed_by else None
        recent_logs.append({
            "id": log.id,
            "item_name": item.name if item else None,
            "type": log.movement_type,
            "quantity": log.quantity,
            "notes": log.notes,
            "performer_name": f"{performer.first_name} {performer.last_name}" if performer else None,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })

    low_stock_items = []
    for item in items:
        if item.quantity <= (item.reorder_level or 0):
            branch = db.query(Branch).filter(Branch.id == item.branch_id).first()
            low_stock_items.append({
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "reorder_level": item.reorder_level,
                "branch_name": branch.name if branch else None,
                "category_name": item.category.name if item.category else None
            })

    return {
        "total_items": total_items,
        "total_value": round(total_value, 2),
        "in_stock_count": in_stock,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "by_category": by_category,
        "by_branch": by_branch,
        "recent_logs": recent_logs,
        "low_stock_items": low_stock_items
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

    area_sales = {}
    for area in ["Arcade", "Playhouse", "Cafe"]:
        area_q = db.query(
            sql_func.coalesce(sql_func.sum(Sale.total_amount), 0),
            sql_func.count(Sale.id)
        ).filter(
            sql_func.date(Sale.created_at) >= start_date,
            sql_func.date(Sale.created_at) <= end_date,
            Sale.area == area
        )
        if branch_id:
            area_q = area_q.filter(Sale.branch_id == branch_id)
        area_result = area_q.first()
        area_sales[area] = {
            "revenue": float(area_result[0]),
            "transactions": area_result[1]
        }

    payment_query = db.query(
        Sale.payment_method,
        sql_func.coalesce(sql_func.sum(Sale.total_amount), 0),
        sql_func.count(Sale.id)
    ).filter(
        sql_func.date(Sale.created_at) >= start_date,
        sql_func.date(Sale.created_at) <= end_date
    ).group_by(Sale.payment_method)
    if branch_id:
        payment_query = payment_query.filter(Sale.branch_id == branch_id)
    payment_methods = {}
    for r in payment_query.all():
        payment_methods[r[0] or "Unknown"] = {
            "revenue": float(r[1]),
            "transactions": r[2]
        }

    smash_query = db.query(
        sql_func.coalesce(sql_func.sum(SaleItem.token_count), 0)
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        sql_func.date(Sale.created_at) >= start_date,
        sql_func.date(Sale.created_at) <= end_date,
        SaleItem.item_type == 'smash'
    )
    if branch_id:
        smash_query = smash_query.filter(Sale.branch_id == branch_id)
    smash_count = int(smash_query.scalar() or 0)

    extra_query = db.query(
        sql_func.coalesce(sql_func.sum(SaleItem.token_count), 0)
    ).join(Sale, Sale.id == SaleItem.sale_id).filter(
        sql_func.date(Sale.created_at) >= start_date,
        sql_func.date(Sale.created_at) <= end_date,
        SaleItem.item_type == 'extra'
    )
    if branch_id:
        extra_query = extra_query.filter(Sale.branch_id == branch_id)
    extra_count = int(extra_query.scalar() or 0)

    token_query = db.query(
        Product.name,
        sql_func.sum(SaleItem.quantity).label("qty"),
        sql_func.sum(SaleItem.subtotal).label("rev")
    ).join(SaleItem, SaleItem.product_id == Product.id).join(Sale, Sale.id == SaleItem.sale_id).filter(
        sql_func.date(Sale.created_at) >= start_date,
        sql_func.date(Sale.created_at) <= end_date,
        Product.category == 'Tokens'
    ).group_by(Product.name)
    if branch_id:
        token_query = token_query.filter(Sale.branch_id == branch_id)
    token_sales = []
    for r in token_query.all():
        name = r[0] or ''
        qty = int(r[1] or 0)
        token_per_pack = 0
        for part in name.split():
            try:
                token_per_pack = int(part)
                break
            except ValueError:
                continue
        token_sales.append({
            "name": name,
            "packs_sold": qty,
            "tokens": token_per_pack * qty if token_per_pack > 0 else qty,
            "revenue": float(r[2])
        })

    daily_query = db.query(
        sql_func.date(Sale.created_at).label("day"),
        sql_func.coalesce(sql_func.sum(Sale.total_amount), 0).label("total"),
        sql_func.count(Sale.id).label("txn")
    ).filter(
        sql_func.date(Sale.created_at) >= start_date,
        sql_func.date(Sale.created_at) <= end_date
    ).group_by(sql_func.date(Sale.created_at)).order_by(sql_func.date(Sale.created_at))
    if branch_id:
        daily_query = daily_query.filter(Sale.branch_id == branch_id)
    daily_breakdown = [{"date": str(r.day), "revenue": float(r.total), "transactions": r.txn} for r in daily_query.all()]

    return {
        "total_revenue": float(result[0]),
        "total_transactions": result[1],
        "average_sale": round(float(result[0]) / result[1], 2) if result[1] > 0 else 0,
        "period_start": start_date.isoformat(),
        "period_end": end_date.isoformat(),
        "top_products": top_products,
        "area_sales": area_sales,
        "payment_methods": payment_methods,
        "smash_token_count": smash_count,
        "extra_token_count": extra_count,
        "token_sales": token_sales,
        "daily_breakdown": daily_breakdown
    }
