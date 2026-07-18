from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from models.user import User
from dependencies import create_access_token, create_refresh_token, verify_token
from fastapi import HTTPException, status

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_pin(pin: str) -> str:
    return pwd_context.hash(pin)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return pwd_context.verify(plain_pin, hashed_pin)


def authenticate_user(db: Session, pin: str, branch_id: int = None):
    users = db.query(User).filter(User.is_active == True).all()
    matched = []
    for user in users:
        if verify_pin(pin, user.pin_hash):
            matched.append(user)

    if not matched:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )

    if branch_id:
        branch_match = [u for u in matched if u.branch_id == branch_id]
        if branch_match:
            return branch_match[0]

    if len(matched) == 1:
        return matched[0]

    if branch_id is None and len(matched) > 1:
        return matched[0]

    return matched[0]


def create_tokens(user_id: int) -> dict:
    access_token = create_access_token(data={"sub": str(user_id)})
    refresh_token = create_refresh_token(data={"sub": str(user_id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


def refresh_access_token(refresh_token: str) -> dict:
    payload = verify_token(refresh_token, token_type="refresh")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    return create_tokens(int(user_id))
