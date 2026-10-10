"""Submission service — state machine, CRUD, photos, admin review.

All state transitions and editability rules are centralized here
(SubmissionEditPolicy) so routes never scatter `if status == ...` logic.
"""
import json

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ApiError, conflict, not_found, forbidden
from app.models.photo import ReviewHistory, StudentPhoto
from app.models.student import Student
from app.models.submission import StudentSubmission, ACTIVE_STATUSES
from app.models.user import User, utcnow
from app.services import audit_service, validation_service
from app.services.storage_service import storage_service

# ----- State machine -----

TRANSITIONS: dict[str, set[str]] = {
    "DRAFT": {"SUBMITTED"},
    "NEEDS_CORRECTION": {"SUBMITTED"},
    "SUBMITTED": {"UNDER_REVIEW", "APPROVED", "REJECTED", "NEEDS_CORRECTION"},
    "UNDER_REVIEW": {"APPROVED", "REJECTED", "NEEDS_CORRECTION"},
    "APPROVED": set(),
    "REJECTED": set(),
}

EDITABLE_STATUSES = {"DRAFT", "NEEDS_CORRECTION"}
REVIEWABLE_STATUSES = {"SUBMITTED", "UNDER_REVIEW"}

STUDENT_ACTIONS = {
    "DRAFT": ["edit", "submit"],
    "NEEDS_CORRECTION": ["edit", "submit"],
    "SUBMITTED": [],
    "UNDER_REVIEW": [],
    "APPROVED": [],
    "REJECTED": [],
}

ADMIN_ACTIONS = {
    "SUBMITTED": ["start_review", "approve", "reject", "request_correction"],
    "UNDER_REVIEW": ["approve", "reject", "request_correction"],
}


class SubmissionEditPolicy:
    """Central editability authority for students."""

    @staticmethod
    def can_edit(submission: StudentSubmission) -> bool:
        return submission.status in EDITABLE_STATUSES

    @staticmethod
    def can_submit(submission: StudentSubmission) -> bool:
        return submission.status in EDITABLE_STATUSES


def _assert_transition(current: str, target: str) -> None:
    if target not in TRANSITIONS.get(current, set()):
        raise conflict(
            "SUBMISSION_LOCKED",
            f"Cannot move a submission from {current} to {target}.",
        )


# ----- Serialization -----

def photo_to_dict(photo: StudentPhoto) -> dict:
    valid = photo.status == "VALID"
    return {
        "id": photo.id,
        "sequence_number": photo.sequence_number,
        "status": photo.status,
        "capture_mode": photo.capture_mode,
        "validation": {
            "valid": valid,
            "reason_code": photo.validation_reason if not valid else None,
            "reason": photo.validation_reason if not valid else None,
        },
        "created_at": photo.created_at.isoformat() if photo.created_at else None,
    }


def validation_summary(submission: StudentSubmission) -> dict:
    photos = list(submission.photos or [])
    valid = sum(1 for p in photos if p.status == "VALID")
    invalid = len(photos) - valid
    required = settings.photo_min
    return {
        "required": required,
        "valid": valid,
        "invalid": invalid,
        "remaining": max(0, required - valid),
    }


def form_data_of(submission: StudentSubmission) -> dict:
    try:
        return json.loads(submission.form_data_json or "{}")
    except json.JSONDecodeError:
        return {}


def submission_to_dict(submission: StudentSubmission) -> dict:
    return {
        "id": submission.id,
        "status": submission.status,
        "version": submission.submission_version,
        "form_data": form_data_of(submission),
        "photos": [photo_to_dict(p) for p in sorted(submission.photos or [], key=lambda p: p.sequence_number)],
        "validation_summary": validation_summary(submission),
        "created_at": submission.created_at.isoformat() if submission.created_at else None,
        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "available_actions": STUDENT_ACTIONS.get(submission.status, []),
    }


def admin_actions_for(submission: StudentSubmission) -> list[str]:
    return ADMIN_ACTIONS.get(submission.status, [])


# ----- Queries -----

def get_active_submission(db: Session, user_id: str) -> StudentSubmission | None:
    return (
        db.query(StudentSubmission)
        .filter(StudentSubmission.user_id == user_id, StudentSubmission.active_key.isnot(None))
        .one_or_none()
    )


