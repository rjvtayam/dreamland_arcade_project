from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "info"
    link: Optional[str] = None


class NotificationBroadcast(BaseModel):
    title: str
    message: str
    type: str = "info"
    branch_id: Optional[int] = None
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_by: Optional[int] = None
    branch_id: Optional[int] = None
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


class ThreadCreate(BaseModel):
    subject: str
    participant_ids: list[int]
    content: str


class MessageResponse(BaseModel):
    id: int
    thread_id: int
    sender_id: int
    content: str
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


class ThreadResponse(BaseModel):
    id: int
    subject: str
    branch_id: Optional[int] = None
    created_by: int
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    participant_names: list[str] = []

    class Config:
        from_attributes = True
