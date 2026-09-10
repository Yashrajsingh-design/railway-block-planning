from datetime import date, time

from pydantic import BaseModel


class CandidateWindowRequest(BaseModel):
    task_id: str
    planning_date: date
    block_type: str


class CandidateWindow(BaseModel):
    task_id: str
    section_id: str
    window_id: str
    start_time: time
    end_time: time
    duration_min: int
    window_class: str | None
    score: float


class CandidateWindowResponse(BaseModel):
    task_id: str
    candidate_count: int
    candidates: list[CandidateWindow]