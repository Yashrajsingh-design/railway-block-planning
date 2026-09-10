from datetime import date

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Asset(Base):
    __tablename__ = "assets"

    asset_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    department_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    location_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    asset_type_code: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    asset_type_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    installation_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    criticality_score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )