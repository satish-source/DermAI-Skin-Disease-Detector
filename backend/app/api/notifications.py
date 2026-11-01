from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Notification
from app.schemas.schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notification & Alert System"])

@router.get("", response_model=list[NotificationOut])
def get_notifications(unread_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(Notification)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(50).all()

@router.post("/mark-read/{notification_id}")
def mark_as_read(notification_id: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).update({Notification.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read"}

