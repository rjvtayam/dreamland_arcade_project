from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    location = Column(String(500))
    city = Column(String(100))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="branch")
    attendances = relationship("Attendance", back_populates="branch")
    schedules = relationship("Schedule", back_populates="branch")
    inventory_items = relationship("InventoryItem", back_populates="branch")
    products = relationship("Product", back_populates="branch")
    sales = relationship("Sale", back_populates="branch")
