from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    task_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    asset_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    department_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    task_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    defect_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    estimated_duration_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    priority_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    preferred_window: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    power_block_required: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )