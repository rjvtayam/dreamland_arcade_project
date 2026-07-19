from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from schemas.announcement import AnnouncementCreate, AnnouncementUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.announcement import Announcement

router = APIRouter(prefix="/api/announcements", tags=["announcements"])


@router.get("/my")
def my_announcements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Announcement).filter(Announcement.is_active == True)
    if current_user.branch_id:
        query = query.filter(
            (Announcement.branch_id == current_user.branch_id) |
            (Announcement.branch_id == None)
        )
    announcements = query.order_by(Announcement.created_at.desc()).all()
    result = []
    for a in announcements:
        creator = db.query(User).filter(User.id == a.created_by).first()
        branch = db.query(Branch).filter(Branch.id == a.branch_id).first() if a.branch_id else None
        result.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "branch_name": branch.name if branch else "All Branches",
            "priority": a.priority,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "creator_name": f"{creator.first_name} {creator.last_name}" if creator else None
        })
    return result


@router.get("")
def list_announcements(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(Announcement)

    if current_user.role != "owner":
        query = query.filter(
            (Announcement.branch_id == current_user.branch_id) |
            (Announcement.branch_id == None)
        )
    elif branch_id:
        query = query.filter(
            (Announcement.branch_id == branch_id) |
            (Announcement.branch_id == None)
        )

    announcements = query.order_by(Announcement.created_at.desc()).all()
    result = []
    for a in announcements:
        creator = db.query(User).filter(User.id == a.created_by).first()
        branch = db.query(Branch).filter(Branch.id == a.branch_id).first() if a.branch_id else None
        result.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "branch_id": a.branch_id,
            "branch_name": branch.name if branch else "All Branches",
            "priority": a.priority,
            "is_active": a.is_active,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "creator_name": f"{creator.first_name} {creator.last_name}" if creator else None
        })
    return result


@router.post("")
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner" and data.branch_id and data.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only create announcements for their own branch")

    announcement = Announcement(
        title=data.title,
        content=data.content,
        branch_id=data.branch_id,
        priority=data.priority,
        created_by=current_user.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return {"id": announcement.id, "detail": "Announcement created"}


@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if current_user.role != "owner" and announcement.branch_id and announcement.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Admins can only update announcements for their own branch")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(announcement, key, value)
    db.commit()
    return {"detail": "Announcement updated"}


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(announcement)
    db.commit()
    return {"detail": "Announcement deleted"}
