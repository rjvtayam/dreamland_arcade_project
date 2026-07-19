from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from schemas.special_event import SpecialEventCreate, SpecialEventUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.special_event import SpecialEvent

router = APIRouter(prefix="/api/special-events", tags=["special-events"])


@router.get("")
def list_special_events(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SpecialEvent)

    if current_user.role != "owner":
        query = query.filter(
            (SpecialEvent.branch_id == current_user.branch_id) | (SpecialEvent.branch_id == None)
        )
    elif branch_id:
        query = query.filter(
            (SpecialEvent.branch_id == branch_id) | (SpecialEvent.branch_id == None)
        )

    events = query.order_by(SpecialEvent.date).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "description": e.description,
            "date": e.date.isoformat(),
            "icon": e.icon,
            "branch_id": e.branch_id,
            "created_by": e.created_by,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


@router.post("")
def create_special_event(
    data: SpecialEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner" and data.branch_id and data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only create events for their own branch")

    event = SpecialEvent(**data.model_dump(), created_by=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"id": event.id, "detail": "Event created"}


@router.put("/{event_id}")
def update_special_event(
    event_id: int,
    data: SpecialEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    event = db.query(SpecialEvent).filter(SpecialEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "owner" and event.branch_id and event.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only update events for their own branch")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    db.commit()
    return {"detail": "Event updated"}


@router.delete("/{event_id}")
def delete_special_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    event = db.query(SpecialEvent).filter(SpecialEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if current_user.role != "owner" and event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Admins can only delete events they created")
    db.delete(event)
    db.commit()
    return {"detail": "Event deleted"}
