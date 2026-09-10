from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.defect import Defect
from app.models.maintenance_task import MaintenanceTask


class PriorityEngine:

    SEVERITY_SCORES = {
        "CRITICAL": 100.0,
        "HIGH": 80.0,
        "MEDIUM": 60.0,
        "LOW": 30.0,
        "MINOR": 20.0,
    }

    def calculate(
        self,
        db: Session,
        task_id: str,
        planning_date: date,
    ):

        # Find maintenance task
        task = db.execute(
            select(MaintenanceTask).where(
                MaintenanceTask.task_id == task_id
            )
        ).scalar_one_or_none()

        if task is None:
            return None

        # Find asset
        asset = None

        if task.asset_id:
            asset = db.execute(
                select(Asset).where(
                    Asset.asset_id == task.asset_id
                )
            ).scalar_one_or_none()

        # Find defect
        defect = None

        if task.defect_id:
            defect = db.execute(
                select(Defect).where(
                    Defect.defect_id == task.defect_id
                )
            ).scalar_one_or_none()

        # 1. Asset criticality
        asset_criticality = 0.0

        if asset and asset.criticality_score is not None:
            asset_criticality = min(
                max(float(asset.criticality_score), 0.0),
                100.0,
            )

        # 2. Defect severity
        defect_severity = 0.0

        if defect and defect.severity:
            defect_severity = self.SEVERITY_SCORES.get(
                defect.severity.upper(),
                0.0,
            )

        # 3. Urgency based on due date
        urgency = self._calculate_urgency(
            task.due_date,
            planning_date,
        )

        # 4. Existing task priority
        existing_priority = 0.0

        if task.priority_score is not None:
            existing_priority = min(
                max(float(task.priority_score), 0.0),
                100.0,
            )

        # Weighted score
        final_score = (
            asset_criticality * 0.30
            + defect_severity * 0.30
            + urgency * 0.25
            + existing_priority * 0.15
        )

        final_score = round(
            min(max(final_score, 0.0), 100.0),
            2,
        )

        if final_score >= 80:
            priority_level = "CRITICAL"
        elif final_score >= 60:
            priority_level = "HIGH"
        elif final_score >= 40:
            priority_level = "MEDIUM"
        else:
            priority_level = "LOW"

        return {
            "task_id": task.task_id,
            "priority_score": final_score,
            "asset_criticality_score": asset_criticality,
            "defect_severity_score": defect_severity,
            "urgency_score": urgency,
            "existing_task_priority": existing_priority,
            "priority_level": priority_level,
        }

    @staticmethod
    def _calculate_urgency(
        due_date,
        planning_date: date,
    ) -> float:

        if due_date is None:
            return 0.0

        days_remaining = (
            due_date - planning_date
        ).days

        if days_remaining <= 0:
            return 100.0

        if days_remaining <= 3:
            return 90.0

        if days_remaining <= 7:
            return 75.0

        if days_remaining <= 14:
            return 60.0

        if days_remaining <= 30:
            return 40.0

        return 20.0