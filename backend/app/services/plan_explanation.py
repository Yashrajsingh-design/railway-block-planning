from datetime import date, datetime, time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest
from app.models.coa_window import CoaWindow
from app.models.maintenance_task import MaintenanceTask
from app.models.restriction import Restriction
from app.models.train_event import TrainEvent


class PlanExplanationService:

    @staticmethod
    def _parse_time(value):
        if value is None:
            return None

        if isinstance(value, time):
            return value

        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(value, fmt).time()
            except (ValueError, TypeError):
                continue

        return None

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and start_b < end_a

    @staticmethod
    def _base_task_info(task):
        return {
            "task_id": task.task_id,
            "section_id": task.section_id,
            "priority_score": float(task.priority_score or 0),
        }

    def _window_conflicts(
        self,
        task,
        window,
        requests,
        trains,
        restrictions,
    ):
        """
        Analyse one task against one candidate COA window.

        Returns:
            {
                "feasible": bool,
                "reasons": [...],
                "penalty": number
            }
        """

        reasons = []
        penalty = 0

        # ---------------------------------------------------------
        # Existing block request conflict
        # ---------------------------------------------------------

        for request in requests:
            if request.section_id != task.section_id:
                continue

            if request.task_id == task.task_id:
                continue

            request_start = self._parse_time(
                request.preferred_start
            )
            request_end = self._parse_time(
                request.preferred_end
            )

            if request_start is None or request_end is None:
                continue

            if self._overlaps(
                window.start_time,
                window.end_time,
                request_start,
                request_end,
            ):
                reasons.append(
                    {
                        "code": "BLOCK_CONFLICT",
                        "message": (
                            f"Overlaps existing block request "
                            f"{request.block_request_id}."
                        ),
                    }
                )

        # ---------------------------------------------------------
        # Operational restrictions
        # ---------------------------------------------------------

        for restriction in restrictions:
            if restriction.section_id != task.section_id:
                continue

            if restriction.severity == "HIGH":
                reasons.append(
                    {
                        "code": "HIGH_RESTRICTION",
                        "message": (
                            f"Blocked by HIGH restriction "
                            f"{restriction.restriction_code}."
                        ),
                    }
                )

            elif restriction.severity == "MEDIUM":
                penalty = max(penalty, 25)

            elif restriction.severity == "LOW":
                penalty = max(penalty, 10)

        # ---------------------------------------------------------
        # Train movement conflict
        # ---------------------------------------------------------

        for train in trains:
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
                reasons.append(
                    {
                        "code": "TRAIN_CONFLICT",
                        "message": (
                            f"Overlaps train movement "
                            f"{train.train_event_id}."
                        ),
                    }
                )

        return {
            "feasible": len(reasons) == 0,
            "reasons": reasons,
            "penalty": penalty,
        }

    def explain_unscheduled_tasks(
        self,
        db: Session,
        planning_date: date,
        block_type: str,
        assigned_task_ids: set[str],
    ):

        # =========================================================
        # Load planning data
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

        requests = db.execute(
            select(BlockRequest).where(
                BlockRequest.requested_date == planning_date,
                BlockRequest.request_status.notin_(
                    ["CANCELLED", "REJECTED"]
                ),
            )
        ).scalars().all()

        trains = db.execute(
            select(TrainEvent).where(
                TrainEvent.service_date == planning_date
            )
        ).scalars().all()

        restrictions = db.execute(
            select(Restriction).where(
                Restriction.date == planning_date
            )
        ).scalars().all()

        explanations = []

        # =========================================================
        # Analyse every unscheduled task
        # =========================================================

        for task in tasks:

            if task.task_id in assigned_task_ids:
                continue

            if task.section_id is None:
                continue

            duration = task.estimated_duration_min or 0

            if duration <= 0:
                continue

            # -----------------------------------------------------
            # Find windows where the task can physically fit
            # -----------------------------------------------------

            section_windows = [
                window
                for window in windows
                if (
                    window.section_id == task.section_id
                    and window.start_time is not None
                    and window.end_time is not None
                    and window.duration_min is not None
                    and duration <= window.duration_min
                )
            ]

            task_info = self._base_task_info(task)

            # -----------------------------------------------------
            # No suitable corridor window
            # -----------------------------------------------------

            if not section_windows:
                explanations.append(
                    {
                        **task_info,
                        "reason_code": "NO_SUITABLE_WINDOW",
                        "reason": (
                            "No available corridor window "
                            "can accommodate the task duration."
                        ),
                        "alternatives": [],
                    }
                )
                continue

            # -----------------------------------------------------
            # Analyse every candidate window
            # -----------------------------------------------------

            candidate_analysis = []

            for window in section_windows:

                analysis = self._window_conflicts(
                    task=task,
                    window=window,
                    requests=requests,
                    trains=trains,
                    restrictions=restrictions,
                )

                candidate_analysis.append(
                    {
                        "window": window,
                        "feasible": analysis["feasible"],
                        "reasons": analysis["reasons"],
                        "penalty": analysis["penalty"],
                    }
                )

            # -----------------------------------------------------
            # Find genuinely feasible alternatives
            # -----------------------------------------------------

            feasible_windows = [
                item
                for item in candidate_analysis
                if item["feasible"]
            ]

            alternatives = [
                {
                    "window_id": item["window"].window_id,
                    "section_id": item["window"].section_id,
                    "start_time": item["window"].start_time,
                    "end_time": item["window"].end_time,
                    "duration_min": item["window"].duration_min,
                    "restriction_penalty": item["penalty"],
                }
                for item in feasible_windows
            ]

            # Prefer lower restriction penalty, then earlier window.
            alternatives.sort(
                key=lambda item: (
                    item["restriction_penalty"],
                    item["start_time"],
                )
            )

            # Keep the response compact.
            alternatives = alternatives[:3]

            # -----------------------------------------------------
            # If a feasible alternative exists, explain why
            # optimizer did not select this task.
            # -----------------------------------------------------

            if feasible_windows:

                best_alternative = alternatives[0]

                explanations.append(
                    {
                        **task_info,
                        "reason_code": "OPTIMIZER_CAPACITY",
                        "reason": (
                            "At least one feasible window exists, "
                            "but the optimizer did not select this "
                            "task because available capacity was "
                            "allocated to higher-value assignments "
                            "under the current constraints."
                        ),
                        "best_alternative": best_alternative,
                        "alternatives": alternatives,
                    }
                )

                continue

            # -----------------------------------------------------
            # No feasible alternatives.
            # Determine the dominant blocking reason.
            # -----------------------------------------------------

            reason_counts = {}

            for item in candidate_analysis:
                for reason in item["reasons"]:
                    code = reason["code"]
                    reason_counts[code] = (
                        reason_counts.get(code, 0) + 1
                    )

            if reason_counts:
                dominant_code = max(
                    reason_counts,
                    key=reason_counts.get,
                )

                dominant_messages = [
                    reason["message"]
                    for item in candidate_analysis
                    for reason in item["reasons"]
                    if reason["code"] == dominant_code
                ]

                dominant_message = (
                    dominant_messages[0]
                    if dominant_messages
                    else "All candidate windows are blocked."
                )

                reason_text = (
                    f"All suitable windows are blocked. "
                    f"{dominant_message}"
                )

                explanations.append(
                    {
                        **task_info,
                        "reason_code": dominant_code,
                        "reason": reason_text,
                        "alternatives": [],
                    }
                )

            else:
                explanations.append(
                    {
                        **task_info,
                        "reason_code": "OPTIMIZER_CAPACITY",
                        "reason": (
                            "No feasible allocation remained "
                            "after evaluating the current "
                            "planning constraints."
                        ),
                        "alternatives": [],
                    }
                )

        # =========================================================
        # Highest-priority tasks first
        # =========================================================

        explanations.sort(
            key=lambda item: item["priority_score"],
            reverse=True,
        )

        return explanations