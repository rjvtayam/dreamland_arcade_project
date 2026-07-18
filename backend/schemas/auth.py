from pydantic import BaseModel
from typing import Optional


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    type: str
    exp: int


class RefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    pin: str
    branch_id: Optional[int] = None
