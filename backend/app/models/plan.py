from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Plan(Base):
    __tablename__ = "plans"

    plan_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    planning_date: Mapped[date] = mapped_column(Date, nullable=False)
    block_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="GENERATED")
    optimizer_status: Mapped[str] = mapped_column(String(30), nullable=False)
    candidate_pairs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assigned_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_priority: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
