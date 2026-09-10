from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Section(Base):
    __tablename__ = "sections"

    section_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    division_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    from_station_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    to_station_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    route_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    track_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    electrified: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )