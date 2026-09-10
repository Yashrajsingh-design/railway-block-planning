from datetime import date

from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Restriction(Base):
    __tablename__ = "restrictions"

    restriction_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    section_id: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    restriction_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    restriction_code: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    severity: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )