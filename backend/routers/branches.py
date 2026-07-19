from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.branch import BranchCreate, BranchUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch

router = APIRouter(prefix="/api/branches", tags=["branches"])


@router.get("")
def list_branches(db: Session = Depends(get_db)):
    branches = db.query(Branch).filter(Branch.is_active == True).order_by(Branch.name).all()
    result = []
    for b in branches:
        emp_count = db.query(User).filter(User.branch_id == b.id, User.is_active == True).count()
        result.append({
            "id": b.id,
            "name": b.name,
            "location": b.location,
            "city": b.city,
            "phone": b.phone,
            "is_active": b.is_active,
            "employee_count": emp_count,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return result


@router.get("/me")
def get_my_branch(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "owner":
        return {"id": None, "name": "All Branches"}
    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    if not branch:
        return {"id": None, "name": "Unknown"}
    return {"id": branch.id, "name": branch.name}


@router.post("")
def create_branch(
    data: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    branch = Branch(**data.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return {"id": branch.id, "detail": "Branch created"}


@router.put("/{branch_id}")
def update_branch(
    branch_id: int,
    data: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(branch, key, value)
    db.commit()
    return {"detail": "Branch updated"}


@router.delete("/{branch_id}")
def deactivate_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    branch.is_active = False
    db.commit()
    return {"detail": "Branch deactivated"}
