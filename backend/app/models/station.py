from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Station(Base):
    __tablename__ = "stations"

    station_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    division_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    station_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )