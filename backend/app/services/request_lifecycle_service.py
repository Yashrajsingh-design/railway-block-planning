from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest


ALLOWED_TRANSITIONS = {
    "DRAFT": {"VALIDATED", "CANCELLED"},
    "VALIDATED": {"QUEUED", "CANCELLED"},
    "QUEUED": {"OPTIMIZED", "CANCELLED"},
    "OPTIMIZED": {"REVIEW", "CANCELLED"},
    "REVIEW": {"APPROVED", "CANCELLED"},
    "APPROVED": set(),
    "CANCELLED": set(),
}


class RequestLifecycleService:

    def transition(
        self,
        db: Session,
        block_request_id: str,
        new_status: str,
    ) -> BlockRequest:

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

        current_status = request.request_status

        if current_status not in ALLOWED_TRANSITIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown current request status: {current_status}",
            )

        allowed_statuses = ALLOWED_TRANSITIONS[current_status]

        if new_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid lifecycle transition: "
                    f"{current_status} -> {new_status}"
                ),
            )

        request.request_status = new_status

        db.commit()
        db.refresh(request)

        return request