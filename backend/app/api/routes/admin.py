"""Admin review routes — queue, summary, approve/reject/request-correction. All actions audited.

Contract-aligned with frontend/src/lib/api/endpoints.ts (PROMPT 1 "FINAL API GROUP"):
- Admin identity comes from the token (current_admin).
- Review actions require `version` (optimistic concurrency) and are idempotent on repeats.
- Literal paths ("/submissions/summary") are declared before "/submissions/{submission_id}".
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_admin
from app.core.database import get_db
from app.core.exceptions import not_found, ok
from app.models.photo import ReviewHistory
from app.models.student import Student
from app.models.submission import StudentSubmission
from app.models.user import User
from app.repositories.submission_repository import admin_queue, summary_counts
from app.schemas.admin import AdminReviewRequest
from app.services import submission_service as svc

router = APIRouter(prefix="/api/v1/admin", tags=["admin"], dependencies=[Depends(current_admin)])


def _load(db: Session, submission_id: str) -> StudentSubmission:
    submission = db.get(StudentSubmission, submission_id)
    if submission is None:
        raise not_found("Submission")
    return submission


def _queue_item(submission: StudentSubmission) -> dict:
    form = svc.form_data_of(submission)
    return {
        "id": submission.id,
        "status": submission.status,
        "version": submission.submission_version,
        "student": {
            "id": submission.student_id,
            "full_name": form.get("full_name") or "—",
            "roll_no": form.get("roll_number"),
            "department": form.get("department"),
        },
        "photo_count": len(submission.photos or []),
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
    }


def _detail_payload(db: Session, submission: StudentSubmission) -> dict:
    """AdminSubmissionDetail — same shape for GET detail and every review action."""
    reviews = db.scalars(
        select(ReviewHistory)
        .where(ReviewHistory.submission_id == submission.id)
        .order_by(ReviewHistory.created_at.asc())
    ).all()
    user = db.get(User, submission.user_id)
    student = db.query(Student).filter(Student.user_id == submission.user_id).one_or_none()

    data = svc.submission_to_dict(submission)
    data.update(
        {
            "admin_actions": svc.admin_actions_for(submission),
            "student_actions": data.pop("available_actions"),
            "reviewer": {"id": user.id if user else None, "email": user.email if user else None},
            "student_profile": (
                {
                    "student_id": student.student_id,
                    "full_name": student.full_name,
                    "college_email": student.college_email,
                    "roll_number": student.roll_number,
                    "department": student.department,
                }
                if student
                else None
            ),
            "reviews": [
                {
                    "id": r.id,
                    "action": r.action,
                    "from_status": r.from_status,
                    "to_status": r.to_status,
                    "reviewer_name": r.reviewer_name,
                    "reason_code": r.reason_code,
                    "reason": r.reason,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reviews
            ],
        }
    )
    return data


@router.get("/submissions")
def queue(
    status: str | None = Query(
        default=None, description="DRAFT|SUBMITTED|UNDER_REVIEW|NEEDS_CORRECTION|APPROVED|REJECTED"
    ),
    search: str | None = Query(default=None, description="Search name / roll / scholar / submission id"),
    sort_by: str | None = Query(default=None),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> object:
    items, total = admin_queue(
        db,
        page=page,
        page_size=page_size,
        status=status,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return ok(
        {
            "items": [_queue_item(s) for s in items],
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    )


@router.get("/submissions/summary")
def summary(db: Session = Depends(get_db)) -> object:
    """Backend-computed counts — clients never download all rows to count them."""
    return ok(summary_counts(db))


@router.get("/submissions/{submission_id}")
def detail(submission_id: str, db: Session = Depends(get_db)) -> object:
    return ok(_detail_payload(db, _load(db, submission_id)))


@router.post("/submissions/{submission_id}/start-review")
def start_review(
    submission_id: str,
    payload: AdminReviewRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(current_admin),
) -> object:
    submission = svc.start_review(db, admin, _load(db, submission_id), payload.version)
    return ok(_detail_payload(db, submission))


@router.post("/submissions/{submission_id}/approve")
def approve(
    submission_id: str,
    payload: AdminReviewRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(current_admin),
) -> object:
    submission = svc.approve(db, admin, _load(db, submission_id), payload.version)
    return ok(_detail_payload(db, submission))


@router.post("/submissions/{submission_id}/reject")
def reject(
    submission_id: str,
    payload: AdminReviewRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(current_admin),
) -> object:
    submission = svc.reject(db, admin, _load(db, submission_id), payload.version, payload.reason_code, payload.reason)
    return ok(_detail_payload(db, submission))


@router.post("/submissions/{submission_id}/request-correction")
def request_correction(
    submission_id: str,
    payload: AdminReviewRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(current_admin),
) -> object:
    submission = svc.request_correction(
        db, admin, _load(db, submission_id), payload.version, payload.reason_code, payload.reason
    )
    return ok(_detail_payload(db, submission))


@router.get("/audit")
def audit_log(limit: int = Query(default=50, ge=1, le=200), db: Session = Depends(get_db)) -> object:
    from app.models.audit import AuditEvent

    rows = db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)).all()
    return ok(
        [
            {
                "id": r.id,
                "event_type": r.event_type,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "actor_user_id": r.actor_user_id,
                "actor_role": r.actor_role,
                "detail": r.detail,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    )
