"""Submission routes — student CRUD, submit, photo slots. Ownership from token only."""
from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ApiError, ok
from app.models.submission import StudentSubmission
from app.models.user import User
from app.schemas.submission import SubmissionPatchRequest, SubmitRequest
from app.services import submission_service as svc
from app.services.storage_service import storage_service

router = APIRouter(prefix="/api/v1/submissions", tags=["submissions"])


def _load(db: Session, user: User, submission_id: str) -> StudentSubmission:
    return svc.get_owned_submission(db, user, submission_id)


# NOTE: literal paths ("/me", "/form-config") are declared before "/{submission_id}".


@router.get("/form-config")
def form_config() -> object:
    """Configurable institutional data — photo slot count and requiredness come from the backend."""
    from app.services.validation_service import REQUIRED_FIELDS

    return ok(
        {
            "photo_min": settings.photo_min,
            "photo_max": settings.photo_max,
            "required_fields": REQUIRED_FIELDS,
            "statuses": ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION", "APPROVED", "REJECTED"],
        }
    )


@router.get("/me")
def my_submission(db: Session = Depends(get_db), user: User = Depends(current_user)) -> object:
    submission = svc.get_latest_submission(db, user.id)
    if submission is None:
        raise ApiError(404, "NOT_FOUND", "No submission yet.")
    return ok(svc.submission_to_dict(submission))


@router.post("")
def create_submission(db: Session = Depends(get_db), user: User = Depends(current_user)) -> object:
    submission = svc.create_draft(db, user)
    return ok(svc.submission_to_dict(submission), status_code=201)


@router.get("/{submission_id}")
def get_submission(
    submission_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    submission = _load(db, user, submission_id)
    return ok(svc.submission_to_dict(submission))


@router.patch("/{submission_id}")
def patch_submission(
    submission_id: str,
    payload: SubmissionPatchRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    submission = _load(db, user, submission_id)
    updated = svc.update_submission(db, user, submission, payload.form_data, payload.version)
    return ok(svc.submission_to_dict(updated))


@router.post("/{submission_id}/submit")
def submit_submission(
    submission_id: str,
    payload: SubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    submission = _load(db, user, submission_id)
    updated = svc.submit(db, user, submission, payload.version)
    return ok(svc.submission_to_dict(updated))


# ----- Photos -----

@router.post("/{submission_id}/photos")
async def upload_photo(
    submission_id: str,
    file: UploadFile = File(...),
    sequence_number: int = Form(...),
    capture_mode: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    submission = _load(db, user, submission_id)
    content = await file.read()
    photo = svc.upload_photo(
        db,
        user,
        submission,
        sequence_number=sequence_number,
        content=content,
        content_type=file.content_type or "application/octet-stream",
        capture_mode=capture_mode,
    )
    return ok(svc.photo_to_dict(photo), status_code=201)


@router.get("/{submission_id}/photos/{photo_id}")
def photo_meta(
    submission_id: str,
    photo_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    submission = _load(db, user, submission_id)
    photo = svc.get_photo(db, submission, photo_id)
    return ok(svc.photo_to_dict(photo))


@router.delete("/{submission_id}/photos/{photo_id}")
def remove_photo(
    submission_id: str,
    photo_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    submission = _load(db, user, submission_id)
    svc.delete_photo(db, user, submission, photo_id)
    return ok({"deleted": True})


@router.get("/{submission_id}/photos/{photo_id}/url")
def signed_photo_url(
    submission_id: str,
    photo_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    """Short-lived signed URL — storage never exposed publicly."""
    submission = _load(db, user, submission_id)
    svc.get_photo(db, submission, photo_id)
    return ok({"url": storage_service.sign_photo_url(submission_id, photo_id), "expires_in": 300})


@router.get("/{submission_id}/photos/{photo_id}/download")
def download_photo(submission_id: str, photo_id: str, token: str, db: Session = Depends(get_db)) -> object:
    """Signed-URL delivery (authorized by token; no session header needed for <img> tags)."""
    storage_service.verify_photo_token(token, submission_id, photo_id)
    submission = db.get(StudentSubmission, submission_id)
    if submission is None:
        raise ApiError(404, "NOT_FOUND", "Submission not found.")
    photo = svc.get_photo(db, submission, photo_id)
    content = storage_service.read_photo(photo.storage_key)
    return Response(
        content=content,
        media_type=photo.content_type,
        headers={"Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff"},
    )
