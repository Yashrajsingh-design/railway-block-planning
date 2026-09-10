from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResponse,
)
from app.services.optimization_engine import OptimizationEngine


router = APIRouter(
    prefix="/optimization",
    tags=["Optimization Engine"],
)

engine = OptimizationEngine()


@router.post(
    "/run",
    response_model=OptimizationResponse,
)
def run_optimization(
    request: OptimizationRequest,
    db: Session = Depends(get_db),
) -> OptimizationResponse:

    result = engine.optimize(
        db=db,
        planning_date=request.planning_date,
        block_type=request.block_type,
    )

    return OptimizationResponse(**result)