def get_latest_submission(db: Session, user_id: str) -> StudentSubmission | None:
    active = get_active_submission(db, user_id)
    if active:
        return active
    return (
        db.query(StudentSubmission)
        .filter(StudentSubmission.user_id == user_id)
        .order_by(StudentSubmission.created_at.desc())
        .first()
    )


def get_owned_submission(db: Session, user: User, submission_id: str) -> StudentSubmission:
    submission = db.get(StudentSubmission, submission_id)
    # IDOR guard: students can only ever reach their own submission
    if submission is None or (user.role != "ADMIN" and submission.user_id != user.id):
        raise not_found("Submission")
    return submission


# ----- Student operations -----

def create_draft(db: Session, user: User) -> StudentSubmission:
    existing = get_active_submission(db, user.id)
    if existing is not None:
        raise conflict("CONFLICT", "You already have an active submission.")
    submission = StudentSubmission(user_id=user.id, status="DRAFT", active_key=user.id, form_data_json="{}")
    db.add(submission)
    audit_service.record(
        db, "SUBMISSION_CREATED", actor_user_id=user.id, actor_role=user.role,
        entity_type="submission", entity_id=submission.id,
    )
    db.commit()
    db.refresh(submission)
    return submission


def update_submission(
    db: Session, user: User, submission: StudentSubmission, form_data: dict, version: int
) -> StudentSubmission:
    if version != submission.submission_version:
        raise conflict("CONCURRENT_UPDATE", "Your information was updated elsewhere. Reload before continuing.")
    if not SubmissionEditPolicy.can_edit(submission):
        raise conflict("SUBMISSION_LOCKED", f"Submission is not editable in status {submission.status}.")

    cleaned = validation_service.validate_form_data(form_data, strict=False)
    merged = {**form_data_of(submission), **cleaned}
    # drop keys explicitly set to empty string
    for key, value in form_data.items():
        if value == "" or value is None:
            merged.pop(key, None)

    submission.form_data_json = json.dumps(merged)[:8000]
    submission.submission_version += 1
    audit_service.record(
        db, "SUBMISSION_UPDATED", actor_user_id=user.id, actor_role=user.role,
        entity_type="submission", entity_id=submission.id,
        detail={"version": submission.submission_version},
    )
    db.commit()
    db.refresh(submission)
    return submission


def submit(db: Session, user: User, submission: StudentSubmission, version: int) -> StudentSubmission:
    if version != submission.submission_version:
        raise conflict("CONCURRENT_UPDATE", "Your information was updated elsewhere. Reload before continuing.")
    if not SubmissionEditPolicy.can_submit(submission):
        raise conflict("SUBMISSION_LOCKED", f"Cannot submit while status is {submission.status}.")

    # Server-side validation is authoritative
    cleaned = validation_service.validate_form_data(form_data_of(submission), strict=True)
    valid_photos = [p for p in submission.photos or [] if p.status == "VALID"]
    validation_service.validate_photo_readiness(len(valid_photos))

    submission.form_data_json = json.dumps(cleaned)[:8000]
    _assert_transition(submission.status, "SUBMITTED")
    submission.status = "SUBMITTED"
    submission.submission_version += 1
    submission.submitted_at = utcnow()

    # Copy canonical fields onto the student profile draft (approved store is written on approval)
    audit_service.record(
        db, "SUBMISSION_SUBMITTED", actor_user_id=user.id, actor_role=user.role,
        entity_type="submission", entity_id=submission.id,
        detail={"photos": len(valid_photos)},
    )
    db.commit()
    db.refresh(submission)
    return submission


# ----- Photo operations -----

