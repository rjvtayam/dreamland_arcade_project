from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnnouncementBase(BaseModel):
    title: str
    content: str
    branch_id: Optional[int] = None
    priority: str = "normal"


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    branch_id: Optional[int] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    branch_id: Optional[int]
    priority: str
    is_active: bool
    created_by: int
    created_at: datetime
    creator_name: Optional[str] = None
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True
