from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    area = Column(String(20), nullable=False, default="Arcade")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    proposal_month = Column(String(7), nullable=False)
    status = Column(String(20), nullable=False, default="draft")
    owner_comment = Column(Text, nullable=True)
    amount = Column(Integer, nullable=True, default=0)
    deleted_at = Column(DateTime(timezone=True), nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    branch = relationship("Branch")
    creator = relationship("User", foreign_keys=[created_by])
