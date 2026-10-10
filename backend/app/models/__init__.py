"""SQLAlchemy model registry."""
from app.models.user import User
from app.models.student import Student
from app.models.submission import StudentSubmission, ACTIVE_STATUSES, TERMINAL_STATUSES
from app.models.photo import StudentPhoto, ReviewHistory
from app.models.audit import AuditEvent

__all__ = [
    "User",
    "Student",
    "StudentSubmission",
    "StudentPhoto",
    "ReviewHistory",
    "AuditEvent",
    "ACTIVE_STATUSES",
    "TERMINAL_STATUSES",
]
