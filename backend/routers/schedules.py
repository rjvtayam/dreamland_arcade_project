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


def _get_user_ids_by_employment(db, branch_id, employment_type):
    users = db.query(User.id).filter(
        User.branch_id == branch_id,
        User.employment_type == employment_type,
        User.is_active == True
    ).all()
    return [u.id for u in users]


@router.get("/my")
def my_schedule(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    schedules = schedule_service.get_user_schedule(db, current_user.id)
    result = []
    for s in schedules:
        branch = db.query(Branch).filter(Branch.id == s.branch_id).first()
        result.append({
            "id": s.id,
            "day_of_week": s.day_of_week,
            "week_number": getattr(s, 'week_number', 0),
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
            "week_number": getattr(s, 'week_number', 0),
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
        db, data.user_id, data.branch_id, data.day_of_week, data.start_time, data.end_time, getattr(data, 'station', None), getattr(data, 'week_number', 0)
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id
    if not branch_id:
        branch_id = current_user.branch_id

    full_time = db.query(User).filter(
        User.employment_type == "full-time",
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()
    part_time = db.query(User).filter(
        User.employment_type == "part-time",
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()

    existing = db.query(Schedule).filter(Schedule.branch_id == branch_id).all()
    for s in existing:
        db.delete(s)
    db.flush()

    import random as _random

    full_time_ids = [u.id for u in full_time]
    WORK_STATIONS = [s for s in STATIONS if s != "Day Off"]

    created = 0
    for week_num in range(4):
        seed_val = week_num * 31 + branch_id * 7 + 42
        rng = _random.Random(seed_val)

        day_off_pool = [1, 2, 3, 4]
        shuffled_days = list(day_off_pool)
        rng.shuffle(shuffled_days)
        day_off_map = {}
        for i, uid in enumerate(full_time_ids):
            day_off_map[uid] = shuffled_days[i % len(shuffled_days)]

        per_user_rotation = {}
        per_user_pos = {}
        all_user_ids = full_time_ids + [u.id for u in part_time]
        for uid in all_user_ids:
            rotation = list(WORK_STATIONS)
            rng.shuffle(rotation)
            per_user_rotation[uid] = rotation
            per_user_pos[uid] = 0

        week_assignments = {}

        for day in range(7):
            working_full = [u for u in full_time if day_off_map.get(u.id) != day]
            working_part = [u for u in part_time if day in [0, 6]]
            working_today = working_full + working_part
            num_workers = len(working_today)

            rng.shuffle(working_today)

            assigned_today = {}
            station_counts = {s: 0 for s in WORK_STATIONS}
            per_user_pos_today = {}

            for user in working_today:
                rotation = per_user_rotation[user.id]
                pos = per_user_pos[user.id]
                best_station = None
                best_count = 999
                for offset in range(len(rotation)):
                    candidate = rotation[(pos + offset) % len(rotation)]
                    if station_counts[candidate] < best_count:
                        best_count = station_counts[candidate]
                        best_station = candidate
                assigned_today[user.id] = best_station
                station_counts[best_station] += 1
                per_user_pos[user.id] = pos + 1

            week_assignments[day] = assigned_today

        for day in range(7):
            assigned_today = week_assignments[day]
            working_full = [u for u in full_time if day_off_map.get(u.id) != day]
            working_part = [u for u in part_time if day in [0, 6]]
            working_today = working_full + working_part

            for user in working_today:
                is_part_time = user.employment_type == "part-time"
                start = "10:00"
                end = "18:00" if is_part_time else "20:00"
                station = assigned_today.get(user.id, "Arcade Cashier")
                schedule = Schedule(
                    user_id=user.id,
                    branch_id=branch_id,
                    day_of_week=day,
                    week_number=week_num,
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
                        week_number=week_num,
                        start_time="10:00",
                        end_time="20:00",
                        station="Day Off",
                        is_active=True
                    )
                    db.add(schedule)
                    created += 1

    db.commit()

    return {
        "detail": f"Reshuffled 4 weeks ({created} schedules) for branch {branch_id}",
        "total": created,
        "weeks": 4
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
        User.employment_type == "full-time",
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()
    part_time = db.query(User).filter(
        User.employment_type == "part-time",
        User.branch_id == branch_id,
        User.is_active == True
    ).order_by(User.id).all()

    existing = db.query(Schedule).filter(Schedule.branch_id == branch_id).all()
    for s in existing:
        db.delete(s)
    db.flush()

    import random as _random

    full_time_ids = [u.id for u in full_time]
    WORK_STATIONS = [s for s in STATIONS if s != "Day Off"]

    created = 0
    for week_num in range(4):
        rng = _random.Random(branch_id * 31 + week_num * 11 + 7)

        day_off_pool = [1, 2, 3, 4]
        shuffled_days = list(day_off_pool)
        rng.shuffle(shuffled_days)
        day_off_map = {}
        for i, uid in enumerate(full_time_ids):
            day_off_map[uid] = shuffled_days[i % len(shuffled_days)]

        per_user_rotation = {}
        per_user_pos = {}
        all_user_ids = full_time_ids + [u.id for u in part_time]
        for uid in all_user_ids:
            rotation = list(WORK_STATIONS)
            rng.shuffle(rotation)
            per_user_rotation[uid] = rotation
            per_user_pos[uid] = 0

        week_assignments = {}

        for day in range(7):
            working_full = [u for u in full_time if day_off_map.get(u.id) != day]
            working_part = [u for u in part_time if day in [0, 6]]
            working_today = working_full + working_part
            rng.shuffle(working_today)

            assigned_today = {}
            unassigned = []

            for user in working_today:
                rotation = per_user_rotation[user.id]
                pos = per_user_pos[user.id]
                station = rotation[pos % len(rotation)]

                if station not in assigned_today.values():
                    assigned_today[user.id] = station
                    per_user_pos[user.id] = pos + 1
                else:
                    unassigned.append(user)

            if unassigned:
                taken = set(assigned_today.values())
                overflow = [s for s in WORK_STATIONS if s not in taken]
                rng.shuffle(overflow)
                while len(overflow) < len(unassigned):
                    extra = list(WORK_STATIONS)
                    rng.shuffle(extra)
                    overflow.extend(extra)

                for i, user in enumerate(unassigned):
                    station = overflow[i % len(overflow)]
                    assigned_today[user.id] = station
                    per_user_pos[user.id] += 1

            week_assignments[day] = assigned_today

        for day in range(7):
            assigned_today = week_assignments[day]
            working_full = [u for u in full_time if day_off_map.get(u.id) != day]
            working_part = [u for u in part_time if day in [0, 6]]
            working_today = working_full + working_part

            for user in working_today:
                is_part_time = user.employment_type == "part-time"
                start = "10:00"
                end = "18:00" if is_part_time else "20:00"
                station = assigned_today.get(user.id, "Arcade Cashier")
                schedule = Schedule(
                    user_id=user.id,
                    branch_id=branch_id,
                    day_of_week=day,
                    week_number=week_num,
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
                        week_number=week_num,
                        start_time="10:00",
                        end_time="20:00",
                        station="Day Off",
                        is_active=True
                    )
                    db.add(schedule)
                    created += 1

    db.commit()
    return {"detail": f"Generated {created} schedules (4 weeks) for branch {branch_id}", "total": created}
