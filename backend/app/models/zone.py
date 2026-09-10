from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Zone(Base):
    __tablename__ = "zones"

    zone_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    zone_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )