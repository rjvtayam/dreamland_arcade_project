from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class TrackingSheet(Base):
    __tablename__ = "tracking_sheets"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    area = Column(String(50), nullable=False)
    sheet_date = Column(Date, nullable=False)
    cashier_name = Column(String(200), nullable=True)
    total_sales = Column(Numeric(10, 2), default=0)
    total_cash_on_hand = Column(Numeric(10, 2), default=0)
    expenses = Column(Numeric(10, 2), default=0)
    others = Column(Numeric(10, 2), default=0)
    cashflow = Column(Numeric(10, 2), default=0)
    remarks_short = Column(Text, nullable=True)
    remarks_over = Column(Text, nullable=True)
    status = Column(String(20), default="draft")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    branch = relationship("Branch")
    creator = relationship("User")
    items = relationship("TrackingSheetItem", back_populates="tracking_sheet", cascade="all, delete-orphan")


class TrackingSheetItem(Base):
    __tablename__ = "tracking_sheet_items"

    id = Column(Integer, primary_key=True, index=True)
    tracking_sheet_id = Column(Integer, ForeignKey("tracking_sheets.id", on_delete="CASCADE"), nullable=False)
    item_description = Column(String(200), nullable=False)
    opening = Column(Integer, default=0)
    additional_pcs = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    pcs_tracking = Column(Integer, default=0)
    srp = Column(Numeric(10, 2), default=0)
    total_sold = Column(Integer, default=0)
    amount = Column(Numeric(10, 2), default=0)
    closing = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tracking_sheet = relationship("TrackingSheet", back_populates="items")
