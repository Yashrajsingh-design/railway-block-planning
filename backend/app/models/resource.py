from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Resource(Base):
    __tablename__ = "resources"

    resource_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    resource_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    department_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    resource_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
    