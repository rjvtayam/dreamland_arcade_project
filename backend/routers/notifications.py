from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import Optional
from database import get_db
from schemas.notification import NotificationCreate, NotificationBroadcast
from dependencies import get_current_user, require_role
from models.user import User
from models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(sql_func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).scalar()
    return {"count": count}


@router.get("")
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for n in notifications:
        sender_name = None
        if n.created_by:
            sender = db.query(User).filter(User.id == n.created_by).first()
            if sender:
                sender_name = f"{sender.first_name} {sender.last_name}"
        result.append({
            "id": n.id,
            "user_id": n.user_id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "link": n.link,
            "created_by": n.created_by,
            "branch_id": n.branch_id,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "sender_name": sender_name,
        })
    return result


@router.post("")
def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    notification = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        type=data.type,
        link=data.link,
        created_by=current_user.id,
        branch_id=current_user.branch_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return {"id": notification.id, "detail": "Notification created"}


@router.post("/broadcast")
def broadcast_notification(
    data: NotificationBroadcast,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(User).filter(User.is_active == True)
    if data.branch_id:
        query = query.filter(User.branch_id == data.branch_id)
    elif current_user.role == "admin":
        query = query.filter(User.branch_id == current_user.branch_id)

    users = query.all()
    count = 0
    for user in users:
        notification = Notification(
            user_id=user.id,
            title=data.title,
            message=data.message,
            type=data.type,
            link=data.link,
            created_by=current_user.id,
            branch_id=data.branch_id or current_user.branch_id,
        )
        db.add(notification)
        count += 1

    db.commit()
    return {"detail": f"Broadcast to {count} users"}


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"detail": "Marked as read"}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"detail": "All marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notification)
    db.commit()
    return {"detail": "Notification deleted"}
