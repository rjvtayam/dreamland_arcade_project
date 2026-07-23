from datetime import datetime, date, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import func as sql_func
from fastapi import HTTPException
import json

from models.product import Product
from models.sale import Sale, SaleItem
from models.tracking_sheet import TrackingSheet


def create_product(db: Session, branch_id: int, name: str, category: str = None,
                   price: float = 0, stock: int = 0, discount: float = 0) -> Product:
    product = Product(
        branch_id=branch_id,
        name=name,
        category=category,
        price=price,
        stock=stock,
        discount=discount
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_products(db: Session, branch_id: Optional[int] = None, category: str = None, active_only: bool = True):
    query = db.query(Product)
    if active_only:
        query = query.filter(Product.is_active == True)
    if branch_id:
        query = query.filter(Product.branch_id == branch_id)
    if category:
        query = query.filter(Product.category == category)
    return query.order_by(Product.name).all()


def get_product(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def update_product(db: Session, product_id: int, **kwargs) -> Product:
    product = get_product(db, product_id)
    for key, value in kwargs.items():
        if value is not None:
            setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def create_sale(db: Session, branch_id: int, sold_by: int, items: List[dict], payment_method: str = "cash", area: str = "Arcade") -> Sale:
    total = 0
    sale_items = []
    for item_data in items:
        item_type = item_data.get("item_type", "regular")
        token_count = item_data.get("token_count", 0)
        custom_price = item_data.get("custom_price")

        if item_type in ("smash", "extra"):
            unit_price = float(custom_price or 0)
            qty = item_data.get("quantity", 1)
            subtotal = unit_price * qty
            total += subtotal
            sale_items.append({
                "product_id": None,
                "quantity": qty,
                "unit_price": unit_price,
                "subtotal": subtotal,
                "item_type": item_type,
                "token_count": token_count * qty
            })
        else:
            product = db.query(Product).filter(
                Product.id == item_data["product_id"],
                Product.branch_id == branch_id,
                Product.is_active == True
            ).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item_data['product_id']} not found")
            if product.stock < item_data["quantity"]:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
            product.stock -= item_data["quantity"]
            subtotal = float(product.price) * item_data["quantity"]
            total += subtotal
            sale_items.append({
                "product_id": product.id,
                "quantity": item_data["quantity"],
                "unit_price": float(product.price),
                "subtotal": subtotal,
                "item_type": "regular",
                "token_count": 0
            })

    sale = Sale(
        branch_id=branch_id,
        sold_by=sold_by,
        total_amount=total,
        payment_method=payment_method,
        area=area
    )
    db.add(sale)
    db.flush()

    for si in sale_items:
        sale_item = SaleItem(sale_id=sale.id, **si)
        db.add(sale_item)

    auto_update_tracking_sheet(db, sale, items, payment_method, area)

    db.commit()
    db.refresh(sale)

    return sale


def auto_update_tracking_sheet(db: Session, sale: Sale, items: List[dict], payment_method: str, area: str):
    today = date.today()
    ts = db.query(TrackingSheet).filter(
        TrackingSheet.branch_id == sale.branch_id,
        TrackingSheet.area == area,
        TrackingSheet.sheet_date == today
    ).first()

    if not ts:
        ts = TrackingSheet(
            branch_id=sale.branch_id,
            area=area,
            sheet_date=today,
            status="draft",
            created_by=sale.sold_by,
            data={
                "items": [
                    {"qty": 0, "item": "10 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                    {"qty": 0, "item": "20 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                    {"qty": 0, "item": "50 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                    {"qty": 0, "item": "100 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                    {"qty": 0, "item": "150 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                    {"qty": 0, "item": "250 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                    {"qty": 0, "item": "", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                    {"qty": 0, "item": "", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
                ],
                "token_decode": {"10": 0, "20": 0, "50": 0, "100": 0, "150": 0, "250": 0},
                "cash": {"expenses": 0, "recharge": 0, "cash_in": 0},
                "smash": {"count": 0, "revenue": 0},
                "extra": {"count": 0, "revenue": 0},
                "payments": {"cash": 0, "gcash": 0, "other": 0}
            }
        )
        db.add(ts)
        db.flush()

    data = ts.data or {}
    if "items" not in data:
        data["items"] = [
            {"qty": 0, "item": "10 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
            {"qty": 0, "item": "20 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
            {"qty": 0, "item": "50 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
            {"qty": 0, "item": "100 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
            {"qty": 0, "item": "150 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
            {"qty": 0, "item": "250 Tokens", "cost": 0, "amount": 0, "quantity": 0, "share": 0, "total_sales": 0},
        ]
    if "token_decode" not in data:
        data["token_decode"] = {"10": 0, "20": 0, "50": 0, "100": 0, "150": 0, "250": 0}
    if "cash" not in data:
        data["cash"] = {"expenses": 0, "recharge": 0, "cash_in": 0}
    if "smash" not in data:
        data["smash"] = {"count": 0, "revenue": 0}
    if "extra" not in data:
        data["extra"] = {"count": 0, "revenue": 0}
    if "payments" not in data:
        data["payments"] = {"cash": 0, "gcash": 0, "other": 0}

    sale_total = float(sale.total_amount or 0)
    pm = (payment_method or "cash").lower()
    if pm in ("gcash", "gcash"):
        data["payments"]["gcash"] = data["payments"].get("gcash", 0) + sale_total
    elif pm == "cash":
        data["payments"]["cash"] = data["payments"].get("cash", 0) + sale_total
    else:
        data["payments"]["other"] = data["payments"].get("other", 0) + sale_total

    token_decode = data["token_decode"]
    items_list = data["items"]

    for item_data in items:
        item_type = item_data.get("item_type", "regular")
        qty = item_data.get("quantity", 1)

        if item_type == "smash":
            tc = item_data.get("token_count", 0) * qty
            cp = float(item_data.get("custom_price", 0) or 0)
            data["smash"]["count"] = data["smash"].get("count", 0) + tc
            data["smash"]["revenue"] = data["smash"].get("revenue", 0) + (cp * qty)

        elif item_type == "extra":
            tc = item_data.get("token_count", 0) * qty
            cp = float(item_data.get("custom_price", 0) or 0)
            data["extra"]["count"] = data["extra"].get("count", 0) + tc
            data["extra"]["revenue"] = data["extra"].get("revenue", 0) + (cp * qty)

        else:
            product = db.query(Product).filter(Product.id == item_data.get("product_id")).first()
            if not product:
                continue

            product_name = product.name or ""
            product_price = float(product.price or 0)
            amount = product_price * qty

            matched = False
            for row in items_list:
                if row.get("item") == product_name:
                    row["qty"] = row.get("qty", 0) + qty
                    row["quantity"] = row.get("quantity", 0) + qty
                    row["amount"] = row.get("amount", 0) + amount
                    row["total_sales"] = row.get("total_sales", 0) + amount
                    matched = True
                    break

            if not matched:
                items_list.append({
                    "qty": qty,
                    "item": product_name,
                    "cost": 0,
                    "amount": amount,
                    "quantity": qty,
                    "share": 0,
                    "total_sales": amount
                })

            if product.category == "Tokens":
                token_num = 0
                for part in product_name.split():
                    try:
                        token_num = int(part)
                        break
                    except ValueError:
                        continue
                if token_num > 0:
                    key = str(token_num)
                    token_decode[key] = token_decode.get(key, 0) + (token_num * qty)

    ts.data = data
    ts.total_sales = float(ts.total_sales or 0) + sale_total
    ts.total_cash_on_hand = float(ts.total_cash_on_hand or 0) + sale_total
    flag_modified(ts, "data")
    db.commit()


def get_sales(db: Session, branch_id: Optional[int] = None, start_date: Optional[date] = None, end_date: Optional[date] = None):
    query = db.query(Sale)
    if branch_id:
        query = query.filter(Sale.branch_id == branch_id)
    if start_date:
        query = query.filter(sql_func.date(Sale.created_at) >= start_date)
    if end_date:
        query = query.filter(sql_func.date(Sale.created_at) <= end_date)
    return query.order_by(Sale.created_at.desc()).all()


def get_sales_summary(db: Session, branch_id: Optional[int] = None, period: str = "daily"):
    today = date.today()
    if period == "daily":
        start = today
    elif period == "weekly":
        start = today - timedelta(days=today.weekday())
    elif period == "monthly":
        start = today.replace(day=1)
    else:
        start = today

    query = db.query(
        sql_func.coalesce(sql_func.sum(Sale.total_amount), 0).label("total_sales"),
        sql_func.count(Sale.id).label("total_transactions")
    ).filter(sql_func.date(Sale.created_at) >= start)
    if branch_id:
        query = query.filter(Sale.branch_id == branch_id)

    result = query.first()
    total_sales = float(result.total_sales)
    total_transactions = result.total_transactions
    avg_sale = total_sales / total_transactions if total_transactions > 0 else 0

    return {
        "total_sales": total_sales,
        "total_transactions": total_transactions,
        "average_sale": round(avg_sale, 2),
        "period": period,
        "start_date": start.isoformat()
    }
