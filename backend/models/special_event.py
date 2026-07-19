from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Boolean, Text
from sqlalchemy.sql import func
from database import Base


class SpecialEvent(Base):
    __tablename__ = "special_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=False)
    icon = Column(String(10), nullable=True, default="🎉")
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
