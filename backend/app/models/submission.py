"""Submission model — separate entity from the final student record.

One active submission (DRAFT/SUBMITTED/UNDER_REVIEW/NEEDS_CORRECTION) per student.
`version` provides optimistic concurrency control for edits and review decisions.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import new_uuid, utcnow

ACTIVE_STATUSES = ("DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION")
TERMINAL_STATUSES = ("APPROVED", "REJECTED")


class StudentSubmission(Base):
    __tablename__ = "student_submissions"
    __table_args__ = (UniqueConstraint("user_id", "active_key", name="u_submissions_one_active"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    student_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    submission_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="DRAFT")
    # Non-NULL only while the submission is active (DRAFT/SUBMITTED/UNDER_REVIEW/NEEDS_CORRECTION);
    # set to NULL when reaching a terminal state — enforces one active submission per user.
    active_key: Mapped[str | None] = mapped_column(String(36), nullable=True, unique=True)
    form_data_json: Mapped[str] = mapped_column(String(8000), nullable=False, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    photos = relationship("StudentPhoto", back_populates="submission", cascade="all, delete-orphan")
    reviews = relationship("ReviewHistory", back_populates="submission", cascade="all, delete-orphan")
