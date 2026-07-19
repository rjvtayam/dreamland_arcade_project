from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    base_pay = Column(Numeric(10, 2), nullable=False, default=0)
    overtime_pay = Column(Numeric(10, 2), nullable=False, default=0)
    bonuses = Column(Numeric(10, 2), nullable=False, default=0)
    deductions = Column(Numeric(10, 2), nullable=False, default=0)
    total_pay = Column(Numeric(10, 2), nullable=False, default=0)
    hours_worked = Column(Numeric(6, 1), default=0)
    overtime_hours = Column(Numeric(6, 1), default=0)
    notes = Column(Text)
    status = Column(String(20), default="pending")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by])
    branch = relationship("Branch")
