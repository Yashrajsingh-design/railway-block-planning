from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.block_request import BlockRequest
from app.schemas.requests import BlockRequestCreate, BlockRequestResponse


router = APIRouter(
    prefix="/requests",
    tags=["Block Requests"],
)


@router.post(
    "",
    response_model=BlockRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_block_request(
    request: BlockRequestCreate,
    db: Session = Depends(get_db),
) -> BlockRequestResponse:

    block_request = BlockRequest(
        **request.model_dump(),
        status="SUBMITTED",
    )

    db.add(block_request)
    db.commit()
    db.refresh(block_request)

    return BlockRequestResponse(
        request_id=block_request.request_id,
        status=block_request.status,
        **request.model_dump(),
    )

@router.get("/{request_id}", response_model=BlockRequestResponse)
def get_block_request(
    request_id: int,
    db: Session = Depends(get_db),
) -> BlockRequestResponse:

    request = (
        db.query(BlockRequest)
        .filter(BlockRequest.request_id == request_id)
        .first()
    )

    if request is None:
       

        raise HTTPException(
            status_code=404,
            detail="Block request not found",
        )

    return BlockRequestResponse(
        request_id=request.request_id,
        status=request.status,
        department_id=request.department_id,
        section_id=request.section_id,
        location_id=request.location_id,
        asset_id=request.asset_id,
        maintenance_task_id=request.maintenance_task_id,
        preferred_date=request.preferred_date,
        preferred_start_time=request.preferred_start_time,
        preferred_end_time=request.preferred_end_time,
        minimum_duration_minutes=request.minimum_duration_minutes,
        block_type=request.block_type,
        power_block_required=request.power_block_required,
        work_description=request.work_description,
    )