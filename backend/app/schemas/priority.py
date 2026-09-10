from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class PriorityRequest(BaseModel):
    task_id: str
    planning_date: date


class PriorityResponse(BaseModel):
    task_id: str
    priority_score: Decimal

    asset_criticality_score: float
    defect_severity_score: float
    urgency_score: float
    existing_task_priority: float

    priority_level: str