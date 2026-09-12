from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.optimization import OptimizationRequest
from app.services.plan_comparison import PlanComparisonService


router = APIRouter(
    prefix="/api/v1/plan",
    tags=["Plan Comparison"],
)


@router.post("/compare")
def compare_plans(
    request: OptimizationRequest,
    db: Session = Depends(get_db),
):
    service = PlanComparisonService()

    return service.compare(
        db=db,
        planning_date=request.planning_date,
        block_type=request.block_type,
    )
