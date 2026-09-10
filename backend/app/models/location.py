from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Location(Base):
    __tablename__ = "locations"

    location_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    section_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    km_from_origin: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )