from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit_event import AuditEvent
from app.models.plan import Plan


router = APIRouter()


@router.get("/{plan_id}/audit")
def get_plan_audit(
    plan_id: str,
    db: Session = Depends(get_db),
):
    plan = (
        db.query(Plan)
        .filter(Plan.plan_id == plan_id)
        .first()
    )

    if plan is None:
        raise HTTPException(
            status_code=404,
            detail=f"Plan not found: {plan_id}",
        )

    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.plan_id == plan_id)
        .order_by(AuditEvent.created_at.asc())
        .all()
    )

    return {
        "plan_id": plan.plan_id,
        "planning_date": plan.planning_date,
        "current_status": plan.status,
        "event_count": len(events),
        "events": [
            {
                "audit_event_id": event.audit_event_id,
                "event_type": event.event_type,
                "from_status": event.from_status,
                "to_status": event.to_status,
                "message": event.message,
                "actor": event.actor,
                "created_at": event.created_at,
            }
            for event in events
        ],
    }