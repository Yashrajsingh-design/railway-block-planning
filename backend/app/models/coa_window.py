from datetime import date, time

from sqlalchemy import Date, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CoaWindow(Base):
    __tablename__ = "coa_windows"

    window_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    start_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    end_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    duration_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    block_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    window_class: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )