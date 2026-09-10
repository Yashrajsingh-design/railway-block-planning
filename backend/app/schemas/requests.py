from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class BlockRequestCreate(BaseModel):
    department_id: str
    task_id: str
    section_id: str

    requested_date: date

    preferred_start: str = Field(
        min_length=4,
        max_length=5,
    )

    preferred_end: str = Field(
        min_length=4,
        max_length=5,
    )

    minimum_duration_min: int = Field(
        gt=0,
        le=1440,
    )

    block_type: str = Field(
        min_length=1,
        max_length=50,
    )

    work_description: str = Field(
        min_length=5,
        max_length=2000,
    )

    power_block_required: bool = False
    bundling_candidate: bool = False


class BlockRequestResponse(BaseModel):
    block_request_id: str

    department_id: str | None
    task_id: str | None
    section_id: str | None

    requested_date: date | None

    preferred_start: str | None
    preferred_end: str | None

    minimum_duration_min: int | None

    block_type: str | None

    request_status: str | None
    priority_score: Decimal | None
    authorization_status: str | None

    work_description: str | None

    power_block_required: bool | None
    bundling_candidate: bool | None       

class RequestStatusUpdate(BaseModel):
    status: str = Field(
        min_length=1,
        max_length=30,
    )