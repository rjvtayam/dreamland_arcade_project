from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    from_email = Column(String(255), nullable=False)
    to_email = Column(String(255), nullable=False)
    cc_email = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=False, default="")
    body = Column(Text, nullable=False, default="")
    body_text = Column(Text, nullable=True)
    direction = Column(String(10), nullable=False, default="outbound")
    status = Column(String(20), nullable=False, default="sent")
    thread_id = Column(String(100), nullable=True)
    message_id = Column(String(255), nullable=True)
    in_reply_to = Column(Integer, ForeignKey("emails.id"), nullable=True)
    attachments = Column(JSONB, nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)
