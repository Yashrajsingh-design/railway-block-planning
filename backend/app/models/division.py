from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Division(Base):
    __tablename__ = "divisions"

    division_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    zone_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    division_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )