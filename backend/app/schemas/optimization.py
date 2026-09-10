from datetime import date, time

from pydantic import BaseModel


class OptimizationRequest(BaseModel):
    planning_date: date
    block_type: str


class OptimizationAssignment(BaseModel):
    task_id: str
    section_id: str
    window_id: str
    start_time: time
    end_time: time
    duration_min: int
    priority_score: float
    resource_id: str


class OptimizationResponse(BaseModel):
    status: str
    planning_date: date
    block_type: str
    candidate_pairs: int
    assignments: list[OptimizationAssignment]
    assigned_count: int
    total_priority: float