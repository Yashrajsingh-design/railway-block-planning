from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.block_request import BlockRequest
from app.schemas.requests import (
    BlockRequestCreate,
    BlockRequestResponse,
    RequestStatusUpdate,
)
from app.services.block_request_service import BlockRequestService
from app.services.request_lifecycle_service import RequestLifecycleService


router = APIRouter(
    prefix="/requests",
    tags=["Block Requests"],
)

service = BlockRequestService()
lifecycle_service = RequestLifecycleService()

def to_response(request: BlockRequest) -> BlockRequestResponse:
    return BlockRequestResponse(
        block_request_id=request.block_request_id,
        department_id=request.department_id,
        task_id=request.task_id,
        section_id=request.section_id,
        requested_date=request.requested_date,
        preferred_start=request.preferred_start,
        preferred_end=request.preferred_end,
        minimum_duration_min=request.minimum_duration_min,
        block_type=request.block_type,
        request_status=request.request_status,
        priority_score=request.priority_score,
        authorization_status=request.authorization_status,
        work_description=request.work_description,
        power_block_required=request.power_block_required,
        bundling_candidate=request.bundling_candidate,
    )


@router.get(
    "",
    response_model=list[BlockRequestResponse],
)
def get_block_requests(
    db: Session = Depends(get_db),
) -> list[BlockRequestResponse]:

    requests = db.execute(
        select(BlockRequest)
        .order_by(BlockRequest.block_request_id)
    ).scalars().all()

    return [
        to_response(request)
        for request in requests
    ]


@router.get(
    "/{block_request_id}",
    response_model=BlockRequestResponse,
)
def get_block_request(
    block_request_id: str,
    db: Session = Depends(get_db),
) -> BlockRequestResponse:

    request = db.execute(
        select(BlockRequest).where(
            BlockRequest.block_request_id == block_request_id
        )
    ).scalar_one_or_none()

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block request not found",
        )

    return to_response(request)


@router.post(
    "",
    response_model=BlockRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_block_request(
    data: BlockRequestCreate,
    db: Session = Depends(get_db),
) -> BlockRequestResponse:

    request = service.create_request(
        db=db,
        data=data,
    )

    return to_response(request)

@router.patch(
    "/{block_request_id}/status",
    response_model=BlockRequestResponse,
)
def update_request_status(
    block_request_id: str,
    data: RequestStatusUpdate,
    db: Session = Depends(get_db),
) -> BlockRequestResponse:

    request = lifecycle_service.transition(
        db=db,
        block_request_id=block_request_id,
        new_status=data.status,
    )

    return to_response(request)