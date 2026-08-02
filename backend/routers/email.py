from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from database import get_db
from dependencies import get_current_user, require_role
from models.user import User
from models.email import Email
from services.email_service import send_smtp_email, fetch_new_emails

router = APIRouter(prefix="/api/emails", tags=["emails"])


class EmailSend(BaseModel):
    to: str
    cc: Optional[str] = None
    subject: str = ""
    body: str = ""
    in_reply_to: Optional[int] = None


class EmailResponse(BaseModel):
    id: int
    branch_id: Optional[int] = None
    sender_id: Optional[int] = None
    sender_name: Optional[str] = None
    from_email: str
    to_email: str
    cc_email: Optional[str] = None
    subject: str
    body: str
    body_text: Optional[str] = None
    direction: str
    status: str
    in_reply_to: Optional[int] = None
    created_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    is_deleted: bool = False

    class Config:
        from_attributes = True


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(func.count(Email.id)).filter(
        Email.direction == "inbound",
        Email.status != "read",
        Email.is_deleted == False,
    ).scalar()
    return {"count": count}


@router.get("/")
def list_emails(
    folder: str = Query("inbox", regex="^(inbox|sent|all|unread|trash)$"),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if folder == "trash":
        query = db.query(Email).filter(Email.is_deleted == True)
    else:
        query = db.query(Email).filter(Email.is_deleted == False)

    if folder == "inbox":
        query = query.filter(Email.direction == "inbound")
    elif folder == "sent":
        query = query.filter(Email.direction == "outbound", Email.sender_id == current_user.id)
    elif folder == "unread":
        query = query.filter(Email.direction == "inbound", Email.status != "read")

    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(
            Email.subject.ilike(search_term),
            Email.from_email.ilike(search_term),
            Email.to_email.ilike(search_term),
            Email.body_text.ilike(search_term),
        ))

    total = query.count()
    emails = query.order_by(desc(Email.created_at)).offset(skip).limit(limit).all()

    sender_ids = set()
    for e in emails:
        if e.sender_id:
            sender_ids.add(e.sender_id)

    sender_map = {}
    if sender_ids:
        users = db.query(User).filter(User.id.in_(sender_ids)).all()
        for u in users:
            sender_map[u.id] = f"{u.first_name} {u.last_name}"

    result = []
    for e in emails:
        result.append({
            "id": e.id,
            "branch_id": e.branch_id,
            "sender_id": e.sender_id,
            "sender_name": sender_map.get(e.sender_id, None),
            "from_email": e.from_email,
            "to_email": e.to_email,
            "cc_email": e.cc_email,
            "subject": e.subject,
            "body": e.body,
            "body_text": e.body_text,
            "direction": e.direction,
            "status": e.status,
            "in_reply_to": e.in_reply_to,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "read_at": e.read_at.isoformat() if e.read_at else None,
            "is_deleted": e.is_deleted,
        })

    return {"emails": result, "total": total}


@router.get("/{email_id}")
def get_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    em = db.query(Email).filter(Email.id == email_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Email not found")

    if em.direction == "inbound" and em.status != "read":
        em.status = "read"
        em.read_at = datetime.now(timezone.utc)
        db.commit()

    sender_name = None
    if em.sender_id:
        user = db.query(User).filter(User.id == em.sender_id).first()
        if user:
            sender_name = f"{user.first_name} {user.last_name}"

    reply_chain = []
    if em.in_reply_to:
        parent = db.query(Email).filter(Email.id == em.in_reply_to).first()
        if parent:
            reply_chain.insert(0, {
                "id": parent.id,
                "subject": parent.subject,
                "from_email": parent.from_email,
                "created_at": parent.created_at.isoformat() if parent.created_at else None,
            })

    children = db.query(Email).filter(Email.in_reply_to == em.id, Email.is_deleted == False).order_by(Email.created_at).all()
    for child in children:
        reply_chain.append({
            "id": child.id,
            "subject": child.subject,
            "from_email": child.from_email,
            "created_at": child.created_at.isoformat() if child.created_at else None,
        })

    return {
        "id": em.id,
        "branch_id": em.branch_id,
        "sender_id": em.sender_id,
        "sender_name": sender_name,
        "from_email": em.from_email,
        "to_email": em.to_email,
        "cc_email": em.cc_email,
        "subject": em.subject,
        "body": em.body,
        "body_text": em.body_text,
        "direction": em.direction,
        "status": em.status,
        "in_reply_to": em.in_reply_to,
        "created_at": em.created_at.isoformat() if em.created_at else None,
        "read_at": em.read_at.isoformat() if em.read_at else None,
        "reply_chain": reply_chain,
    }


@router.post("/send")
def send_email(
    data: EmailSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    result = send_smtp_email(
        to_email=data.to,
        subject=data.subject,
        body=data.body,
        cc_email=data.cc,
        in_reply_to_id=data.in_reply_to,
        db=db,
        sender_id=current_user.id,
        branch_id=current_user.branch_id,
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to send email")
    return {
        "id": result.id,
        "status": result.status,
        "message": "Email sent successfully" if result.status == "sent" else "Email saved (send failed)",
    }


@router.post("/{email_id}/reply")
def reply_email(
    email_id: int,
    data: EmailSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    original = db.query(Email).filter(Email.id == email_id, Email.is_deleted == False).first()
    if not original:
        raise HTTPException(status_code=404, detail="Original email not found")

    reply_to = data.to or original.from_email
    subject = data.subject
    if not subject.lower().startswith("re:"):
        subject = f"Re: {original.subject}"

    result = send_smtp_email(
        to_email=reply_to,
        subject=subject,
        body=data.body,
        cc_email=data.cc,
        in_reply_to_id=email_id,
        db=db,
        sender_id=current_user.id,
        branch_id=current_user.branch_id,
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to send reply")
    return {
        "id": result.id,
        "status": result.status,
        "message": "Reply sent successfully" if result.status == "sent" else "Reply saved (send failed)",
    }


@router.put("/{email_id}/read")
def mark_read(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    em = db.query(Email).filter(Email.id == email_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Email not found")
    em.status = "read"
    em.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Marked as read"}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Email).filter(
        Email.direction == "inbound",
        Email.status != "read",
        Email.is_deleted == False,
    ).update({"status": "read", "read_at": datetime.now(timezone.utc)})
    db.commit()
    return {"message": "All emails marked as read"}


@router.put("/{email_id}/trash")
def trash_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    em = db.query(Email).filter(Email.id == email_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Email not found")
    em.is_deleted = True
    em.status = "trash"
    db.commit()
    return {"message": "Email moved to trash"}


@router.put("/{email_id}/restore")
def restore_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    em = db.query(Email).filter(Email.id == email_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Email not found")
    em.is_deleted = False
    em.status = "received" if em.direction == "inbound" else "sent"
    db.commit()
    return {"message": "Email restored"}


@router.delete("/{email_id}")
def delete_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    em = db.query(Email).filter(Email.id == email_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Email not found")
    em.is_deleted = True
    db.commit()
    return {"message": "Email deleted"}


@router.post("/check")
def check_emails(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    new_emails = fetch_new_emails(db)
    return {
        "message": f"Checked. Found {len(new_emails)} new email(s).",
        "count": len(new_emails),
    }
