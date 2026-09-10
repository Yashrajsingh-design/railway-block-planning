from datetime import date, datetime, time

from sqlalchemy import select, and_, or_
from sqlalchemy.orm import Session

from app.models.maintenance_task import MaintenanceTask
from app.models.coa_window import CoaWindow
from app.models.block_request import BlockRequest
from app.models.restriction import Restriction
from app.models.train_event import TrainEvent
from app.services.optimization_engine import OptimizationEngine


class DashboardService:

    def get_overview(
        self,
        db: Session,
        section_id: str,
        planning_date: date,
        block_type: str,
    ):

        # ---------------------------------------------------------
        # 1. Maintenance tasks
        # ---------------------------------------------------------

        tasks = db.execute(
            select(MaintenanceTask).where(
                MaintenanceTask.section_id == section_id
            )
        ).scalars().all()

        eligible_tasks = [
            task
            for task in tasks
            if task.status in {
                "OPEN",
                "PLANNED",
                "EMERGENCY",
                "OVERDUE",
            }
        ]

        critical_maintenance = sum(
            1
            for task in eligible_tasks
            if float(task.priority_score or 0) >= 80
        )

        overdue_tasks = sum(
            1
            for task in eligible_tasks
            if task.status == "OVERDUE"
        )

        # ---------------------------------------------------------
        # 2. Available COA windows
        # ---------------------------------------------------------

        windows = db.execute(
            select(CoaWindow).where(
                and_(
                    CoaWindow.section_id == section_id,
                    CoaWindow.date == planning_date,
                    CoaWindow.status == "AVAILABLE",
                    CoaWindow.block_type == block_type,
                )
            )
        ).scalars().all()

        clear_windows = sum(
            1
            for window in windows
            if (window.duration_min or 0) >= 120
        )

        # ---------------------------------------------------------
        # 3. Existing block requests
        # ---------------------------------------------------------

        requests = db.execute(
            select(BlockRequest).where(
                and_(
                    BlockRequest.section_id == section_id,
                    BlockRequest.requested_date == planning_date,
                    BlockRequest.request_status.notin_(
                        ["CANCELLED", "REJECTED"]
                    ),
                )
            )
        ).scalars().all()

        block_requests = len(requests)

        # ---------------------------------------------------------
        # 4. Restrictions
        # ---------------------------------------------------------

        restrictions = db.execute(
            select(Restriction).where(
                and_(
                    Restriction.section_id == section_id,
                    Restriction.date == planning_date,
                )
            )
        ).scalars().all()

        restriction_count = len(restrictions)

        # ---------------------------------------------------------
        # 5. Run optimizer
        # ---------------------------------------------------------

        optimizer = OptimizationEngine()

        optimization_result = optimizer.optimize(
            db=db,
            planning_date=planning_date,
            block_type=block_type,
        )

        allocated_plan = optimization_result.get(
            "assigned_count",
            0,
        )

        candidate_pairs = optimization_result.get(
            "candidate_pairs",
            0,
        )

        total_priority = float(
            optimization_result.get(
                "total_priority",
                0,
            )
        )

        optimizer_status = optimization_result.get(
            "status",
            "UNKNOWN",
        )

        # ---------------------------------------------------------
        # 6. Planning health
        # ---------------------------------------------------------

        total_tasks = len(eligible_tasks)

        if total_tasks:
            coverage_percent = round(
                (allocated_plan / total_tasks) * 100,
                1,
            )
        else:
            coverage_percent = 0.0

        critical_tasks = [
            task
            for task in eligible_tasks
            if float(task.priority_score or 0) >= 80
        ]

        assigned_task_ids = {
            assignment["task_id"]
            for assignment in optimization_result.get(
                "assignments",
                [],
            )
        }

        if critical_tasks:
            critical_assigned = sum(
                1
                for task in critical_tasks
                if task.task_id in assigned_task_ids
            )

            critical_coverage_percent = round(
                (critical_assigned / len(critical_tasks)) * 100,
                1,
            )
        else:
            critical_coverage_percent = 100.0

        # Prototype metric:
        # compare overdue tasks with the number of overdue tasks
        # left unscheduled by the optimizer.
        overdue_task_ids = {
            task.task_id
            for task in eligible_tasks
            if task.status == "OVERDUE"
        }

        overdue_assigned = len(
            overdue_task_ids.intersection(
                assigned_task_ids
            )
        )

        if overdue_task_ids:
            overdue_reduction_percent = round(
                (overdue_assigned / len(overdue_task_ids)) * 100,
                1,
            )
        else:
            overdue_reduction_percent = 0.0

        return {
            "section_id": section_id,
            "planning_date": planning_date,
            "block_type": block_type,

            "critical_maintenance": critical_maintenance,
            "overdue_tasks": overdue_tasks,
            "clear_windows": clear_windows,
            "block_requests": block_requests,
            "allocated_plan": allocated_plan,
            "restrictions": restriction_count,

            "optimizer_status": optimizer_status,
            "candidate_pairs": candidate_pairs,
            "total_priority": total_priority,

            "planning_health": {
                "tasks_covered": allocated_plan,
                "total_tasks": total_tasks,
                "coverage_percent": coverage_percent,
                "critical_coverage_percent": (
                    critical_coverage_percent
                ),
                "overdue_reduction_percent": (
                    overdue_reduction_percent
                ),
            },
        }