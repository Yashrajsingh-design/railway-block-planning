from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.optimization import OptimizationRequest
from app.services.optimization_engine import OptimizationEngine
from app.services.plan_explanation import PlanExplanationService


router = APIRouter(
    prefix="/api/v1/plan",
    tags=["Plan Analysis"],
)


@router.post("/explanations")
def get_plan_explanations(
    request: OptimizationRequest,
    db: Session = Depends(get_db),
):
    optimizer = OptimizationEngine()

    result = optimizer.optimize(
        db=db,
        planning_date=request.planning_date,
        block_type=request.block_type,
    )

    assigned_task_ids = {
        assignment["task_id"]
        for assignment in result["assignments"]
    }

    service = PlanExplanationService()

    explanations = service.explain_unscheduled_tasks(
        db=db,
        planning_date=request.planning_date,
        block_type=request.block_type,
        assigned_task_ids=assigned_task_ids,
    )

    return {
    "planning_date": request.planning_date,
    "block_type": request.block_type,
    "status": result["status"],
    "candidate_pairs": result["candidate_pairs"],
    "assigned_count": result["assigned_count"],
    "total_priority": result["total_priority"],
    "assignments": result["assignments"],
    "unscheduled_count": len(explanations),
    "explanations": explanations,
}