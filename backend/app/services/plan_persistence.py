from datetime import date

from sqlalchemy.orm import Session

from app.models.plan import Plan
from app.models.plan_assignment import PlanAssignment


class PlanPersistenceService:

    def save_plan(
        self,
        db: Session,
        result: dict,
    ) -> Plan:

        planning_date: date = result["planning_date"]

        plan_id = self._generate_plan_id(db, planning_date)

        plan = Plan(
            plan_id=plan_id,
            planning_date=planning_date,
            block_type=result["block_type"],
            status="GENERATED",
            optimizer_status=result["status"],
            candidate_pairs=result["candidate_pairs"],
            assigned_count=result["assigned_count"],
            total_priority=result["total_priority"],
        )

        db.add(plan)

        for index, assignment in enumerate(result["assignments"], start=1):

            plan_assignment = PlanAssignment(
                assignment_id=f"{plan_id}-A{index:03d}",
                plan_id=plan_id,
                task_id=assignment["task_id"],
                section_id=assignment["section_id"],
                window_id=assignment["window_id"],
                resource_id=assignment.get("resource_id"),
                start_time=self._time_to_string(
                    assignment["start_time"]
                ),
                end_time=self._time_to_string(
                    assignment["end_time"]
                ),
                duration_min=assignment["duration_min"],
                priority_score=assignment["priority_score"],
                restriction_penalty=assignment.get(
                    "restriction_penalty",
                    0,
                ),
            )

            db.add(plan_assignment)

        db.commit()
        db.refresh(plan)

        return plan

    @staticmethod
    def _time_to_string(value) -> str:
        if hasattr(value, "strftime"):
            return value.strftime("%H:%M:%S")

        return str(value)

    @staticmethod
    def _generate_plan_id(
        db: Session,
        planning_date: date,
    ) -> str:

        date_part = planning_date.strftime("%Y%m%d")

        existing_count = (
            db.query(Plan)
            .filter(
                Plan.planning_date == planning_date,
            )
            .count()
        )

        return f"PLAN-{date_part}-{existing_count + 1:03d}"
