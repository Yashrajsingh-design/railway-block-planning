from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PlanAssignment(Base):
    __tablename__ = "plan_assignments"

    assignment_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    plan_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    section_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    window_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    resource_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    start_time: Mapped[str] = mapped_column(String(20), nullable=False)
    end_time: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    priority_score: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    restriction_penalty: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
