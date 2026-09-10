from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.candidate_window import (
    CandidateWindowRequest,
    CandidateWindowResponse,
)
from app.services.candidate_window_generator import (
    CandidateWindowGenerator,
)


router = APIRouter(
    prefix="/candidate-windows",
    tags=["Candidate Windows"],
)

generator = CandidateWindowGenerator()


@router.post(
    "/generate",
    response_model=CandidateWindowResponse,
)
def generate_candidate_windows(
    request: CandidateWindowRequest,
    db: Session = Depends(get_db),
) -> CandidateWindowResponse:

    candidates = generator.generate(
        db=db,
        task_id=request.task_id,
        planning_date=request.planning_date,
        block_type=request.block_type,
    )

    if candidates is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance task not found",
        )

    return CandidateWindowResponse(
        task_id=request.task_id,
        candidate_count=len(candidates),
        candidates=candidates,
    )