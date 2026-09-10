from datetime import date, datetime, time

from ortools.sat.python import cp_model
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest
from app.models.coa_window import CoaWindow
from app.models.maintenance_task import MaintenanceTask
from app.models.resource_availability import ResourceAvailability
from app.models.restriction import Restriction
from app.models.task_dependency import TaskDependency
from app.models.train_event import TrainEvent


class OptimizationEngine:

    # =========================================================
    # Prototype resource mapping
    # =========================================================

    DEPARTMENT_RESOURCE_MAP = {
        "ENG": "R01",
        "SNT": "R02",
        "TRD": "R03",
    }

    # =========================================================
    # Time helpers
    # =========================================================

    @staticmethod
    def _parse_time(value: str | time | None) -> time | None:
        if value is None:
            return None

        if isinstance(value, time):
            return value

        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(value, fmt).time()
            except ValueError:
                continue

        return None

    @staticmethod
    def _overlaps(
        start_a: time,
        end_a: time,
        start_b: time,
        end_b: time,
    ) -> bool:
        return start_a < end_b and start_b < end_a

    # =========================================================
    # Resource availability
    # =========================================================

    @staticmethod
    def _resource_available(
        resource_availability,
        candidate_start: time,
        candidate_end: time,
    ) -> bool:

        for availability in resource_availability:

            if not availability.is_available:
                continue

            if availability.start_time is None:
                continue

            if availability.end_time is None:
                continue

            if availability.capacity is None:
                continue

            if availability.capacity <= 0:
                continue

            if (
                availability.start_time <= candidate_start
                and candidate_end <= availability.end_time
            ):
                return True

        return False

    # =========================================================
    # Main optimizer
    # =========================================================

    def optimize(
        self,
        db: Session,
        planning_date: date,
        block_type: str,
    ):

        # =====================================================
        # 1. Load maintenance tasks
        # =====================================================

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

        # =====================================================
        # 2. Load available COA windows
        # =====================================================

        windows = db.execute(
            select(CoaWindow).where(
                CoaWindow.date == planning_date,
                CoaWindow.status == "AVAILABLE",
                CoaWindow.block_type == block_type,
            )
        ).scalars().all()

        # =====================================================
        # 3. Load existing block requests
        # =====================================================

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

        # =====================================================
        # 4. Load train movements
        # =====================================================

        train_events = db.execute(
            select(TrainEvent).where(
                TrainEvent.service_date == planning_date
            )
        ).scalars().all()

        # =====================================================
        # 5. Load task dependencies
        # =====================================================

        dependencies = db.execute(
            select(TaskDependency).where(
                TaskDependency.dependency_type == "PRECEDENCE"
            )
        ).scalars().all()

        # =====================================================
        # 6. Load resource availability
        # =====================================================

        resource_availability_rows = db.execute(
            select(ResourceAvailability).where(
                ResourceAvailability.date == planning_date
            )
        ).scalars().all()

        resource_availability = {}

        for row in resource_availability_rows:

            resource_availability.setdefault(
                row.resource_id,
                [],
            ).append(row)

        # =====================================================
        # 7. Load operational restrictions
        # =====================================================

        restrictions = db.execute(
            select(Restriction).where(
                Restriction.date == planning_date
            )
        ).scalars().all()

        # =====================================================
        # 8. Generate candidate task-window pairs
        # =====================================================

        candidates = []

        for task in tasks:

            if task.section_id is None:
                continue

            if task.department_id is None:
                continue

            duration = task.estimated_duration_min or 0

            if duration <= 0:
                continue

            # Prototype resource mapping
            resource_id = self.DEPARTMENT_RESOURCE_MAP.get(
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

            # =================================================
            # Check every COA window
            # =================================================

            for window in windows:

                # Same section required
                if window.section_id != task.section_id:
                    continue

                # Valid time data required
                if (
                    window.start_time is None
                    or window.end_time is None
                ):
                    continue

                # Valid duration required
                if window.duration_min is None:
                    continue

                # Task must fit inside window
                if duration > window.duration_min:
                    continue

                # =================================================
                # Existing block conflict
                # =================================================

                request_conflict = False

                for request in existing_requests:

                    if request.section_id != task.section_id:
                        continue

                    # Ignore request belonging to same task
                    if request.task_id == task.task_id:
                        continue

                    request_start = self._parse_time(
                        request.preferred_start
                    )

                    request_end = self._parse_time(
                        request.preferred_end
                    )

                    if (
                        request_start is None
                        or request_end is None
                    ):
                        continue

                    if self._overlaps(
                        window.start_time,
                        window.end_time,
                        request_start,
                        request_end,
                    ):
                        request_conflict = True
                        break

                if request_conflict:
                    continue

                # =================================================
                # Operational restriction check
                # =================================================

                restriction_conflict = False
                restriction_penalty = 0

                for restriction in restrictions:

                    if restriction.section_id != task.section_id:
                        continue

                    # HIGH = hard constraint
                    if restriction.severity == "HIGH":
                        restriction_conflict = True
                        break

                    # MEDIUM = moderate penalty
                    if restriction.severity == "MEDIUM":
                        restriction_penalty = max(
                            restriction_penalty,
                            25,
                        )

                    # LOW = small penalty
                    elif restriction.severity == "LOW":
                        restriction_penalty = max(
                            restriction_penalty,
                            10,
                        )

                if restriction_conflict:
                    continue

                # =================================================
                # Train movement conflict
                # =================================================

                train_conflict = False

                for train in train_events:

                    if train.section_id != task.section_id:
                        continue

                    if (
                        train.entry_time is None
                        or train.exit_time is None
                    ):
                        continue

                    if self._overlaps(
                        window.start_time,
                        window.end_time,
                        train.entry_time,
                        train.exit_time,
                    ):
                        train_conflict = True
                        break

                if train_conflict:
                    continue

                # =================================================
                # Resource availability
                # =================================================

                resource_ok = self._resource_available(
                    available_resources,
                    window.start_time,
                    window.end_time,
                )

                if not resource_ok:
                    continue

                # =================================================
                # Candidate accepted
                # =================================================

                candidates.append(
                    {
                        "task": task,
                        "window": window,
                        "resource_id": resource_id,
                        "restriction_penalty": restriction_penalty,
                    }
                )

        # =========================================================
        # 9. Create CP-SAT model
        # =========================================================

        model = cp_model.CpModel()

        decision_variables = []

        for index, candidate in enumerate(candidates):

            variable = model.NewBoolVar(
                f"assign_{index}"
            )

            decision_variables.append(
                (
                    variable,
                    candidate,
                )
            )

        # =========================================================
        # 10. One task per COA window
        # =========================================================

        for window in windows:

            window_variables = [
                variable
                for variable, candidate in decision_variables
                if candidate["window"].window_id
                == window.window_id
            ]

            if window_variables:

                model.Add(
                    sum(window_variables) <= 1
                )

        # =========================================================
        # 11. One window per task
        # =========================================================

        for task in tasks:

            task_variables = [
                variable
                for variable, candidate in decision_variables
                if candidate["task"].task_id
                == task.task_id
            ]

            if task_variables:

                model.Add(
                    sum(task_variables) <= 1
                )

        # =========================================================
        # 12. Resource conflict constraint
        # =========================================================

        for index_a in range(
            len(decision_variables)
        ):

            variable_a, candidate_a = (
                decision_variables[index_a]
            )

            resource_a = candidate_a["resource_id"]

            start_a = candidate_a["window"].start_time
            end_a = candidate_a["window"].end_time

            for index_b in range(
                index_a + 1,
                len(decision_variables),
            ):

                variable_b, candidate_b = (
                    decision_variables[index_b]
                )

                resource_b = candidate_b["resource_id"]

                if resource_a != resource_b:
                    continue

                start_b = candidate_b["window"].start_time
                end_b = candidate_b["window"].end_time

                if (
                    start_a is None
                    or end_a is None
                    or start_b is None
                    or end_b is None
                ):
                    continue

                if self._overlaps(
                    start_a,
                    end_a,
                    start_b,
                    end_b,
                ):

                    model.Add(
                        variable_a
                        + variable_b
                        <= 1
                    )

        # =========================================================
        # 13. Task dependency constraints
        # =========================================================

        candidate_variables_by_task = {}

        for variable, candidate in decision_variables:

            task_id = candidate["task"].task_id

            candidate_variables_by_task.setdefault(
                task_id,
                [],
            ).append(
                (
                    variable,
                    candidate,
                )
            )

        for dependency in dependencies:

            predecessor_task_id = (
                dependency.predecessor_task_id
            )

            successor_task_id = (
                dependency.successor_task_id
            )

            predecessor_candidates = (
                candidate_variables_by_task.get(
                    predecessor_task_id,
                    [],
                )
            )

            successor_candidates = (
                candidate_variables_by_task.get(
                    successor_task_id,
                    [],
                )
            )

            if not successor_candidates:
                continue

            predecessor_variables = [
                variable
                for variable, candidate
                in predecessor_candidates
            ]

            successor_variables = [
                variable
                for variable, candidate
                in successor_candidates
            ]

            # Successor cannot be scheduled unless
            # predecessor is also scheduled.
            if predecessor_variables:

                model.Add(
                    sum(successor_variables)
                    <= sum(predecessor_variables)
                )

            else:

                model.Add(
                    sum(successor_variables) == 0
                )

            # Predecessor must finish before successor starts.
            for (
                predecessor_variable,
                predecessor_candidate,
            ) in predecessor_candidates:

                predecessor_window = (
                    predecessor_candidate["window"]
                )

                predecessor_start = (
                    predecessor_window.start_time
                )

                predecessor_end = (
                    predecessor_window.end_time
                )

                if (
                    predecessor_start is None
                    or predecessor_end is None
                ):
                    continue

                for (
                    successor_variable,
                    successor_candidate,
                ) in successor_candidates:

                    successor_window = (
                        successor_candidate["window"]
                    )

                    successor_start = (
                        successor_window.start_time
                    )

                    successor_end = (
                        successor_window.end_time
                    )

                    if (
                        successor_start is None
                        or successor_end is None
                    ):
                        continue

                    if (
                        predecessor_end
                        > successor_start
                    ):

                        model.Add(
                            predecessor_variable
                            + successor_variable
                            <= 1
                        )

        # =========================================================
        # 14. Objective function
        # =========================================================

        objective_terms = []

        for variable, candidate in decision_variables:

            priority = (
                candidate["task"].priority_score
                or 0
            )

            priority_value = int(
                float(priority) * 100
            )

            restriction_penalty = int(
                candidate.get(
                    "restriction_penalty",
                    0,
                ) * 100
            )

            final_score = (
                priority_value
                - restriction_penalty
            )

            objective_terms.append(
                variable * final_score
            )

        if objective_terms:

            model.Maximize(
                sum(objective_terms)
            )

        # =========================================================
        # 15. Solve
        # =========================================================

        solver = cp_model.CpSolver()

        solver.parameters.max_time_in_seconds = 10

        result = solver.Solve(model)

        # =========================================================
        # 16. Build assignments
        # =========================================================

        assignments = []

        if result in (
            cp_model.OPTIMAL,
            cp_model.FEASIBLE,
        ):

            for variable, candidate in decision_variables:

                if solver.Value(variable) != 1:
                    continue

                task = candidate["task"]
                window = candidate["window"]

                assignments.append(
                    {
                        "task_id": task.task_id,
                        "section_id": task.section_id,
                        "window_id": window.window_id,
                        "resource_id": candidate["resource_id"],
                        "start_time": window.start_time,
                        "end_time": window.end_time,
                        "duration_min": (
                            task.estimated_duration_min
                        ),
                        "priority_score": float(
                            task.priority_score
                            or 0
                        ),
                        "restriction_penalty": (
                            candidate.get(
                                "restriction_penalty",
                                0,
                            )
                        ),
                    }
                )

        # =========================================================
        # 17. Return optimization result
        # =========================================================

        return {
            "status": solver.StatusName(result),
            "planning_date": planning_date,
            "block_type": block_type,
            "candidate_pairs": len(candidates),
            "assignments": assignments,
            "assigned_count": len(assignments),
            "total_priority": round(
                sum(
                    item["priority_score"]
                    for item in assignments
                ),
                2,
            ),
        }