from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Date, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    card_number = Column(String(20), unique=True, nullable=False)
    card_tier = Column(String(20), default="none")
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    total_spent = Column(Numeric(10, 2), default=0)
    total_points = Column(Integer, default=0)
    bonus_tokens_earned = Column(Integer, default=0)
    total_visits = Column(Integer, default=0)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    issued_date = Column(Date, server_default=func.current_date())
    expiry_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    branch = relationship("Branch")
    transactions = relationship("MemberTransaction", back_populates="member", cascade="all, delete-orphan")


class MemberTransaction(Base):
    __tablename__ = "member_transactions"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", on_delete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    points_earned = Column(Integer, default=0)
    bonus_tokens = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("Member", back_populates="transactions")
    branch = relationship("Branch")
