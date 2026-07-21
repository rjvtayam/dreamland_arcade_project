from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from typing import Optional
import random
import string

from database import get_db
from schemas.member import MemberCreate, MemberUpdate, TransactionCreate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.member import Member, MemberTransaction

router = APIRouter(prefix="/api/members", tags=["members"])

TIER_THRESHOLDS = {"silver": 500, "gold": 2000, "black": 5000}
TIER_BONUS = {"silver": 0.05, "gold": 0.10, "black": 0.15}
TIER_ORDER = {"none": 0, "silver": 1, "gold": 2, "black": 3}


def generate_card_number():
    return "DLA-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def calc_tier(points):
    if points >= 5000:
        return "black"
    elif points >= 2000:
        return "gold"
    elif points >= 500:
        return "silver"
    return "none"


def next_tier_info(points):
    if points < 500:
        return "Silver", 500 - points
    elif points < 2000:
        return "Gold", 2000 - points
    elif points < 5000:
        return "Black", 5000 - points
    return None, 0


def build_response(m, db):
    branch = db.query(Branch).filter(Branch.id == m.branch_id).first() if m.branch_id else None
    nt, ptnt = next_tier_info(int(m.total_points or 0))
    return {
        "id": m.id,
        "card_number": m.card_number,
        "card_tier": m.card_tier,
        "first_name": m.first_name,
        "last_name": m.last_name,
        "phone": m.phone,
        "email": m.email,
        "total_spent": float(m.total_spent or 0),
        "total_points": int(m.total_points or 0),
        "bonus_tokens_earned": int(m.bonus_tokens_earned or 0),
        "total_visits": int(m.total_visits or 0),
        "branch_id": m.branch_id,
        "branch_name": branch.name if branch else None,
        "issued_date": m.issued_date.isoformat() if m.issued_date else None,
        "expiry_date": m.expiry_date.isoformat() if m.expiry_date else None,
        "is_active": m.is_active,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "next_tier": nt,
        "points_to_next_tier": ptnt
    }


@router.get("")
def list_members(
    branch_id: Optional[int] = None,
    tier: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    query = db.query(Member)
    if branch_id:
        query = query.filter(Member.branch_id == branch_id)
    if tier:
        query = query.filter(Member.card_tier == tier)
    if search:
        q = f"%{search}%"
        query = query.filter(
            (Member.first_name.ilike(q)) | (Member.last_name.ilike(q)) | (Member.card_number.ilike(q))
        )

    members = query.order_by(Member.created_at.desc()).all()
    return [build_response(m, db) for m in members]


@router.get("/{member_id}")
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    m = db.query(Member).filter(Member.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    return build_response(m, db)


@router.get("/{member_id}/transactions")
def get_member_transactions(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    txns = db.query(MemberTransaction).filter(MemberTransaction.member_id == member_id).order_by(MemberTransaction.created_at.desc()).all()
    return [{
        "id": t.id,
        "member_id": t.member_id,
        "branch_id": t.branch_id,
        "amount": float(t.amount or 0),
        "points_earned": t.points_earned,
        "bonus_tokens": t.bonus_tokens,
        "description": t.description,
        "created_at": t.created_at.isoformat() if t.created_at else None
    } for t in txns]


@router.post("")
def create_member(
    data: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    branch_id = data.branch_id or current_user.branch_id
    m = Member(
        card_number=generate_card_number(),
        card_tier="none",
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        branch_id=branch_id,
        total_spent=0,
        total_points=0,
        bonus_tokens_earned=0,
        total_visits=0,
        is_active=True
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return build_response(m, db)


@router.put("/{member_id}")
def update_member(
    member_id: int,
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    m = db.query(Member).filter(Member.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    if data.first_name is not None: m.first_name = data.first_name
    if data.last_name is not None: m.last_name = data.last_name
    if data.phone is not None: m.phone = data.phone
    if data.email is not None: m.email = data.email
    if data.is_active is not None: m.is_active = data.is_active
    db.commit()
    db.refresh(m)
    return build_response(m, db)


@router.post("/{member_id}/purchase")
def record_purchase(
    member_id: int,
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    m = db.query(Member).filter(Member.id == member_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")

    points = int(data.amount)
    m.total_points = int(m.total_points or 0) + points
    m.total_spent = float(m.total_spent or 0) + data.amount

    new_tier = calc_tier(int(m.total_points))
    old_tier = m.card_tier
    m.card_tier = new_tier

    bonus_pct = TIER_BONUS.get(new_tier, 0)
    bonus_tokens = int(data.amount / 5 * bonus_pct)
    m.bonus_tokens_earned = int(m.bonus_tokens_earned or 0) + bonus_tokens

    tx = MemberTransaction(
        member_id=member_id,
        branch_id=current_user.branch_id,
        amount=data.amount,
        points_earned=points,
        bonus_tokens=bonus_tokens,
        description=data.description,
        created_by=current_user.id
    )
    db.add(tx)
    db.commit()
    db.refresh(m)

    result = build_response(m, db)
    result["new_purchase"] = {
        "points_earned": points,
        "bonus_tokens": bonus_tokens,
        "tier_upgraded": new_tier != old_tier and TIER_ORDER.get(new_tier, 0) > TIER_ORDER.get(old_tier, 0)
    }
    return result


@router.post("/lookup")
def lookup_member(
    card_number: str = "",
    phone: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    m = None
    if card_number:
        m = db.query(Member).filter(Member.card_number == card_number).first()
    elif phone:
        m = db.query(Member).filter(Member.phone == phone).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    return build_response(m, db)


@router.get("/stats/summary")
def member_stats(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    if current_user.role != "owner":
        branch_id = current_user.branch_id

    query = db.query(Member)
    if branch_id:
        query = query.filter(Member.branch_id == branch_id)

    total = query.count()
    silver = query.filter(Member.card_tier == "silver").count()
    gold = query.filter(Member.card_tier == "gold").count()
    black = query.filter(Member.card_tier == "black").count()
    active = query.filter(Member.is_active == True).count()

    total_spent = db.query(
        sql_func.coalesce(sql_func.sum(Member.total_spent), 0)
    )
    if branch_id:
        total_spent = total_spent.filter(Member.branch_id == branch_id)
    total_spent = total_spent.scalar()

    return {
        "total_members": total,
        "active_members": active,
        "silver": silver,
        "gold": gold,
        "black": black,
        "total_spent": float(total_spent)
    }
