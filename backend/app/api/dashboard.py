from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard_service import DashboardService


router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
)
def get_dashboard_overview(
    section_id: str = Query(
        default="S02",
        min_length=1,
    ),
    planning_date: date = Query(
        default=date(2026, 9, 2),
    ),
    block_type: str = Query(
        default="TRAFFIC",
    ),
    db: Session = Depends(get_db),
):
    service = DashboardService()

    return service.get_overview(
        db=db,
        section_id=section_id,
        planning_date=planning_date,
        block_type=block_type,
    )