from datetime import datetime, date, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func

from models.attendance import Attendance
from models.schedule import Schedule
from models.user import User
from fastapi import HTTPException, status


LATE_THRESHOLD_MINUTES = 15


def clock_in(db: Session, user_id: int, branch_id: int) -> Attendance:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.branch_id != branch_id:
        raise HTTPException(status_code=400, detail="You can only clock in at your assigned branch")

    now = datetime.now(timezone.utc)
    today = now.date()
    active = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        sql_func.date(Attendance.clock_in) == today,
        Attendance.clock_out == None
    ).first()
    if active:
        raise HTTPException(status_code=400, detail="You already have an active clock-in session")

    att_status = "present"
    schedules = db.query(Schedule).filter(
        Schedule.user_id == user_id,
        Schedule.day_of_week == now.weekday(),
        Schedule.is_active == True
    ).all()
    if schedules:
        for sch in schedules:
            start = datetime.combine(today, sch.start_time, tzinfo=timezone.utc)
            if now > start + timedelta(minutes=LATE_THRESHOLD_MINUTES):
                att_status = "late"
                break

    attendance = Attendance(
        user_id=user_id,
        branch_id=branch_id,
        clock_in=now,
        status=att_status
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


def clock_out(db: Session, user_id: int) -> Attendance:
    now = datetime.now(timezone.utc)
    today = now.date()
    attendance = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        sql_func.date(Attendance.clock_in) == today,
        Attendance.clock_out == None
    ).first()
    if not attendance:
        raise HTTPException(status_code=400, detail="No active clock-in session found")

    attendance.clock_out = now
    hours = (now - attendance.clock_in).total_seconds() / 3600
    if hours > 9:
        attendance.status = "overtime"

    db.commit()
    db.refresh(attendance)
    return attendance


def get_user_attendance(db: Session, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None):
    query = db.query(Attendance).filter(Attendance.user_id == user_id)
    if start_date:
        query = query.filter(sql_func.date(Attendance.clock_in) >= start_date)
    if end_date:
        query = query.filter(sql_func.date(Attendance.clock_in) <= end_date)
    return query.order_by(Attendance.clock_in.desc()).all()


def get_branch_attendance(db: Session, branch_id: Optional[int] = None, target_date: Optional[date] = None):
    query = db.query(Attendance)
    if branch_id:
        query = query.filter(Attendance.branch_id == branch_id)
    if target_date:
        query = query.filter(sql_func.date(Attendance.clock_in) == target_date)
    return query.order_by(Attendance.clock_in.desc()).all()
