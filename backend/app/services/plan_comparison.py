from datetime import date

from sqlalchemy.orm import Session

from app.services.baseline_planner import BaselinePlanner
from app.services.optimization_engine import OptimizationEngine


class PlanComparisonService:

    def compare(
        self,
        db: Session,
        planning_date: date,
        block_type: str,
    ) -> dict:

        baseline = BaselinePlanner().plan(
            db=db,
            planning_date=planning_date,
            block_type=block_type,
        )

        optimized = OptimizationEngine().optimize(
            db=db,
            planning_date=planning_date,
            block_type=block_type,
        )

        baseline_priority = baseline["total_priority"]

        optimized_priority = optimized["total_priority"]

        baseline_penalty = baseline[
            "total_restriction_penalty"
        ]

        optimized_penalty = round(
            sum(
                assignment.get(
                    "restriction_penalty",
                    0,
                )
                for assignment in optimized["assignments"]
            ),
            2,
        )

        baseline_effective = baseline[
            "effective_score"
        ]

        optimized_effective = round(
            optimized_priority - optimized_penalty,
            2,
        )

        effective_improvement = round(
            optimized_effective - baseline_effective,
            2,
        )

        if baseline_effective > 0:
            effective_improvement_percent = round(
                (
                    effective_improvement
                    / baseline_effective
                ) * 100,
                2,
            )
        else:
            effective_improvement_percent = 0

        return {
            "planning_date": planning_date,
            "block_type": block_type,

            "baseline": {
                "status": baseline["status"],
                "candidate_pairs": baseline[
                    "candidate_pairs"
                ],
                "assigned_count": baseline[
                    "assigned_count"
                ],
                "total_priority": baseline_priority,
                "total_restriction_penalty": baseline_penalty,
                "effective_score": baseline_effective,
                "assignments": baseline[
                    "assignments"
                ],
            },

            "optimized": {
                "status": optimized["status"],
                "candidate_pairs": optimized[
                    "candidate_pairs"
                ],
                "assigned_count": optimized[
                    "assigned_count"
                ],
                "total_priority": optimized_priority,
                "total_restriction_penalty": optimized_penalty,
                "effective_score": optimized_effective,
                "assignments": optimized[
                    "assignments"
                ],
            },

            "comparison": {
                "candidate_pairs_same": (
                    baseline["candidate_pairs"]
                    == optimized["candidate_pairs"]
                ),

                "additional_tasks_scheduled": (
                    optimized["assigned_count"]
                    - baseline["assigned_count"]
                ),

                "effective_score_improvement": (
                    effective_improvement
                ),

                "effective_score_improvement_percent": (
                    effective_improvement_percent
                ),
            },
        }
