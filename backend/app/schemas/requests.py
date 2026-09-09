from datetime import date, time

from pydantic import BaseModel, Field


class BlockRequestCreate(BaseModel):
    department_id: int
    section_id: int
    location_id: int | None = None
    asset_id: int | None = None

    maintenance_task_id: int | None = None

    preferred_date: date
    preferred_start_time: time
    preferred_end_time: time

    minimum_duration_minutes: int = Field(
        gt=0,
        le=1440,
    )

    block_type: str
    power_block_required: bool = False

    work_description: str = Field(
        min_length=5,
        max_length=1000,
    )


class BlockRequestResponse(BlockRequestCreate):
    request_id: int
    status: str