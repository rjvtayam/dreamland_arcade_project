from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from schemas.dayoff import DayoffRequestCreate, DayoffReview
from dependencies import get_current_user, require_role
from models.user import User
from models.dayoff import DayoffRequest
from models.branch import Branch

router = APIRouter(prefix="/api/dayoffs", tags=["dayoffs"])


@router.get("/my")
def my_dayoffs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    requests = db.query(DayoffRequest).filter(
        DayoffRequest.user_id == current_user.id
    ).order_by(DayoffRequest.created_at.desc()).all()
    result = []
    for r in requests:
        branch = db.query(Branch).filter(Branch.id == r.branch_id).first()
        reviewer = db.query(User).filter(User.id == r.reviewed_by).first() if r.reviewed_by else None
        result.append({
            "id": r.id,
            "date": r.date.isoformat(),
            "reason": r.reason,
            "status": r.status,
            "branch_name": branch.name if branch else None,
            "reviewer_name": f"{reviewer.first_name} {reviewer.last_name}" if reviewer else None,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return result


@router.post("")
def create_dayoff(
    data: DayoffRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    request = DayoffRequest(
        user_id=current_user.id,
        branch_id=data.branch_id,
        date=data.date,
        reason=data.reason
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return {"id": request.id, "detail": "Day-off request submitted"}


@router.get("")
def list_dayoffs(
    status: Optional[str] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(DayoffRequest)

    if current_user.role != "owner":
        query = query.filter(DayoffRequest.branch_id == current_user.branch_id)
    elif branch_id:
        query = query.filter(DayoffRequest.branch_id == branch_id)

    if status:
        query = query.filter(DayoffRequest.status == status)

    requests = query.order_by(DayoffRequest.created_at.desc()).all()
    result = []
    for r in requests:
        user = db.query(User).filter(User.id == r.user_id).first()
        branch = db.query(Branch).filter(Branch.id == r.branch_id).first()
        reviewer = db.query(User).filter(User.id == r.reviewed_by).first() if r.reviewed_by else None
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else None,
            "branch_name": branch.name if branch else None,
            "date": r.date.isoformat(),
            "reason": r.reason,
            "status": r.status,
            "reviewer_name": f"{reviewer.first_name} {reviewer.last_name}" if reviewer else None,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return result


@router.put("/{request_id}/approve")
def approve_dayoff(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    request = db.query(DayoffRequest).filter(DayoffRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user.role != "owner" and request.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only review requests for their own branch")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already reviewed")
    request.status = "approved"
    request.reviewed_by = current_user.id
    request.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return {"detail": "Request approved"}


@router.put("/{request_id}/reject")
def reject_dayoff(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    request = db.query(DayoffRequest).filter(DayoffRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if current_user.role != "owner" and request.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only review requests for their own branch")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already reviewed")
    request.status = "rejected"
    request.reviewed_by = current_user.id
    request.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return {"detail": "Request rejected"}
