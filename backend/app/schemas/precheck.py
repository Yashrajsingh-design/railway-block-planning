from datetime import date, time

from pydantic import BaseModel, Field


class PreCheckRequest(BaseModel):
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

    resource_ids: list[int] = []


class PreCheckIssue(BaseModel):
    code: str
    severity: str
    message: str


class SuggestedWindow(BaseModel):
    start_time: time
    end_time: time
    score: float
    reason: str


class PreCheckResponse(BaseModel):
    status: str
    can_submit: bool

    checks_total: int
    checks_passed: int
    warnings: int
    blocks: int

    issues: list[PreCheckIssue]
    suggested_windows: list[SuggestedWindow]