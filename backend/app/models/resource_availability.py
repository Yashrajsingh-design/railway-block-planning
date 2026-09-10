from datetime import date, time

from sqlalchemy import Boolean, Date, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ResourceAvailability(Base):
    __tablename__ = "resource_availability"

    availability_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    resource_id: Mapped[str] = mapped_column(
        String,
        nullable=False,
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

    is_available: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    capacity: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    