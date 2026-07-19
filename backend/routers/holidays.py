from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from schemas.holiday import HolidayCreate, HolidayUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.holiday import Holiday

router = APIRouter(prefix="/api/holidays", tags=["holidays"])


@router.get("")
def list_holidays(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Holiday)

    if current_user.role != "owner":
        query = query.filter(
            (Holiday.branch_id == current_user.branch_id) | (Holiday.branch_id == None)
        )
    elif branch_id:
        query = query.filter(
            (Holiday.branch_id == branch_id) | (Holiday.branch_id == None)
        )

    holidays = query.order_by(Holiday.date).all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "date": h.date.isoformat(),
            "branch_id": h.branch_id,
            "is_recurring": h.is_recurring,
            "created_at": h.created_at.isoformat() if h.created_at else None
        }
        for h in holidays
    ]


@router.post("")
def create_holiday(
    data: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner" and data.branch_id and data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only create holidays for their own branch")

    holiday = Holiday(**data.model_dump())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return {"id": holiday.id, "detail": "Holiday created"}


@router.put("/{holiday_id}")
def update_holiday(
    holiday_id: int,
    data: HolidayUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    if current_user.role != "owner" and holiday.branch_id and holiday.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only update holidays for their own branch")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(holiday, key, value)
    db.commit()
    return {"detail": "Holiday updated"}


@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(holiday)
    db.commit()
    return {"detail": "Holiday deleted"}
