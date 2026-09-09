from datetime import date, time

from sqlalchemy import Boolean, Date, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BlockRequest(Base):
    __tablename__ = "block_requests"

    request_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    department_id: Mapped[int] = mapped_column(Integer, nullable=False)
    section_id: Mapped[int] = mapped_column(Integer, nullable=False)

    location_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    asset_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    maintenance_task_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    preferred_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    preferred_start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    preferred_end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    minimum_duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    block_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    power_block_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    work_description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="SUBMITTED",
    )