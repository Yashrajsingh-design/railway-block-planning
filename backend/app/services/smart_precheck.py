from datetime import datetime, timedelta

from app.schemas.precheck import (
    PreCheckIssue,
    PreCheckRequest,
    PreCheckResponse,
    SuggestedWindow,
)


class SmartPreCheckService:

    def run(self, request: PreCheckRequest) -> PreCheckResponse:
        issues: list[PreCheckIssue] = []

        checks_total = 0
        checks_passed = 0

        # ---------------------------------------------------------
        # 1. Time validation
        # ---------------------------------------------------------

        checks_total += 1

        if request.preferred_start_time >= request.preferred_end_time:
            issues.append(
                PreCheckIssue(
                    code="INVALID_TIME_RANGE",
                    severity="BLOCKED",
                    message="Preferred start time must be before end time.",
                )
            )
        else:
            checks_passed += 1

        # ---------------------------------------------------------
        # 2. Duration validation
        # ---------------------------------------------------------

        checks_total += 1

        start = datetime.combine(
            request.preferred_date,
            request.preferred_start_time,
        )

        end = datetime.combine(
            request.preferred_date,
            request.preferred_end_time,
        )

        requested_duration = int(
            (end - start).total_seconds() / 60
        )

        if requested_duration < request.minimum_duration_minutes:
            issues.append(
                PreCheckIssue(
                    code="INSUFFICIENT_DURATION",
                    severity="BLOCKED",
                    message=(
                        f"Requested window provides only "
                        f"{requested_duration} minutes, but "
                        f"{request.minimum_duration_minutes} minutes "
                        f"are required."
                    ),
                )
            )
        else:
            checks_passed += 1

        # ---------------------------------------------------------
        # 3. Required location
        # ---------------------------------------------------------

        checks_total += 1

        if request.location_id is None:
            issues.append(
                PreCheckIssue(
                    code="LOCATION_MISSING",
                    severity="WARNING",
                    message="No specific location was provided.",
                )
            )
        else:
            checks_passed += 1

        # ---------------------------------------------------------
        # 4. Asset information
        # ---------------------------------------------------------

        checks_total += 1

        if request.asset_id is None:
            issues.append(
                PreCheckIssue(
                    code="ASSET_MISSING",
                    severity="WARNING",
                    message="No specific asset was linked.",
                )
            )
        else:
            checks_passed += 1

        # ---------------------------------------------------------
        # 5. Resource information
        # ---------------------------------------------------------

        checks_total += 1

        if not request.resource_ids:
            issues.append(
                PreCheckIssue(
                    code="RESOURCES_NOT_SPECIFIED",
                    severity="WARNING",
                    message="No resources were specified.",
                )
            )
        else:
            checks_passed += 1

        # ---------------------------------------------------------
        # Determine overall result
        # ---------------------------------------------------------

        blocks = sum(
            1 for issue in issues
            if issue.severity == "BLOCKED"
        )

        warnings = sum(
            1 for issue in issues
            if issue.severity == "WARNING"
        )

        if blocks > 0:
            status = "BLOCKED"
            can_submit = False
        elif warnings > 0:
            status = "WARNING"
            can_submit = True
        else:
            status = "CLEAR"
            can_submit = True

        # ---------------------------------------------------------
        # Basic alternative windows
        # ---------------------------------------------------------

        suggested_windows: list[SuggestedWindow] = []

        if blocks == 0:
            for offset_hours in [1, 2, 3]:

                alternative_start = (
                    start + timedelta(hours=offset_hours)
                )

                alternative_end = (
                    alternative_start
                    + timedelta(
                        minutes=request.minimum_duration_minutes
                    )
                )

                if alternative_end.date() == request.preferred_date:
                    suggested_windows.append(
                        SuggestedWindow(
                            start_time=alternative_start.time(),
                            end_time=alternative_end.time(),
                            score=max(
                                0.0,
                                1.0 - offset_hours * 0.15,
                            ),
                            reason=(
                                "Alternative window near the "
                                "preferred time."
                            ),
                        )
                    )

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