"""Submission repository — query logic for the admin queue lives here, not in routes."""
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.photo import StudentPhoto
from app.models.student import Student
from app.models.submission import StudentSubmission, ACTIVE_STATUSES


def admin_queue(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "desc",
) -> tuple[list[StudentSubmission], int]:
    query = db.query(StudentSubmission).options(joinedload(StudentSubmission.photos))

    if status:
        query = query.filter(StudentSubmission.status == status)
    if search:
        term = f"%{search.strip()}%"
        query = (
            query.join(Student, Student.user_id == StudentSubmission.user_id, isouter=True)
            .filter(or_(Student.full_name.ilike(term), Student.roll_number.ilike(term),
                        Student.scholar_number.ilike(term), StudentSubmission.id.ilike(term)))
        )

    total = query.count()

    sort_columns = {
        "submitted_at": StudentSubmission.submitted_at,
        "updated_at": StudentSubmission.updated_at,
        "status": StudentSubmission.status,
        "created_at": StudentSubmission.created_at,
    }
    sort_col = sort_columns.get(sort_by or "updated_at", StudentSubmission.updated_at)
    sort_col = sort_col.desc() if sort_order == "desc" else sort_col.asc()

    items = (
        query.order_by(sort_col)
        .offset(max(0, (page - 1) * page_size))
        .limit(min(max(page_size, 1), 100))
        .all()
    )
    return items, total


def summary_counts(db: Session) -> dict[str, int]:
    """Backend-provided counts — clients must not download all rows to compute these."""
    rows = (
        db.query(StudentSubmission.status, func.count(StudentSubmission.id))
        .group_by(StudentSubmission.status)
        .all()
    )
    by_status = dict(rows)
    return {
        "pending": by_status.get("SUBMITTED", 0),
        "under_review": by_status.get("UNDER_REVIEW", 0),
        "needs_correction": by_status.get("NEEDS_CORRECTION", 0),
        "approved": by_status.get("APPROVED", 0),
        "rejected": by_status.get("REJECTED", 0),
    }


def photo_count(db: Session, submission_id: str) -> int:
    return db.query(func.count(StudentPhoto.id)).filter(StudentPhoto.submission_id == submission_id).scalar() or 0


def active_statuses() -> tuple[str, ...]:
    return ACTIVE_STATUSES
