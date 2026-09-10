from datetime import date

from pydantic import BaseModel


class DashboardPlanningHealth(BaseModel):
    tasks_covered: int
    total_tasks: int
    coverage_percent: float
    critical_coverage_percent: float
    overdue_reduction_percent: float


class DashboardOverviewResponse(BaseModel):
    section_id: str
    planning_date: date
    block_type: str

    critical_maintenance: int
    overdue_tasks: int
    clear_windows: int
    block_requests: int
    allocated_plan: int
    restrictions: int

    optimizer_status: str
    candidate_pairs: int
    total_priority: float

    planning_health: DashboardPlanningHealth