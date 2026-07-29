from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProposalCreate(BaseModel):
    branch_id: int
    area: Optional[str] = "Arcade"
    title: str
    description: Optional[str] = ""
    proposal_month: str
    amount: Optional[int] = 0


class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    proposal_month: Optional[str] = None
    amount: Optional[int] = None
    owner_comment: Optional[str] = None


class ProposalResponse(BaseModel):
    id: int
    branch_id: int
    created_by: int
    title: str
    description: Optional[str]
    proposal_month: str
    status: str
    owner_comment: Optional[str]
    amount: Optional[int]
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True
