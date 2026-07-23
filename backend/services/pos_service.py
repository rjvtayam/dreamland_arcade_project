from datetime import datetime, date, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from fastapi import HTTPException

from models.product import Product
from models.sale import Sale, SaleItem


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
            "subtotal": subtotal
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

    db.commit()
    db.refresh(sale)
    return sale


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
