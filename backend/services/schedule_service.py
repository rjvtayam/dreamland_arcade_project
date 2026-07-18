from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.schedule import Schedule
from models.user import User


def create_schedule(db: Session, user_id: int, branch_id: int, day_of_week: int, start_time: str, end_time: str) -> Schedule:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    schedule = Schedule(
        user_id=user_id,
        branch_id=branch_id,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


def get_user_schedule(db: Session, user_id: int):
    schedules = db.query(Schedule).filter(
        Schedule.user_id == user_id,
        Schedule.is_active == True
    ).order_by(Schedule.day_of_week, Schedule.start_time).all()
    return schedules


def get_branch_schedules(db: Session, branch_id: int):
    return db.query(Schedule).filter(
        Schedule.branch_id == branch_id,
        Schedule.is_active == True
    ).order_by(Schedule.user_id, Schedule.day_of_week).all()


def update_schedule(db: Session, schedule_id: int, **kwargs) -> Schedule:
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    for key, value in kwargs.items():
        if value is not None:
            setattr(schedule, key, value)
    db.commit()
    db.refresh(schedule)
    return schedule


def delete_schedule(db: Session, schedule_id: int):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return {"detail": "Schedule deleted"}
