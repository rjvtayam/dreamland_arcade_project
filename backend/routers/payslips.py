from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import Optional
from datetime import date, datetime

from database import get_db
from schemas.payslip import PayslipCreate, PayslipUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.payslip import Payslip
from models.attendance import Attendance

router = APIRouter(prefix="/api/payslips", tags=["payslips"])


@router.get("/my")
def my_payslips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payslips = db.query(Payslip).filter(
        Payslip.user_id == current_user.id
    ).order_by(Payslip.period_start.desc()).all()
    result = []
    for p in payslips:
        branch = db.query(Branch).filter(Branch.id == p.branch_id).first()
        creator = db.query(User).filter(User.id == p.created_by).first() if p.created_by else None
        result.append({
            "id": p.id,
            "period_start": p.period_start.isoformat(),
            "period_end": p.period_end.isoformat(),
            "base_pay": float(p.base_pay),
            "overtime_pay": float(p.overtime_pay),
            "bonuses": float(p.bonuses),
            "deductions": float(p.deductions),
            "total_pay": float(p.total_pay),
            "hours_worked": float(p.hours_worked),
            "overtime_hours": float(p.overtime_hours),
            "notes": p.notes,
            "status": p.status,
            "branch_name": branch.name if branch else None,
            "creator_name": f"{creator.first_name} {creator.last_name}" if creator else None,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return result


@router.get("")
def list_payslips(
    branch_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(Payslip)

    if current_user.role == "owner":
        if branch_id:
            query = query.filter(Payslip.branch_id == branch_id)
    elif current_user.role == "admin":
        query = query.filter(Payslip.branch_id == current_user.branch_id)
        query = query.filter(Payslip.user_id != current_user.id)
    else:
        query = query.filter(Payslip.user_id == current_user.id)

    if user_id:
        query = query.filter(Payslip.user_id == user_id)
    if status:
        query = query.filter(Payslip.status == status)

    payslips = query.order_by(Payslip.period_start.desc()).all()
    result = []
    for p in payslips:
        user = db.query(User).filter(User.id == p.user_id).first()
        branch = db.query(Branch).filter(Branch.id == p.branch_id).first()
        creator = db.query(User).filter(User.id == p.created_by).first() if p.created_by else None
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else None,
            "branch_id": p.branch_id,
            "branch_name": branch.name if branch else None,
            "period_start": p.period_start.isoformat(),
            "period_end": p.period_end.isoformat(),
            "base_pay": float(p.base_pay),
            "overtime_pay": float(p.overtime_pay),
            "bonuses": float(p.bonuses),
            "deductions": float(p.deductions),
            "total_pay": float(p.total_pay),
            "hours_worked": float(p.hours_worked),
            "overtime_hours": float(p.overtime_hours),
            "notes": p.notes,
            "status": p.status,
            "creator_name": f"{creator.first_name} {creator.last_name}" if creator else None,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return result


@router.post("/calculate")
def calculate_from_attendance(
    user_id: int,
    period_start: date,
    period_end: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == "admin":
        if user.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Cannot calculate for users in other branches")
        if user.id == current_user.id:
            raise HTTPException(status_code=403, detail="Cannot calculate payslip for yourself")

    attendances = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.clock_in >= datetime.combine(period_start, datetime.min.time()),
        Attendance.clock_in <= datetime.combine(period_end, datetime.max.time()),
        Attendance.clock_out.isnot(None)
    ).all()

    days_present = len(attendances)
    total_hours = 0.0
    total_ot_hours = 0.0

    for att in attendances:
        diff = att.clock_out - att.clock_in
        hours = diff.total_seconds() / 3600.0
        total_hours += hours
        if hours > 8:
            total_ot_hours += hours - 8

    daily_rate = float(user.daily_rate or 0)
    base_pay = daily_rate * days_present
    hourly_rate = daily_rate / 8 if daily_rate > 0 else 0
    overtime_pay = total_ot_hours * hourly_rate * 1.25

    return {
        "user_id": user_id,
        "user_name": f"{user.first_name} {user.last_name}",
        "daily_rate": daily_rate,
        "days_present": days_present,
        "hours_worked": round(total_hours, 1),
        "overtime_hours": round(total_ot_hours, 1),
        "base_pay": round(base_pay, 2),
        "overtime_pay": round(overtime_pay, 2),
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat()
    }


@router.post("")
def create_payslip(
    data: PayslipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role == "admin":
        if data.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Admins can only create payslips for their own branch")
        if data.user_id == current_user.id:
            raise HTTPException(status_code=403, detail="Admins cannot create payslips for themselves")

    total = data.base_pay + data.overtime_pay + data.bonuses - data.deductions
    payslip = Payslip(
        user_id=data.user_id,
        branch_id=data.branch_id,
        period_start=data.period_start,
        period_end=data.period_end,
        base_pay=data.base_pay,
        overtime_pay=data.overtime_pay,
        bonuses=data.bonuses,
        deductions=data.deductions,
        total_pay=total,
        hours_worked=data.hours_worked,
        overtime_hours=data.overtime_hours,
        notes=data.notes,
        status="pending",
        created_by=current_user.id
    )
    db.add(payslip)
    db.commit()
    db.refresh(payslip)
    return {"id": payslip.id, "detail": "Payslip created"}


@router.put("/{payslip_id}")
def update_payslip(
    payslip_id: int,
    data: PayslipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")

    if current_user.role == "admin":
        if payslip.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Admins can only update payslips for their own branch")
        if payslip.user_id == current_user.id:
            raise HTTPException(status_code=403, detail="Admins cannot update their own payslip")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(payslip, key, value)
    payslip.total_pay = payslip.base_pay + payslip.overtime_pay + payslip.bonuses - payslip.deductions
    db.commit()
    return {"detail": "Payslip updated"}


@router.put("/{payslip_id}/approve")
def approve_payslip(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")

    if current_user.role == "admin":
        if payslip.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Admins can only approve payslips for their own branch")
        if payslip.user_id == current_user.id:
            raise HTTPException(status_code=403, detail="Admins cannot approve their own payslip")

    payslip.status = "approved"
    db.commit()
    return {"detail": "Payslip approved"}


@router.delete("/{payslip_id}")
def delete_payslip(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    db.delete(payslip)
    db.commit()
    return {"detail": "Payslip deleted"}