def upload_photo(
    db: Session,
    user: User,
    submission: StudentSubmission,
    *,
    sequence_number: int,
    content: bytes,
    content_type: str,
    capture_mode: str | None,
) -> StudentPhoto:
    if not SubmissionEditPolicy.can_edit(submission):
        raise conflict("SUBMISSION_LOCKED", f"Photos cannot be changed while status is {submission.status}.")
    if sequence_number < 1 or sequence_number > settings.photo_max:
        raise ApiError(422, "INVALID_VALUE", f"Photo slot must be between 1 and {settings.photo_max}.")
    if not content:
        raise ApiError(422, "PHOTO_INVALID", "Empty file.")
    if len(content) > settings.max_upload_bytes:
        raise ApiError(413, "PHOTO_INVALID", f"File exceeds {settings.max_upload_bytes // (1024 * 1024)} MB limit.")
    if content_type not in settings.allowed_image_type_list:
        raise ApiError(415, "PHOTO_INVALID", "Only JPEG, PNG or WebP images are accepted.")

    digest = storage_service.sha256(content)

    # Idempotency: same slot → replace; same bytes already in this submission → return existing
    existing_same_bytes = (
        db.query(StudentPhoto).filter(StudentPhoto.submission_id == submission.id, StudentPhoto.sha256 == digest)
        .one_or_none()
    )
    if existing_same_bytes and existing_same_bytes.sequence_number != sequence_number:
        return existing_same_bytes

    slot = (
        db.query(StudentPhoto)
        .filter(StudentPhoto.submission_id == submission.id, StudentPhoto.sequence_number == sequence_number)
        .one_or_none()
    )

    key = storage_service.build_key(user.id, submission.id, sequence_number)
    storage_service.save_photo(key, content)  # hash file integrity on disk

    if slot:
        storage_service.delete_photo(slot.storage_key)
        slot.storage_key = key
        slot.content_type = content_type
        slot.size_bytes = len(content)
        slot.sha256 = digest
        slot.capture_mode = capture_mode
        slot.status = "VALID"
        slot.validation_reason = None
        photo = slot
    else:
        photo = StudentPhoto(
            submission_id=submission.id,
            student_id=submission.student_id,
            sequence_number=sequence_number,
            storage_key=key,
            content_type=content_type,
            size_bytes=len(content),
            sha256=digest,
            capture_mode=capture_mode,
            status="VALID",
        )
        db.add(photo)

    submission.submission_version += 1
    audit_service.record(
        db, "PHOTO_UPLOADED", actor_user_id=user.id, actor_role=user.role,
        entity_type="submission", entity_id=submission.id,
        detail={"slot": sequence_number, "sha256": digest, "bytes": len(content)},
    )
    db.commit()
    db.refresh(photo)
    return photo


def delete_photo(db: Session, user: User, submission: StudentSubmission, photo_id: str) -> None:
    if not SubmissionEditPolicy.can_edit(submission):
        raise conflict("SUBMISSION_LOCKED", f"Photos cannot be changed while status is {submission.status}.")
    photo = db.get(StudentPhoto, photo_id)
    if photo is None or photo.submission_id != submission.id:
        raise not_found("Photo")
    storage_service.delete_photo(photo.storage_key)
    db.delete(photo)
    submission.submission_version += 1
    audit_service.record(
        db, "PHOTO_DELETED", actor_user_id=user.id, actor_role=user.role,
        entity_type="submission", entity_id=submission.id, detail={"slot": photo.sequence_number},
    )
    db.commit()


def get_photo(db: Session, submission: StudentSubmission, photo_id: str) -> StudentPhoto:
    photo = db.get(StudentPhoto, photo_id)
    if photo is None or photo.submission_id != submission.id:
        raise not_found("Photo")
    return photo


# ----- Admin review operations (transactional + idempotent) -----

def _require_version(submission: StudentSubmission, version: int, stale_code: str, stale_msg: str) -> None:
    if version != submission.submission_version:
        raise conflict(stale_code, stale_msg)


def _record_review(
    db: Session,
    admin: User,
    submission: StudentSubmission,
    action: str,
    from_status: str,
    to_status: str,
    reason_code: str | None,
    reason: str | None,
) -> None:
    db.add(
        ReviewHistory(
            submission_id=submission.id,
            reviewer_user_id=admin.id,
            reviewer_name=admin.email,
            action=action,
            from_status=from_status,
            to_status=to_status,
            reason_code=reason_code,
            reason=reason,
            submission_version=submission.submission_version,
        )
    )


def start_review(db: Session, admin: User, submission: StudentSubmission, version: int) -> StudentSubmission:
    if submission.status == "UNDER_REVIEW":
        return submission  # idempotent
    _require_version(submission, version, "REVIEW_VERSION_STALE", "This submission has changed. Refresh before reviewing.")
    _assert_transition(submission.status, "UNDER_REVIEW")
    from_status = submission.status
    submission.status = "UNDER_REVIEW"
    submission.submission_version += 1
    _record_review(db, admin, submission, "START_REVIEW", from_status, "UNDER_REVIEW", None, None)
    audit_service.record(
        db, "REVIEW_STARTED", actor_user_id=admin.id, actor_role="ADMIN",
        entity_type="submission", entity_id=submission.id,
    )
    db.commit()
    db.refresh(submission)
    return submission


