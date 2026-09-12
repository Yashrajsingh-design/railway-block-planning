from datetime import datetime

from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent
from app.models.plan import Plan


class PlanLifecycleService:
    """
    Controls valid lifecycle transitions for generated maintenance plans
    and records every transition in the audit trail.
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

        allowed = self.ALLOWED_TRANSITIONS.get(
            current_status,
            set(),
        )

        if new_status not in allowed:
            raise ValueError(
                f"Invalid plan lifecycle transition: "
                f"{current_status} -> {new_status}"
            )

        plan.status = new_status

        audit_event = AuditEvent(
            audit_event_id=self._generate_audit_id(db),
            plan_id=plan.plan_id,
            event_type="STATUS_CHANGE",
            from_status=current_status,
            to_status=new_status,
            message=self._build_message(
                current_status,
                new_status,
            ),
            actor="SYSTEM",
            created_at=datetime.utcnow(),
        )

        db.add(audit_event)

        db.commit()
        db.refresh(plan)

        return plan

    @staticmethod
    def _build_message(
        from_status: str,
        to_status: str,
    ) -> str:

        messages = {
            ("GENERATED", "REVIEW"):
                "Plan submitted for human review.",
            ("REVIEW", "APPROVED"):
                "Plan approved for execution.",
            ("REVIEW", "REJECTED"):
                "Plan rejected during human review.",
            ("REJECTED", "REVIEW"):
                "Rejected plan returned for review.",
            ("APPROVED", "EXECUTING"):
                "Plan execution started.",
            ("EXECUTING", "COMPLETED"):
                "Plan execution completed.",
            ("GENERATED", "CANCELLED"):
                "Generated plan cancelled.",
            ("REVIEW", "CANCELLED"):
                "Plan cancelled during review.",
            ("APPROVED", "CANCELLED"):
                "Approved plan cancelled.",
            ("REJECTED", "CANCELLED"):
                "Rejected plan cancelled.",
        }

        return messages.get(
            (from_status, to_status),
            f"Plan status changed from "
            f"{from_status} to {to_status}.",
        )

    @staticmethod
    def _generate_audit_id(db: Session) -> str:
        count = db.query(AuditEvent).count()
        return f"AUDIT-{count + 1:06d}"