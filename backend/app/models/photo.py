"""Photo metadata + review history models.

Images live in private object storage; this table holds metadata only.
SHA-256 hash gives integrity and duplicate detection.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import new_uuid, utcnow


class StudentPhoto(Base):
    __tablename__ = "student_photos"
    __table_args__ = (UniqueConstraint("submission_id", "sequence_number", name="u_photo_slot"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    submission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("student_submissions.id"), nullable=False, index=True
    )
    student_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(80), nullable=False, default="image/jpeg")
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    capture_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)  # client metadata (untrusted)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="VALID")  # VALID|INVALID
    validation_reason: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    submission = relationship("StudentSubmission", back_populates="photos")


class ReviewHistory(Base):
    __tablename__ = "review_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    submission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("student_submissions.id"), nullable=False, index=True
    )
    reviewer_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    action: Mapped[str] = mapped_column(String(32), nullable=False)  # START_REVIEW|APPROVE|REJECT|REQUEST_CORRECTION
    from_status: Mapped[str] = mapped_column(String(24), nullable=False)
    to_status: Mapped[str] = mapped_column(String(24), nullable=False)
    reason_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    submission_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    submission = relationship("StudentSubmission", back_populates="reviews")
