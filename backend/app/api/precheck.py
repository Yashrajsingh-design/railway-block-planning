from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.precheck import PreCheckRequest, PreCheckResponse
from app.services.smart_precheck import SmartPreCheckService


router = APIRouter(
    prefix="/precheck",
    tags=["Smart Pre-Check"],
)

service = SmartPreCheckService()


@router.post(
    "",
    response_model=PreCheckResponse,
)
def run_precheck(
    request: PreCheckRequest,
    db: Session = Depends(get_db),
) -> PreCheckResponse:

    return service.run(
        request=request,
        db=db,
    )