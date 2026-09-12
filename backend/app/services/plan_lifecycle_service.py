from sqlalchemy.orm import Session

from app.models.plan import Plan


class PlanLifecycleService:
    """
    Controls valid lifecycle transitions for generated maintenance plans.

    The optimizer generates recommendations, but an authorized human
    planner controls approval and execution state.
    """

    ALLOWED_TRANSITIONS = {
        "GENERATED": {"REVIEW", "CANCELLED"},
        "REVIEW": {"APPROVED", "REJECTED", "CANCELLED"},
        "APPROVED": {"EXECUTING", "CANCELLED"},
        "EXECUTING": {"COMPLETED"},
        "COMPLETED": set(),
        "REJECTED": {"REVIEW", "CANCELLED"},
        "CANCELLED": set(),
    }

    def transition(
        self,
        db: Session,
        plan_id: str,
        new_status: str,
    ) -> Plan:
        plan = (
            db.query(Plan)
            .filter(Plan.plan_id == plan_id)
            .first()
        )

        if plan is None:
            raise ValueError(f"Plan not found: {plan_id}")

        current_status = plan.status

        if new_status == current_status:
            raise ValueError(
                f"Plan is already in status: {current_status}"
            )

        allowed = self.ALLOWED_TRANSITIONS.get(current_status, set())

        if new_status not in allowed:
            raise ValueError(
                f"Invalid plan lifecycle transition: "
                f"{current_status} -> {new_status}"
            )

        plan.status = new_status

        db.commit()
        db.refresh(plan)

        return plan