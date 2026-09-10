from datetime import date, time

from sqlalchemy import Boolean, Date, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TrainEvent(Base):
    __tablename__ = "train_events"

    train_event_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    train_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    service_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    entry_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    exit_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    operational_priority: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    is_forecast: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )