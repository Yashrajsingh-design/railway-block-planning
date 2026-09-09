from fastapi import APIRouter

from app.schemas.precheck import (
    PreCheckRequest,
    PreCheckResponse,
)
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
) -> PreCheckResponse:

    return service.run(request)