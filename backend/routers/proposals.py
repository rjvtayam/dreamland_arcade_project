from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import Optional

from database import get_db
from schemas.proposal import ProposalCreate, ProposalUpdate
from dependencies import get_current_user, require_role
from models.user import User
from models.branch import Branch
from models.proposal import Proposal
from models.recycle_bin import RecycleBin

router = APIRouter(prefix="/api/proposals", tags=["proposals"])


@router.get("")
def list_proposals(
    branch_id: Optional[int] = None,
    area: Optional[str] = None,
    proposal_month: Optional[str] = None,
    show_deleted: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(Proposal)

    if show_deleted:
        query = query.filter(Proposal.deleted_at.isnot(None))
    else:
        query = query.filter(Proposal.deleted_at.is_(None))

    if current_user.role != "owner":
        query = query.filter(Proposal.branch_id == current_user.branch_id)
    elif branch_id:
        query = query.filter(Proposal.branch_id == branch_id)

    if area:
        query = query.filter(Proposal.area == area)

    if proposal_month:
        query = query.filter(Proposal.proposal_month == proposal_month)

    proposals = query.order_by(Proposal.created_at.desc()).all()
    result = []
    for p in proposals:
        creator = db.query(User).filter(User.id == p.created_by).first()
        branch = db.query(Branch).filter(Branch.id == p.branch_id).first()
        result.append({
            "id": p.id,
            "branch_id": p.branch_id,
            "created_by": p.created_by,
            "area": p.area,
            "title": p.title,
            "description": p.description,
            "proposal_month": p.proposal_month,
            "status": p.status,
            "owner_comment": p.owner_comment,
            "amount": p.amount,
            "deleted_at": p.deleted_at.isoformat() if p.deleted_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "creator_name": f"{creator.first_name} {creator.last_name}" if creator else None,
            "creator_role": creator.role if creator else None,
            "branch_name": branch.name if branch else None,
        })
    return result


@router.post("")
def create_proposal(
    data: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    proposal = Proposal(
        branch_id=data.branch_id,
        created_by=current_user.id,
        area=data.area or "Arcade",
        title=data.title,
        description=data.description,
        proposal_month=data.proposal_month,
        amount=data.amount,
        status="draft",
    )
    db.add(proposal)
    db.commit()
    proposal_id = proposal.id
    proposal_status = proposal.status
    return {"id": proposal_id, "status": proposal_status}


@router.put("/{proposal_id}")
def update_proposal(
    proposal_id: int,
    data: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.deleted_at.is_(None)
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    if current_user.role == "admin" and proposal.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own proposals")

    if current_user.role == "admin" and proposal.status not in ("draft", "declined"):
        raise HTTPException(status_code=400, detail="Cannot edit a submitted/approved proposal")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(proposal, key, value)

    if current_user.role == "admin" and proposal.status == "declined":
        proposal.status = "draft"
        proposal.owner_comment = None

    db.commit()
    proposal_id = proposal.id
    proposal_status = proposal.status
    return {"id": proposal_id, "status": proposal_status}


@router.post("/{proposal_id}/submit")
def submit_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.deleted_at.is_(None)
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.created_by != current_user.id and current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Not authorized")
    if proposal.status not in ("draft", "declined"):
        raise HTTPException(status_code=400, detail="Only draft/declined proposals can be submitted")

    proposal.status = "submitted"
    proposal.owner_comment = None
    db.commit()
    return {"id": proposal.id, "status": "submitted"}


@router.post("/{proposal_id}/approve")
def approve_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.deleted_at.is_(None)
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.status != "submitted":
        raise HTTPException(status_code=400, detail="Only submitted proposals can be approved")

    proposal.status = "approved"
    db.commit()
    return {"id": proposal.id, "status": "approved"}


@router.post("/{proposal_id}/decline")
def decline_proposal(
    proposal_id: int,
    data: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.deleted_at.is_(None)
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.status != "submitted":
        raise HTTPException(status_code=400, detail="Only submitted proposals can be declined")

    proposal.status = "declined"
    proposal.owner_comment = data.owner_comment
    db.commit()
    return {"id": proposal.id, "status": "declined"}


@router.post("/{proposal_id}/soft-delete")
def soft_delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.deleted_at.is_(None)
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if current_user.role == "admin" and proposal.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if proposal.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot delete approved proposals")

    proposal.deleted_at = func.now()

    bin_entry = RecycleBin(
        source_module="proposals",
        source_id=proposal.id,
        title=proposal.title,
        description=(proposal.description or "")[:500],
        branch_id=proposal.branch_id,
        deleted_by=current_user.id,
        metadata={"status": proposal.status, "area": proposal.area, "amount": proposal.amount, "proposal_month": proposal.proposal_month},
    )
    db.add(bin_entry)
    db.commit()
    return {"detail": "Moved to trash"}


@router.post("/{proposal_id}/restore")
def restore_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id,
        Proposal.deleted_at.isnot(None)
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Deleted proposal not found")

    if current_user.role != "owner" and proposal.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Cannot restore proposals from other branches")

    proposal.deleted_at = None
    db.query(RecycleBin).filter(
        RecycleBin.source_module == "proposals",
        RecycleBin.source_id == proposal_id
    ).delete()
    db.commit()
    return {"detail": "Restored"}


@router.delete("/{proposal_id}")
def hard_delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner"))
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot delete approved proposals")

    db.query(RecycleBin).filter(
        RecycleBin.source_module == "proposals",
        RecycleBin.source_id == proposal_id
    ).delete()
    db.delete(proposal)
    db.commit()
    return {"detail": "Permanently deleted"}
