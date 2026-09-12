from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.plan_lifecycle_service import PlanLifecycleService


router = APIRouter()


class PlanStatusUpdate(BaseModel):
    status: str


@router.patch("/{plan_id}/status")
def update_plan_status(
    plan_id: str,
    data: PlanStatusUpdate,
    db: Session = Depends(get_db),
):
    service = PlanLifecycleService()

    try:
        plan = service.transition(
            db=db,
            plan_id=plan_id,
            new_status=data.status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return {
        "plan_id": plan.plan_id,
        "planning_date": plan.planning_date,
        "block_type": plan.block_type,
        "status": plan.status,
        "optimizer_status": plan.optimizer_status,
        "assigned_count": plan.assigned_count,
        "total_priority": float(plan.total_priority),
    }