from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    discount = Column(Numeric(5, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch", back_populates="products")