def approve(db: Session, admin: User, submission: StudentSubmission, version: int) -> StudentSubmission:
    if submission.status == "APPROVED":
        return submission  # approval idempotency: repeated approval is safe
    _require_version(submission, version, "REVIEW_VERSION_STALE", "This submission has changed. Refresh before reviewing.")
    _assert_transition(submission.status, "APPROVED")

    from_status = submission.status
    submission.status = "APPROVED"
    submission.submission_version += 1
    # Release the one-active-submission slot; approval is terminal
    submission.active_key = None

    _sync_student_record(db, submission)

    _record_review(db, admin, submission, "APPROVE", from_status, "APPROVED", None, None)
    audit_service.record(
        db, "SUBMISSION_APPROVED", actor_user_id=admin.id, actor_role="ADMIN",
        entity_type="submission", entity_id=submission.id, detail={"from": from_status},
    )
    db.commit()  # single transaction: status + student record + history + audit
    db.refresh(submission)
    return submission


def _sync_student_record(db: Session, submission: StudentSubmission) -> None:
    """On approval, upsert the canonical student master record."""
    data = form_data_of(submission)
    user = db.get(User, submission.user_id)
    if user is None:
        return
    student = db.query(Student).filter(Student.user_id == user.id).one_or_none()
    fields = {
        "college_email": user.email,
        "full_name": data.get("full_name") or (student.full_name if student else None),
        "roll_number": data.get("roll_number"),
        "department": data.get("department"),
        "program": data.get("program"),
        "academic_year": data.get("academic_year"),
        "semester": data.get("semester"),
        "year": data.get("year"),
        "section": data.get("section"),
        "phone": data.get("phone"),
    }
    if student is None:
        if not fields["full_name"]:
            return  # cannot create a record without a name
        # scholar_number: roll number fallback keeps uniqueness for provisioned students
        fields["scholar_number"] = data.get("roll_number") or user.email.split("@")[0]
        student = Student(user_id=user.id, status="ACTIVE", **fields)
        db.add(student)
    else:
        for key, value in fields.items():
            if value:
                setattr(student, key, value)
        student.status = "ACTIVE"
    submission.student_id = student.student_id if student.student_id else None
    db.flush()
    if submission.student_id is None and student.student_id:
        submission.student_id = student.student_id


def reject(
    db: Session, admin: User, submission: StudentSubmission, version: int,
    reason_code: str | None, reason: str | None,
) -> StudentSubmission:
    if submission.status == "REJECTED":
        return submission  # idempotent
    if not reason_code:
        raise ApiError(422, "VALIDATION_FAILED", "A reason code is required to reject.", details={"reason_code": ["Required."]})
    _require_version(submission, version, "REVIEW_VERSION_STALE", "This submission has changed. Refresh before reviewing.")
    _assert_transition(submission.status, "REJECTED")

    from_status = submission.status
    submission.status = "REJECTED"
    submission.submission_version += 1
    submission.active_key = None
    _record_review(db, admin, submission, "REJECT", from_status, "REJECTED", reason_code, reason)
    audit_service.record(
        db, "SUBMISSION_REJECTED", actor_user_id=admin.id, actor_role="ADMIN",
        entity_type="submission", entity_id=submission.id, detail={"reason_code": reason_code},
    )
    db.commit()
    db.refresh(submission)
    return submission


def request_correction(
    db: Session, admin: User, submission: StudentSubmission, version: int,
    reason_code: str | None, reason: str | None,
) -> StudentSubmission:
    if submission.status == "NEEDS_CORRECTION":
        return submission  # idempotent
    if not reason_code:
        raise ApiError(
            422, "VALIDATION_FAILED", "A reason code is required to request corrections.",
            details={"reason_code": ["Required."]},
        )
    _require_version(submission, version, "REVIEW_VERSION_STALE", "This submission has changed. Refresh before reviewing.")
    _assert_transition(submission.status, "NEEDS_CORRECTION")

    from_status = submission.status
    submission.status = "NEEDS_CORRECTION"
    submission.submission_version += 1
    _record_review(db, admin, submission, "REQUEST_CORRECTION", from_status, "NEEDS_CORRECTION", reason_code, reason)
    audit_service.record(
        db, "CORRECTION_REQUESTED", actor_user_id=admin.id, actor_role="ADMIN",
        entity_type="submission", entity_id=submission.id, detail={"reason_code": reason_code},
    )
    db.commit()
    db.refresh(submission)
    return submission
