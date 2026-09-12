from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.block_request import BlockRequest
from app.models.department import Department
from app.models.maintenance_task import MaintenanceTask
from app.models.section import Section
from app.schemas.precheck import (
    PreCheckIssue,
    PreCheckRequest,
    PreCheckResponse,
    SuggestedWindow,
)
from app.models.coa_window import CoaWindow
from app.models.resource_availability import ResourceAvailability


class SmartPreCheckService:

    def run(
        self,
        request: PreCheckRequest,
        db: Session,
    ) -> PreCheckResponse:

        issues: list[PreCheckIssue] = []
        warnings = 0
        blocks = 0
        checks_total = 0
        checks_passed = 0

        # 1. Time range
        checks_total += 1

        start = datetime.combine(
            request.preferred_date,
            request.preferred_start_time,
        )
        end = datetime.combine(
            request.preferred_date,
            request.preferred_end_time,
        )

        if end <= start:
            # Allow overnight requests
            end += timedelta(days=1)

        duration = int((end - start).total_seconds() / 60)

        if duration < request.minimum_duration_minutes:
            blocks += 1
            issues.append(
                PreCheckIssue(
                    code="DURATION_TOO_SHORT",
                    severity="BLOCK",
                    message="Preferred window is shorter than the minimum required duration.",
                )
            )
        else:
            checks_passed += 1

        # 2. Block type validity and power consistency
        checks_total += 1
        allowed_block_types = {"TRAFFIC", "POWER", "INTEGRATED"}

        if request.block_type not in allowed_block_types:
            blocks += 1
            issues.append(
                PreCheckIssue(
                    code="INVALID_BLOCK_TYPE",
                    severity="BLOCK",
                    message="Selected block type is not supported by the planning system.",
                )
            )
        elif request.block_type == "POWER" and not request.power_block_required:
            blocks += 1
            issues.append(
                PreCheckIssue(
                    code="POWER_REQUIREMENT_MISMATCH",
                    severity="BLOCK",
                    message="A Power Block requires 25kV OHE power isolation to be enabled.",
                )
            )
        elif request.power_block_required and request.block_type == "TRAFFIC":
            blocks += 1
            issues.append(
                PreCheckIssue(
                    code="POWER_REQUIREMENT_MISMATCH",
                    severity="BLOCK",
                    message="25kV OHE power isolation requires a Power or Integrated block type.",
                )
            )
        else:
            checks_passed += 1

        # 3. Department exists
        checks_total += 1

        department = db.execute(
            select(Department).where(
                Department.department_id == request.department_id
            )
        ).scalar_one_or_none()

        if department is None:
            blocks += 1
            issues.append(
                PreCheckIssue(
                    code="INVALID_DEPARTMENT",
                    severity="BLOCK",
                    message="Selected department does not exist.",
                )
            )
        else:
            checks_passed += 1

        # 3. Section exists
        checks_total += 1

        section = db.execute(
            select(Section).where(
                Section.section_id == request.section_id
            )
        ).scalar_one_or_none()

        if section is None:
            blocks += 1
            issues.append(
                PreCheckIssue(
                    code="INVALID_SECTION",
                    severity="BLOCK",
                    message="Selected section does not exist.",
                )
            )
        else:
            checks_passed += 1

        # 4. Maintenance task exists
        checks_total += 1

        task = None

        if request.maintenance_task_id:
            task = db.execute(
                select(MaintenanceTask).where(
                    MaintenanceTask.task_id
                    == request.maintenance_task_id
                )
            ).scalar_one_or_none()

            if task is None:
                blocks += 1
                issues.append(
                    PreCheckIssue(
                        code="INVALID_TASK",
                        severity="BLOCK",
                        message="Selected maintenance task does not exist.",
                    )
                )
            else:
                checks_passed += 1
        else:
            warnings += 1
            issues.append(
                PreCheckIssue(
                    code="TASK_NOT_SELECTED",
                    severity="WARNING",
                    message="No maintenance task was selected.",
                )
            )

        # 5. Task relationship validation
        if task is not None:
            checks_total += 1

            if (
                task.department_id != request.department_id
                or task.section_id != request.section_id
            ):
                blocks += 1
                issues.append(
                    PreCheckIssue(
                        code="TASK_LOCATION_MISMATCH",
                        severity="BLOCK",
                        message="Maintenancetask does not belong to the selected department and section.",
                    )
                )
            else:
                checks_passed += 1

        # 6. Existing block request conflict
        checks_total += 1

        existing_requests = db.execute(
            select(BlockRequest).where(
                BlockRequest.section_id == request.section_id,
                BlockRequest.requested_date == request.preferred_date,
                BlockRequest.request_status.not_in(
                    ["REJECTED", "CANCELLED"]
                ),
            )
        ).scalars().all()

        conflict_found = False

        for existing in existing_requests:

            if (
                request.block_request_id
                and existing.block_request_id == request.block_request_id
            ):
                continue

            if not existing.preferred_start or not existing.preferred_end:
                continue

            try:
                existing_start = datetime.combine(
                    request.preferred_date,
                    datetime.strptime(
                        existing.preferred_start,
                        "%H:%M",
                    ).time(),
                )

                existing_end = datetime.combine(
                    request.preferred_date,
                    datetime.strptime(
                        existing.preferred_end,
                        "%H:%M",
                    ).time(),
                )

                if existing_end <= existing_start:
                    existing_end += timedelta(days=1)

                if start < existing_end and end > existing_start:
                    conflict_found = True
                    break

            except ValueError:
                continue

        if conflict_found:
            warnings += 1
            issues.append(
                PreCheckIssue(
                    code="BLOCK_WINDOW_CONFLICT",
                    severity="WARNING",
                    message="Another block request overlaps the selected window on this section.",
                )
            )
        else:
            checks_passed += 1


                # 7. Check COA corridor window availability
        checks_total += 1

        coa_windows = db.execute(
            select(CoaWindow).where(
                CoaWindow.section_id == request.section_id,
                CoaWindow.date == request.preferred_date,
                CoaWindow.status == "AVAILABLE",
                CoaWindow.block_type == request.block_type,
            )
        ).scalars().all()

        coa_window_found = False

        for window in coa_windows:

            if window.start_time is None or window.end_time is None:
                continue

            window_start = datetime.combine(
                request.preferred_date,
                window.start_time,
            )

            window_end = datetime.combine(
                request.preferred_date,
                window.end_time,
            )

            if window_end <= window_start:
                window_end += timedelta(days=1)

            # Requested block must fit completely inside
            # the available COA window.
            if start >= window_start and end<= window_end:
                coa_window_found = True
                checks_passed += 1
                break

        if not coa_window_found:
            blocks += 1

            issues.append(
                PreCheckIssue(
                    code="NO_COA_WINDOW",
                    severity="BLOCK",
                    message="No available COA corridor window can accommodate the requested block.",
                )
            )

        # 8. Optional fields
        if request.location_id is None:
            warnings += 1
            issues.append(
                PreCheckIssue(
                    code="LOCATION_NOT_SELECTED",
                    severity="WARNING",
                    message="No specific location was selected.",
                )
            )

        if request.asset_id is None:
            warnings += 1
            issues.append(
                PreCheckIssue(
                    code="ASSET_NOT_SELECTED",
                    severity="WARNING",
                    message="No specific asset was selected.",
                )
            )

        # 9. Selected resource availability
        checks_total += 1

        if not request.resource_ids:
            warnings += 1
            issues.append(
                PreCheckIssue(
                    code="RESOURCES_NOT_SELECTED",
                    severity="WARNING",
                    message="No maintenance resources were selected.",
                )
            )
        else:
            unavailable_resources: list[str] = []

            for resource_id in request.resource_ids:
                rows = db.execute(
                    select(ResourceAvailability).where(
                        ResourceAvailability.resource_id == resource_id,
                        ResourceAvailability.date == request.preferred_date,
                    )
                ).scalars().all()

                resource_ok = False
                for row in rows:
                    if not row.is_available or not row.capacity or row.capacity <= 0:
                        continue
                    if row.start_time is None or row.end_time is None:
                        continue
                    if (
                        row.start_time <= request.preferred_start_time
                        and request.preferred_end_time <= row.end_time
                    ):
                        resource_ok = True
                        break

                if not resource_ok:
                    unavailable_resources.append(resource_id)

            if unavailable_resources:
                blocks += 1
                issues.append(
                    PreCheckIssue(
                        code="RESOURCE_UNAVAILABLE",
                        severity="BLOCK",
                        message=(
                            "Selected resource(s) are not available for the requested date/time: "
                            + ", ".join(unavailable_resources)
                        ),
                    )
                )
            else:
                checks_passed += 1

        # Suggested alternative windows from available COA windows
        suggested_windows: list[SuggestedWindow] = []

        available_coa_windows = db.execute(
            select(CoaWindow).where(
                CoaWindow.section_id == request.section_id,
                CoaWindow.date == request.preferred_date,
                CoaWindow.status == "AVAILABLE",
                CoaWindow.block_type == request.block_type,
            )
        ).scalars().all()

        for window in available_coa_windows:

            if window.start_time is None or window.end_time is None:
                continue

            window_start = datetime.combine(
                request.preferred_date,
                window.start_time,
            )

            window_end = datetime.combine(
                request.preferred_date,
                window.end_time,
            )

            if window_end <= window_start:
                window_end += timedelta(days=1)

            window_duration = int(
                (window_end - window_start).total_seconds() / 60
            )

            # Ignore windows that are too short
            if window_duration < request.minimum_duration_minutes:
                continue

            # Check whether this COA window conflicts
            # with an existing block request.
            conflict = False

            for existing in existing_requests:

                if (
                    request.block_request_id
                    and existing.block_request_id == request.block_request_id
                ):
                    continue

                if not existing.preferred_start or not existing.preferred_end:
                    continue

                try:
                    existing_start = datetime.combine(
                        request.preferred_date,
                        datetime.strptime(
                            existing.preferred_start,
                            "%H:%M",
                        ).time(),
                    )

                    existing_end = datetime.combine(
                        request.preferred_date,
                        datetime.strptime(
                            existing.preferred_end,
                            "%H:%M",
                        ).time(),
                    )

                    if existing_end <= existing_start:
                        existing_end += timedelta(days=1)

                    if (
                        window_start < existing_end
                        and window_end > existing_start
                    ):
                        conflict = True
                        break

                except ValueError:
                    continue

            if conflict:
                continue

            # Use the earliest possible slotinside this COA window.
            candidate_start = window_start
            candidate_end = candidate_start + timedelta(
                minutes=request.minimum_duration_minutes
            )

            suggested_windows.append(
                SuggestedWindow(
                    start_time=candidate_start.time(),
                    end_time=candidate_end.time(),
                    score=100.0,
                    reason=(
                        f"Available COA {window.window_class} window "
                        f"with {window_duration} minutes capacity."
                    ),
                )
            )

        # Return only the best three alternatives
        suggested_windows = sorted(
            suggested_windows,
            key=lambda item: item.score,
            reverse=True,
        )[:3]

                # Determine final pre-check status
        if blocks > 0:
            status = "BLOCKED"
            can_submit = False
        elif warnings > 0:
            status = "WARNING"
            can_submit = True
        else:
            status = "CLEAR"
            can_submit = True

        return PreCheckResponse(
            status=status,
            can_submit=can_submit,
            checks_total=checks_total,
            checks_passed=checks_passed,
            warnings=warnings,
            blocks=blocks,
            issues=issues,
            suggested_windows=suggested_windows,
        )
