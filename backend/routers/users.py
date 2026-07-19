from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from schemas.user import UserCreate, UserUpdate, UserPINUpdate, UserResponse
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from services.auth_service import hash_pin, verify_pin

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[dict])
def list_users(
    branch_id: Optional[int] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(User)

    if current_user.role != "owner":
        query = query.filter(User.branch_id == current_user.branch_id)
    elif branch_id:
        query = query.filter(User.branch_id == branch_id)

    if role:
        query = query.filter(User.role == role)

    users = query.order_by(User.last_name).all()
    result = []
    for u in users:
        branch_name = None
        if u.branch_id:
            b = db.query(Branch).filter(Branch.id == u.branch_id).first()
            branch_name = b.name if b else None
        result.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "role": u.role,
            "branch_id": u.branch_id,
            "branch_name": branch_name,
            "daily_rate": float(u.daily_rate or 0),
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return result


@router.post("")
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner" and data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only create users in their own branch")

    if current_user.role != "owner" and data.role in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner can assign owner roles")

    existing = db.query(User).filter(User.pin_hash == hash_pin(data.pin)).first()
    if existing:
        raise HTTPException(status_code=400, detail="PIN already in use")

    if data.email:
        email_check = db.query(User).filter(User.email == data.email).first()
        if email_check:
            raise HTTPException(status_code=400, detail="Email already in use")

    user = User(
        pin_hash=hash_pin(data.pin),
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        role=data.role,
        branch_id=data.branch_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "detail": "User created"}


@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != "owner" and user.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only update users in their own branch")

    update_data = data.model_dump(exclude_unset=True)
    if "role" in update_data and current_user.role != "owner":
        if update_data["role"] in ("owner",):
            raise HTTPException(status_code=403, detail="Only owner can assign owner role")

    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    return {"detail": "User updated"}


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = False
    db.commit()
    return {"detail": "User deactivated"}


@router.put("/me/pin")
def change_my_pin(
    data: UserPINUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_pin(data.current_pin, current_user.pin_hash):
        raise HTTPException(status_code=400, detail="Current PIN is incorrect")
    if len(data.new_pin) < 4 or len(data.new_pin) > 6:
        raise HTTPException(status_code=400, detail="PIN must be 4-6 digits")
    current_user.pin_hash = hash_pin(data.new_pin)
    db.commit()
    return {"detail": "PIN updated"}
