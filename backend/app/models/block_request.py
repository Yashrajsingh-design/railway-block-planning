from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BlockRequest(Base):
    __tablename__ = "block_requests"

    block_request_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    department_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    task_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    requested_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    preferred_start: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    preferred_end: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    minimum_duration_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    block_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    request_status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    priority_score: Mapped[Decimal | None] = mapped_column(
        Numeric,
        nullable=True,
    )

    authorization_status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    work_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    power_block_required: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    bundling_candidate: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )