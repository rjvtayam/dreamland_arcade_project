from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func, desc
from typing import Optional
from database import get_db
from schemas.notification import ThreadCreate, MessageCreate
from dependencies import get_current_user, require_role
from models.user import User
from models.notification import MessageThread, MessageParticipant, Message

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    threads = db.query(MessageParticipant.thread_id).filter(
        MessageParticipant.user_id == current_user.id
    ).subquery()

    last_read = db.query(
        MessageParticipant.thread_id,
        MessageParticipant.last_read_at
    ).filter(
        MessageParticipant.user_id == current_user.id
    ).all()
    last_read_map = {t.thread_id: t.last_read_at for t in last_read}

    count = 0
    for thread_id in last_read_map:
        unread = db.query(sql_func.count(Message.id)).filter(
            Message.thread_id == thread_id,
            Message.sender_id != current_user.id
        )
        if last_read_map[thread_id]:
            unread = unread.filter(Message.created_at > last_read_map[thread_id])
        if unread.scalar() > 0:
            count += 1

    return {"count": count}


@router.get("/threads")
def list_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    participations = db.query(MessageParticipant).filter(
        MessageParticipant.user_id == current_user.id
    ).all()
    thread_ids = [p.thread_id for p in participations]
    last_read_map = {p.thread_id: p.last_read_at for p in participations}

    if not thread_ids:
        return []

    threads = db.query(MessageThread).filter(MessageThread.id.in_(thread_ids)).all()
    result = []
    for t in threads:
        last_msg = db.query(Message).filter(Message.thread_id == t.id).order_by(desc(Message.created_at)).first()
        participants = db.query(MessageParticipant).filter(Message.thread_id == t.id).all()
        participant_names = []
        participant_details = []
        for p in participants:
            u = db.query(User).filter(User.id == p.user_id).first()
            if u:
                participant_names.append(f"{u.first_name} {u.last_name}")
                role_label = u.role.capitalize() if u.role else 'Employee'
                if u.role == 'admin':
                    role_label = 'Manager'
                participant_details.append({"id": u.id, "name": f"{u.first_name} {u.last_name}", "role": role_label})

        unread = db.query(sql_func.count(Message.id)).filter(
            Message.thread_id == t.id,
            Message.sender_id != current_user.id
        )
        lr = last_read_map.get(t.id)
        if lr:
            unread = unread.filter(Message.created_at > lr)
        unread_count = unread.scalar() or 0

        creator = db.query(User).filter(User.id == t.created_by).first()
        last_sender = None
        last_sender_role = None
        if last_msg:
            ls = db.query(User).filter(User.id == last_msg.sender_id).first()
            if ls:
                last_sender = f"{ls.first_name} {ls.last_name}"
                last_sender_role = ls.role.capitalize() if ls.role else 'Employee'
                if ls.role == 'admin':
                    last_sender_role = 'Manager'

        result.append({
            "id": t.id,
            "subject": t.subject,
            "branch_id": t.branch_id,
            "created_by": t.created_by,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            "creator_name": f"{creator.first_name} {creator.last_name}" if creator else None,
            "last_message": last_msg.content if last_msg else None,
            "last_message_at": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else None,
            "unread_count": unread_count,
            "participant_names": participant_names,
            "participant_details": participant_details,
            "last_message_sender": last_sender,
            "last_message_sender_role": last_sender_role,
        })

    result.sort(key=lambda x: x["last_message_at"] or x["created_at"] or "", reverse=True)
    return result


@router.post("/threads")
def create_thread(
    data: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    thread = MessageThread(
        subject=data.subject,
        created_by=current_user.id,
        branch_id=current_user.branch_id,
    )
    db.add(thread)
    db.flush()

    all_participants = set(data.participant_ids)
    all_participants.add(current_user.id)
    for uid in all_participants:
        db.add(MessageParticipant(thread_id=thread.id, user_id=uid))

    msg = Message(
        thread_id=thread.id,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(thread)
    return {"id": thread.id, "detail": "Thread created"}


@router.get("/threads/{thread_id}")
def get_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    participant = db.query(MessageParticipant).filter(
        MessageParticipant.thread_id == thread_id,
        MessageParticipant.user_id == current_user.id
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    thread = db.query(MessageThread).filter(MessageThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = db.query(Message).filter(Message.thread_id == thread_id).order_by(Message.created_at.asc()).all()
    participants = db.query(MessageParticipant).filter(MessageParticipant.thread_id == thread_id).all()
    participant_names = []
    for p in participants:
        u = db.query(User).filter(User.id == p.user_id).first()
        if u:
            participant_names.append({"id": u.id, "name": f"{u.first_name} {u.last_name}"})

    participant.last_read_at = sql_func.now()
    db.commit()

    result_messages = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        sender_role = None
        if sender:
            sender_role = sender.role.capitalize() if sender.role else 'Employee'
            if sender.role == 'admin':
                sender_role = 'Manager'
        result_messages.append({
            "id": m.id,
            "thread_id": m.thread_id,
            "sender_id": m.sender_id,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "sender_name": f"{sender.first_name} {sender.last_name}" if sender else None,
            "sender_role": sender_role,
        })

    return {
        "id": thread.id,
        "subject": thread.subject,
        "created_by": thread.created_by,
        "created_at": thread.created_at.isoformat() if thread.created_at else None,
        "participants": participant_names,
        "messages": result_messages,
    }


@router.post("/threads/{thread_id}/messages")
def send_message(
    thread_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    participant = db.query(MessageParticipant).filter(
        MessageParticipant.thread_id == thread_id,
        MessageParticipant.user_id == current_user.id
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")

    msg = Message(
        thread_id=thread_id,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(msg)

    thread = db.query(MessageThread).filter(MessageThread.id == thread_id).first()
    if thread:
        thread.updated_at = sql_func.now()

    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "detail": "Message sent"}
