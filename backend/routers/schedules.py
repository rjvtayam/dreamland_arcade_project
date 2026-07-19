from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import random
import math

from database import get_db
from schemas.schedule import ScheduleCreate, ScheduleUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.schedule import Schedule
from services import schedule_service

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

STATIONS = ["Arcade Cashier", "Playhouse Cashier", "Cafe Cashier", "Assist/Troubleshoot", "Cleaners/Maintenance"]

FULL_TIME_IDS = [9, 10, 11, 12, 13, 14]
PART_TIME_IDS = [15, 16]


@router.get("/my")
def my_schedule(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schedules = schedule_service.get_user_schedule(db, current_user.id)
    result = []
    for s in schedules:
        branch = db.query(Branch).filter(Branch.id == s.branch_id).first()
        result.append({
            "id": s.id,
            "day_of_week": s.day_of_week,
            "day_name": DAY_NAMES[s.day_of_week],
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "station": getattr(s, 'station', None),
            "branch_name": branch.name if branch else None
        })
    return result


@router.get("")
def list_schedules(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    if branch_id:
        schedules = schedule_service.get_branch_schedules(db, branch_id)
    else:
        from models.schedule import Schedule
        schedules = db.query(Schedule).filter(Schedule.is_active == True).order_by(Schedule.user_id).all()

    result = []
    for s in schedules:
        user = db.query(User).filter(User.id == s.user_id).first()
        branch = db.query(Branch).filter(Branch.id == s.branch_id).first()
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else None,
            "branch_id": s.branch_id,
            "branch_name": branch.name if branch else None,
            "day_of_week": s.day_of_week,
            "day_name": DAY_NAMES[s.day_of_week],
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "station": getattr(s, 'station', None),
            "is_active": s.is_active
        })
    return result


@router.post("")
def create_schedule(
    data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner" and data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only create schedules for their own branch")

    if data.day_of_week < 0 or data.day_of_week > 6:
        raise HTTPException(status_code=400, detail="day_of_week must be 0-6")
    schedule = schedule_service.create_schedule(
        db, data.user_id, data.branch_id, data.day_of_week, data.start_time, data.end_time, getattr(data, 'station', None)
    )
    return {"id": schedule.id, "detail": "Schedule created"}


@router.put("/{schedule_id}")
def update_schedule(
    schedule_id: int,
    data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    from models.schedule import Schedule
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if current_user.role != "owner" and schedule.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only update schedules for their own branch")

    update_data = data.model_dump(exclude_unset=True)
    schedule = schedule_service.update_schedule(db, schedule_id, **update_data)
    return {"detail": "Schedule updated"}


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    from models.schedule import Schedule
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if current_user.role != "owner" and schedule.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only delete schedules for their own branch")

    return schedule_service.delete_schedule(db, schedule_id)


@router.post("/reshuffle")
def reshuffle_schedules(
    branch_id: Optional[int] = None,
    week_offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id
    if not branch_id:
        branch_id = current_user.branch_id

    full_time = db.query(User).filter(
        User.id.in_(FULL_TIME_IDS),
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()
    part_time = db.query(User).filter(
        User.id.in_(PART_TIME_IDS),
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()

    existing = db.query(Schedule).filter(Schedule.branch_id == branch_id).all()
    for s in existing:
        db.delete(s)
    db.flush()

    random.seed(week_offset * 7 + branch_id)

    day_off_map = {}
    full_time_ids = [u.id for u in full_time]
    off_days_pool = [1, 2, 3, 4]
    for i, uid in enumerate(full_time_ids):
        day_off = off_days_pool[(i + week_offset) % len(off_days_pool)]
        day_off_map[uid] = day_off

    per_user_stations = {}
    for uid in full_time_ids:
        shuffled_stations = list(STATIONS)
        random.shuffle(shuffled_stations)
        per_user_stations[uid] = shuffled_stations

    created = 0
    for day in range(7):
        working_today = []
        for user in full_time:
            if day_off_map.get(user.id) != day:
                working_today.append(user)

        for user in part_time:
            if day in [6, 0]:
                working_today.append(user)

        stations_today = list(STATIONS)
        random.shuffle(stations_today)
        while len(stations_today) < len(working_today):
            stations_today.extend(STATIONS)

        for i, user in enumerate(working_today):
            is_part_time = user.id in PART_TIME_IDS
            start = "10:00"
            end = "18:00" if is_part_time else "20:00"
            station = stations_today[i % len(stations_today)]

            schedule = Schedule(
                user_id=user.id,
                branch_id=branch_id,
                day_of_week=day,
                start_time=start,
                end_time=end,
                station=station,
                is_active=True
            )
            db.add(schedule)
            created += 1

        for user in full_time:
            if day_off_map.get(user.id) == day:
                schedule = Schedule(
                    user_id=user.id,
                    branch_id=branch_id,
                    day_of_week=day,
                    start_time="10:00",
                    end_time="20:00",
                    station="Day Off",
                    is_active=True
                )
                db.add(schedule)
                created += 1

    db.commit()

    return {
        "detail": f"Reshuffled {created} schedules for week offset {week_offset}",
        "total": created,
        "week_offset": week_offset
    }


@router.post("/generate-initial")
def generate_initial_schedules(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id
    if not branch_id:
        branch_id = current_user.branch_id

    full_time = db.query(User).filter(
        User.id.in_(FULL_TIME_IDS),
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()
    part_time = db.query(User).filter(
        User.id.in_(PART_TIME_IDS),
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()

    day_off_map = {}
    off_days_pool = [1, 2, 3, 4]
    for i, user in enumerate(full_time):
        day_off = off_days_pool[i % len(off_days_pool)]
        day_off_map[user.id] = day_off

    created = 0
    for day in range(7):
        working_today = []
        for user in full_time:
            if day_off_map.get(user.id) != day:
                working_today.append(user)
        for user in part_time:
            if day in [6, 0]:
                working_today.append(user)

        random.seed(day * 10 + branch_id)
        stations_today = list(STATIONS)
        random.shuffle(stations_today)
        while len(stations_today) < len(working_today):
            stations_today.extend(STATIONS)

        for i, user in enumerate(working_today):
            is_part_time = user.id in PART_TIME_IDS
            start = "10:00"
            end = "18:00" if is_part_time else "20:00"
            station = stations_today[i % len(stations_today)]

            schedule = Schedule(
                user_id=user.id,
                branch_id=branch_id,
                day_of_week=day,
                start_time=start,
                end_time=end,
                station=station,
                is_active=True
            )
            db.add(schedule)
            created += 1

        for user in full_time:
            if day_off_map.get(user.id) == day:
                schedule = Schedule(
                    user_id=user.id,
                    branch_id=branch_id,
                    day_of_week=day,
                    start_time="10:00",
                    end_time="20:00",
                    station="Day Off",
                    is_active=True
                )
                db.add(schedule)
                created += 1

    db.commit()
    return {"detail": f"Generated {created} initial schedules", "total": created}
