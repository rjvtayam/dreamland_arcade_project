from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from services.auth_service import authenticate_user, create_tokens, refresh_access_token
from dependencies import get_current_user, require_role
from models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.pin, request.branch_id)
    return create_tokens(user.id)


@router.post("/refresh", response_model=TokenResponse)
def refresh(request: RefreshRequest):
    return refresh_access_token(request.refresh_token)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "role": current_user.role,
        "branch_id": current_user.branch_id,
        "is_active": current_user.is_active
    }
