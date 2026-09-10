from datetime import date, time

from pydantic import BaseModel, Field


class PreCheckRequest(BaseModel):
    department_id: str
    section_id: str

    location_id: str | None = None
    asset_id: str | None = None
    maintenance_task_id: str | None = None

    preferred_date: date
    preferred_start_time: time
    preferred_end_time: time

    minimum_duration_minutes: int = Field(
        gt=0,
        le=1440,
    )

    block_type: str = Field(
        min_length=1,
        max_length=50,
    )

    power_block_required: bool = False

    resource_ids: list[str] = []


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