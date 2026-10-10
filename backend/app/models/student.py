"""Student model — canonical student record with stable internal identity."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.user import new_uuid, utcnow


class Student(Base):
    __tablename__ = "students"
    __table_args__ = (
        UniqueConstraint("college_email", name="u_students_college_email"),
        UniqueConstraint("scholar_number", name="u_students_scholar_number"),
    )

    # Stable internal identifier — never changes (section/roll/year/email changes don't affect it)
    student_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    college_email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    scholar_number: Mapped[str] = mapped_column(String(32), nullable=False)
    roll_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    department: Mapped[str | None] = mapped_column(String(80), nullable=True)
    program: Mapped[str | None] = mapped_column(String(80), nullable=True)
    academic_year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    semester: Mapped[str | None] = mapped_column(String(10), nullable=True)
    year: Mapped[str | None] = mapped_column(String(10), nullable=True)
    section: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
