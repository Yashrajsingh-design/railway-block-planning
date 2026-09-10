from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest
from app.models.coa_window import CoaWindow
from app.models.maintenance_task import MaintenanceTask


class CandidateWindowGenerator:

    def generate(
        self,
        db: Session,
        task_id: str,
        planning_date,
        block_type: str,
    ):

        # Find maintenance task
        task = db.execute(
            select(MaintenanceTask).where(
                MaintenanceTask.task_id == task_id
            )
        ).scalar_one_or_none()

        if task is None:
            return None

        if task.section_id is None:
            return []

        # Find available COA windows
        coa_windows = db.execute(
            select(CoaWindow).where(
                CoaWindow.section_id == task.section_id,
                CoaWindow.date == planning_date,
                CoaWindow.status == "AVAILABLE",
                CoaWindow.block_type == block_type,
            )
        ).scalars().all()

        # Find existing requests for the same section/date
        existing_requests = db.execute(
            select(BlockRequest).where(
                BlockRequest.section_id == task.section_id,
                BlockRequest.requested_date == planning_date,
                BlockRequest.request_status.not_in(
                    ["REJECTED", "CANCELLED"]
                ),
            )
        ).scalars().all()

        candidates = []

        required_duration = (
            task.estimated_duration_min or 0
        )

        for window in coa_windows:

            if (
                window.start_time is None
                or window.end_time is None
            ):
                continue

            window_start = datetime.combine(
                planning_date,
                window.start_time,
            )

            window_end = datetime.combine(
                planning_date,
                window.end_time,
            )

            if window_end <= window_start:
                window_end += timedelta(days=1)

            window_duration = int(
                (
                    window_end - window_start
                ).total_seconds() / 60
            )

            if window_duration < required_duration:
                continue

            # Start with earliest possible slot
            candidate_start = window_start

            candidate_end = (
                candidate_start
                + timedelta(minutes=required_duration)
            )

            # Check conflicts with existing requests
            conflict = False

            for existing in existing_requests:

                if (
                    not existing.preferred_start
                    or not existing.preferred_end
                ):
                    continue

                try:
                    existing_start = datetime.combine(
                        planning_date,
                        datetime.strptime(
                            existing.preferred_start,
                            "%H:%M",
                        ).time(),
                    )

                    existing_end = datetime.combine(
                        planning_date,
                        datetime.strptime(
                            existing.preferred_end,
                            "%H:%M",
                        ).time(),
                    )

                    if existing_end <= existing_start:
                        existing_end += timedelta(days=1)

                    if (
                        candidate_start < existing_end
                        and candidate_end > existing_start
                    ):
                        conflict = True
                        break

                except ValueError:
                    continue

            if conflict:
                continue

            candidates.append(
                {
                    "task_id": task.task_id,
                    "section_id": task.section_id,
                    "window_id": window.window_id,
                    "start_time": candidate_start.time(),
                    "end_time": candidate_end.time(),
                    "duration_min": required_duration,
                    "window_class": window.window_class,
                    "score": 100.0,
                }
            )

        return candidates