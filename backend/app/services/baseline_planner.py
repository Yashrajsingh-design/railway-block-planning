from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest
from app.models.coa_window import CoaWindow
from app.models.maintenance_task import MaintenanceTask
from app.models.resource_availability import ResourceAvailability
from app.models.restriction import Restriction
from app.models.task_dependency import TaskDependency
from app.models.train_event import TrainEvent
from app.services.optimization_engine import OptimizationEngine


class BaselinePlanner:
    """
    Deterministic greedy baseline for comparison with CP-SAT.

    Important:
    - Uses the same candidate-generation rules as OptimizationEngine.
    - Respects resource conflicts.
    - Respects task dependencies.
    - Uses priority minus restriction penalty as its score.
    - Greedily selects the best currently feasible candidate.

    This is intentionally not globally optimal.
    """

    def plan(
        self,
        db: Session,
        planning_date: date,
        block_type: str,
    ) -> dict:

        optimizer = OptimizationEngine()

        # =========================================================
        # 1. Load the same core data as the CP-SAT optimizer
        # =========================================================

        tasks = db.execute(
            select(MaintenanceTask).where(
                MaintenanceTask.status.in_(
                    [
                        "OPEN",
                        "PLANNED",
                        "EMERGENCY",
                        "OVERDUE",
                    ]
                )
            )
        ).scalars().all()

        windows = db.execute(
            select(CoaWindow).where(
                CoaWindow.date == planning_date,
                CoaWindow.status == "AVAILABLE",
                CoaWindow.block_type == block_type,
            )
        ).scalars().all()

        existing_requests = db.execute(
            select(BlockRequest).where(
                BlockRequest.requested_date == planning_date,
                BlockRequest.request_status.notin_(
                    [
                        "CANCELLED",
                        "REJECTED",
                    ]
                ),
            )
        ).scalars().all()

        train_events = db.execute(
            select(TrainEvent).where(
                TrainEvent.service_date == planning_date
            )
        ).scalars().all()

        dependencies = db.execute(
            select(TaskDependency).where(
                TaskDependency.dependency_type == "PRECEDENCE"
            )
        ).scalars().all()

        resource_rows = db.execute(
            select(ResourceAvailability).where(
                ResourceAvailability.date == planning_date
            )
        ).scalars().all()

        resource_availability = {}

        for row in resource_rows:
            resource_availability.setdefault(
                row.resource_id,
                [],
            ).append(row)

        restrictions = db.execute(
            select(Restriction).where(
                Restriction.date == planning_date
            )
        ).scalars().all()

        # =========================================================
        # 2. Build dependency lookup
        # =========================================================

        predecessors = {}

        for dependency in dependencies:
            predecessors.setdefault(
                dependency.successor_task_id,
                set(),
            ).add(
                dependency.predecessor_task_id
            )

        # =========================================================
        # 3. Generate SAME candidate universe as CP-SAT
        # =========================================================

        candidates = []

        for task in tasks:

            if task.section_id is None:
                continue

            if task.department_id is None:
                continue

            duration = task.estimated_duration_min or 0

            if duration <= 0:
                continue

            resource_id = optimizer.DEPARTMENT_RESOURCE_MAP.get(
                task.department_id
            )

            if resource_id is None:
                continue

            available_resources = resource_availability.get(
                resource_id,
                [],
            )

            if not available_resources:
                continue

            for window in windows:

                # Same section.
                if window.section_id != task.section_id:
                    continue

                # Valid window data.
                if (
                    window.start_time is None
                    or window.end_time is None
                ):
                    continue

                if window.duration_min is None:
                    continue

                # Task must fit.
                if duration > window.duration_min:
                    continue

                # -------------------------------------------------
                # Existing block request conflict
                # -------------------------------------------------

                request_conflict = False

                for request in existing_requests:

                    if request.section_id != task.section_id:
                        continue

                    # Ignore request belonging to this task.
                    if request.task_id == task.task_id:
                        continue

                    request_start = optimizer._parse_time(
                        request.preferred_start
                    )

                    request_end = optimizer._parse_time(
                        request.preferred_end
                    )

                    if (
                        request_start is None
                        or request_end is None
                    ):
                        continue

                    if optimizer._overlaps(
                        window.start_time,
                        window.end_time,
                        request_start,
                        request_end,
                    ):
                        request_conflict = True
                        break

                if request_conflict:
                    continue

                # -------------------------------------------------
                # Restrictions
                # -------------------------------------------------

                restriction_conflict = False
                restriction_penalty = 0

                for restriction in restrictions:

                    if restriction.section_id != task.section_id:
                        continue

                    if restriction.severity == "HIGH":
                        restriction_conflict = True
                        break

                    if restriction.severity == "MEDIUM":
                        restriction_penalty = max(
                            restriction_penalty,
                            25,
                        )

                    elif restriction.severity == "LOW":
                        restriction_penalty = max(
                            restriction_penalty,
                            10,
                        )

                if restriction_conflict:
                    continue

                # -------------------------------------------------
                # Train movement conflict
                # -------------------------------------------------

                train_conflict = False

                for train in train_events:

                    if train.section_id != task.section_id:
                        continue

                    if (
                        train.entry_time is None
                        or train.exit_time is None
                    ):
                        continue

                    if optimizer._overlaps(
                        window.start_time,
                        window.end_time,
                        train.entry_time,
                        train.exit_time,
                    ):
                        train_conflict = True
                        break

                if train_conflict:
                    continue

                # -------------------------------------------------
                # Resource availability
                # -------------------------------------------------

                if not optimizer._resource_available(
                    available_resources,
                    window.start_time,
                    window.end_time,
                ):
                    continue

                # -------------------------------------------------
                # Candidate accepted
                # -------------------------------------------------

                raw_priority = float(
                    task.priority_score or 0
                )

                effective_score = (
                    raw_priority
                    - restriction_penalty
                )

                candidates.append(
                    {
                        "task": task,
                        "window": window,
                        "resource_id": resource_id,
                        "restriction_penalty": restriction_penalty,
                        "effective_score": effective_score,
                    }
                )

        # =========================================================
        # 4. Greedy selection
        # =========================================================

        # Highest effective score first.
        # Earliest window breaks ties.
        # Task ID provides deterministic final ordering.

        candidates.sort(
            key=lambda candidate: (
                -candidate["effective_score"],
                candidate["window"].start_time,
                candidate["task"].task_id,
            )
        )

        assigned_tasks = set()
        assigned_windows = set()
        assigned_resources = []

        assignments = []

        # =========================================================
        # 5. Select candidates
        # =========================================================

        for candidate in candidates:

            task = candidate["task"]
            window = candidate["window"]

            task_id = task.task_id
            window_id = window.window_id

            # One window per task.
            if task_id in assigned_tasks:
                continue

            # One task per window.
            if window_id in assigned_windows:
                continue

            # -----------------------------------------------------
            # Dependency check
            # -----------------------------------------------------

            required_predecessors = predecessors.get(
                task_id,
                set(),
            )

            if not required_predecessors.issubset(
                assigned_tasks
            ):
                continue

            # -----------------------------------------------------
            # Resource conflict
            # -----------------------------------------------------

            resource_conflict = False

            for existing in assigned_resources:

                if (
                    existing["resource_id"]
                    != candidate["resource_id"]
                ):
                    continue

                if optimizer._overlaps(
                    window.start_time,
                    window.end_time,
                    existing["start_time"],
                    existing["end_time"],
                ):
                    resource_conflict = True
                    break

            if resource_conflict:
                continue

            # -----------------------------------------------------
            # Accept assignment
            # -----------------------------------------------------

            assignment = {
                "task_id": task_id,
                "section_id": task.section_id,
                "window_id": window_id,
                "resource_id": candidate["resource_id"],
                "start_time": window.start_time,
                "end_time": window.end_time,
                "duration_min": task.estimated_duration_min,
                "priority_score": float(
                    task.priority_score or 0
                ),
                "restriction_penalty": candidate[
                    "restriction_penalty"
                ],
            }

            assignments.append(assignment)

            assigned_tasks.add(task_id)
            assigned_windows.add(window_id)

            assigned_resources.append(
                {
                    "resource_id": candidate["resource_id"],
                    "start_time": window.start_time,
                    "end_time": window.end_time,
                }
            )

        # =========================================================
        # 6. Metrics
        # =========================================================

        total_priority = round(
            sum(
                assignment["priority_score"]
                for assignment in assignments
            ),
            2,
        )

        total_penalty = round(
            sum(
                assignment["restriction_penalty"]
                for assignment in assignments
            ),
            2,
        )

        effective_score = round(
            total_priority - total_penalty,
            2,
        )

        return {
            "status": "BASELINE",
            "planning_date": planning_date,
            "block_type": block_type,
            "candidate_pairs": len(candidates),
            "assignments": assignments,
            "assigned_count": len(assignments),
            "total_priority": total_priority,
            "total_restriction_penalty": total_penalty,
            "effective_score": effective_score,
        }
