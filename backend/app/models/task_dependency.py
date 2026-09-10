from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    dependency_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    predecessor_task_id: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    successor_task_id: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    dependency_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    reason: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )