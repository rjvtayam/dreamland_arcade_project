from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Date, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base


class POSReport(Base):
    __tablename__ = "pos_reports"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_date = Column(Date, nullable=False)
    total_sales = Column(Numeric(10, 2), default=0)
    total_transactions = Column(Integer, default=0)
    arcade_sales = Column(Numeric(10, 2), default=0)
    playhouse_sales = Column(Numeric(10, 2), default=0)
    cafe_sales = Column(Numeric(10, 2), default=0)
    cash_sales = Column(Numeric(10, 2), default=0)
    gcash_sales = Column(Numeric(10, 2), default=0)
    card_sales = Column(Numeric(10, 2), default=0)
    items_summary = Column(JSONB, default=[])
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
