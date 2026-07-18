from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from database import get_db
from schemas.attendance import ClockInRequest, ClockOutRequest
from dependencies import get_current_user, require_role
from models.user import User
from models.attendance import Attendance
from models.branch import Branch
from services import attendance_service

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.post("/clock-in")
def clock_in(
    data: ClockInRequest,
    db: Session = Depends(get_db)
):
    from services.auth_service import authenticate_user
    user = authenticate_user(db, data.pin, data.branch_id)
    return attendance_service.clock_in(db, user.id, data.branch_id)


@router.post("/clock-out")
def clock_out(
    data: ClockOutRequest,
    db: Session = Depends(get_db)
):
    from services.auth_service import authenticate_user
    user = authenticate_user(db, data.pin)
    return attendance_service.clock_out(db, user.id)


@router.get("/my")
def my_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sd = date.fromisoformat(start_date) if start_date else None
    ed = date.fromisoformat(end_date) if end_date else None
    records = attendance_service.get_user_attendance(db, current_user.id, sd, ed)
    result = []
    for a in records:
        branch = db.query(Branch).filter(Branch.id == a.branch_id).first()
        hours = None
        if a.clock_out:
            hours = round((a.clock_out - a.clock_in).total_seconds() / 3600, 1)
        result.append({
            "id": a.id,
            "branch_id": a.branch_id,
            "branch_name": branch.name if branch else None,
            "clock_in": a.clock_in.isoformat(),
            "clock_out": a.clock_out.isoformat() if a.clock_out else None,
            "status": a.status,
            "hours_worked": hours,
            "notes": a.notes
        })
    return result


@router.get("")
def list_attendance(
    branch_id: Optional[int] = None,
    target_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    td = date.fromisoformat(target_date) if target_date else None
    records = attendance_service.get_branch_attendance(db, branch_id, td)
    result = []
    for a in records:
        user = db.query(User).filter(User.id == a.user_id).first()
        branch = db.query(Branch).filter(Branch.id == a.branch_id).first()
        hours = None
        if a.clock_out:
            hours = round((a.clock_out - a.clock_in).total_seconds() / 3600, 1)
        result.append({
            "id": a.id,
            "user_id": a.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else None,
            "branch_id": a.branch_id,
            "branch_name": branch.name if branch else None,
            "clock_in": a.clock_in.isoformat(),
            "clock_out": a.clock_out.isoformat() if a.clock_out else None,
            "status": a.status,
            "hours_worked": hours,
            "notes": a.notes
        })
    return result
