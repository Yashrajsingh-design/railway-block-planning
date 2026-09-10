from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest
from app.models.coa_window import CoaWindow
from app.models.maintenance_task import MaintenanceTask
from app.models.restriction import Restriction
from app.models.train_event import TrainEvent


class PlanExplanationService:

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and start_b < end_a

    def explain_unscheduled_tasks(
        self,
        db: Session,
        planning_date: date,
        block_type: str,
        assigned_task_ids: set[str],
    ):

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

        for task in tasks:

            if task.task_id in assigned_task_ids:
                continue

            if task.section_id is None:
                continue

            duration = task.estimated_duration_min or 0

            if duration <= 0:
                continue

            section_windows = [
                window
                for window in windows
                if window.section_id == task.section_id
                and window.start_time is not None
                and window.end_time is not None
                and window.duration_min is not None
                and duration <= window.duration_min
            ]

            if not section_windows:

                explanations.append(
                    {
                        "task_id": task.task_id,
                        "section_id": task.section_id,
                        "priority_score": float(
                            task.priority_score or 0
                        ),
                        "reason_code": "NO_SUITABLE_WINDOW",
                        "reason": (
                            "No available corridor window "
                            "can accommodate the task duration."
                        ),
                    }
                )

                continue

            # ---------------------------------------------
            # HIGH restriction
            # ---------------------------------------------

            high_restriction = next(
                (
                    restriction
                    for restriction in restrictions
                    if restriction.section_id == task.section_id
                    and restriction.severity == "HIGH"
                ),
                None,
            )

            if high_restriction:

                explanations.append(
                    {
                        "task_id": task.task_id,
                        "section_id": task.section_id,
                        "priority_score": float(
                            task.priority_score or 0
                        ),
                        "reason_code": "HIGH_RESTRICTION",
                        "reason": (
                            f"Blocked by HIGH restriction: "
                            f"{high_restriction.restriction_code}."
                        ),
                    }
                )

                continue

            # ---------------------------------------------
            # Existing block conflict
            # ---------------------------------------------

            block_conflict = False

            for window in section_windows:

                conflict = False

                for request in requests:

                    if request.section_id != task.section_id:
                        continue

                    if request.task_id == task.task_id:
                        continue

                    if not request.preferred_start:
                        continue

                    if not request.preferred_end:
                        continue

                    try:
                        from datetime import datetime

                        request_start = datetime.strptime(
                            request.preferred_start,
                            "%H:%M",
                        ).time()

                        request_end = datetime.strptime(
                            request.preferred_end,
                            "%H:%M",
                        ).time()

                    except ValueError:
                        continue

                    if self._overlaps(
                        window.start_time,
                        window.end_time,
                        request_start,
                        request_end,
                    ):
                        conflict = True
                        break

                if not conflict:
                    block_conflict = False
                    break

                block_conflict = True

            if block_conflict:

                explanations.append(
                    {
                        "task_id": task.task_id,
                        "section_id": task.section_id,
                        "priority_score": float(
                            task.priority_score or 0
                        ),
                        "reason_code": "BLOCK_CONFLICT",
                        "reason": (
                            "Available windows conflict "
                            "with an existing block request."
                        ),
                    }
                )

                continue

            # ---------------------------------------------
            # Train conflict
            # ---------------------------------------------

            train_conflict = False

            for window in section_windows:

                conflict = False

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
                        conflict = True
                        break

                if not conflict:
                    train_conflict = False
                    break

                train_conflict = True

            if train_conflict:

                explanations.append(
                    {
                        "task_id": task.task_id,
                        "section_id": task.section_id,
                        "priority_score": float(
                            task.priority_score or 0
                        ),
                        "reason_code": "TRAIN_CONFLICT",
                        "reason": (
                            "All suitable windows overlap "
                            "with scheduled train movements."
                        ),
                    }
                )

                continue

            # ---------------------------------------------
            # Generic optimizer conflict
            # ---------------------------------------------

            explanations.append(
                {
                    "task_id": task.task_id,
                    "section_id": task.section_id,
                    "priority_score": float(
                        task.priority_score or 0
                    ),
                    "reason_code": "OPTIMIZER_CAPACITY",
                    "reason": (
                        "A feasible candidate existed, "
                        "but the optimizer could not select "
                        "it without violating another constraint."
                    ),
                }
            )

        explanations.sort(
            key=lambda item: item["priority_score"],
            reverse=True,
        )

        return explanations