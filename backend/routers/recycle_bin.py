from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from dependencies import get_current_user, require_role
from models.user import User
from models.recycle_bin import RecycleBin

router = APIRouter(prefix="/api/recycle-bin", tags=["recycle-bin"])


@router.get("")
def list_bin(
    source_module: Optional[str] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(RecycleBin).order_by(RecycleBin.deleted_at.desc())

    if current_user.role != "owner":
        query = query.filter(RecycleBin.branch_id == current_user.branch_id)
    elif branch_id:
        query = query.filter(RecycleBin.branch_id == branch_id)

    if source_module:
        query = query.filter(RecycleBin.source_module == source_module)

    items = query.all()
    result = []
    for item in items:
        deleted_by_user = None
        if item.deleted_by:
            u = db.query(User).filter(User.id == item.deleted_by).first()
            deleted_by_user = f"{u.first_name} {u.last_name}" if u else None
        result.append({
            "id": item.id,
            "source_module": item.source_module,
            "source_id": item.source_id,
            "title": item.title,
            "description": item.description,
            "branch_id": item.branch_id,
            "deleted_by": item.deleted_by,
            "deleted_by_name": deleted_by_user,
            "deleted_at": item.deleted_at,
            "metadata": item.metadata_ or {},
        })
    return result


@router.post("/{item_id}/restore")
def restore_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    item = db.query(RecycleBin).filter(RecycleBin.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.role != "owner" and item.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Cannot restore items from other branches")

    if item.source_module == "proposals":
        from models.proposal import Proposal
        proposal = db.query(Proposal).filter(Proposal.id == item.source_id).first()
        if proposal:
            proposal.deleted_at = None
        else:
            db.delete(item)
            db.commit()
            return {"detail": "Original record already deleted permanently"}

    elif item.source_module == "tracking":
        from models.tracking_sheet import TrackingSheet
        ts = db.query(TrackingSheet).filter(TrackingSheet.id == item.source_id).first()
        if ts:
            ts.is_deleted = 0
            ts.deleted_at = None
        else:
            db.delete(item)
            db.commit()
            return {"detail": "Original record already deleted permanently"}

    elif item.source_module == "announcements":
        from models.announcement import Announcement
        ann = db.query(Announcement).filter(Announcement.id == item.source_id).first()
        if ann:
            ann.deleted_at = None
        else:
            db.delete(item)
            db.commit()
            return {"detail": "Original record already deleted permanently"}

    db.delete(item)
    db.commit()
    return {"detail": "Restored"}


@router.delete("/{item_id}")
def permanent_delete(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    item = db.query(RecycleBin).filter(RecycleBin.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.role != "owner" and item.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Cannot delete items from other branches")

    db.delete(item)
    db.commit()
    return {"detail": "Permanently deleted"}


@router.delete("")
def empty_bin(
    source_module: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin"))
):
    query = db.query(RecycleBin)
    if current_user.role != "owner":
        query = query.filter(RecycleBin.branch_id == current_user.branch_id)
    if source_module:
        query = query.filter(RecycleBin.source_module == source_module)
    count = query.count()
    query.delete(synchronize_session=False)
    db.commit()
    return {"detail": f"Emptied {count} items"}
