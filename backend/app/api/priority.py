from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.priority import PriorityRequest, PriorityResponse
from app.services.priority_engine import PriorityEngine


router = APIRouter(
    prefix="/priority",
    tags=["Priority Engine"],
)

engine = PriorityEngine()


@router.post(
    "/calculate",
    response_model=PriorityResponse,
)
def calculate_priority(
    request: PriorityRequest,
    db: Session = Depends(get_db),
) -> PriorityResponse:

    result = engine.calculate(
        db=db,
        task_id=request.task_id,
        planning_date=request.planning_date,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found",
        )

    return PriorityResponse(**result)