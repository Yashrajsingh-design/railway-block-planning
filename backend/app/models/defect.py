from datetime import date

from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Defect(Base):
    __tablename__ = "defects"

    defect_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    asset_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    found_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    severity: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    defect_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )