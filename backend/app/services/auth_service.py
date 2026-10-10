"""Auth service — login with rate limiting, generic errors, session probe, password change."""
import time
from collections import defaultdict, deque

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ApiError, invalid_credentials, rate_limited, validation_failed
from app.core.security import create_access_token, hash_password, verify_password
from app.models.student import Student
from app.models.user import User, utcnow
from app.services import audit_service
from app.services.validation_service import normalize_email

# In-memory sliding window rate limiter (per-instance; swap for Redis when scaling out)
_attempts: dict[str, deque[float]] = defaultdict(deque)


def _check_rate_limit(key: str) -> None:
    now = time.monotonic()
    window = settings.login_rate_limit_window_seconds
    dq = _attempts[key]
    while dq and now - dq[0] > window:
        dq.popleft()
    if len(dq) >= settings.login_rate_limit_attempts:
        raise rate_limited()


def _record_failure(key: str) -> None:
    _attempts[key].append(time.monotonic())


def reset_rate_limits() -> None:
    _attempts.clear()


def login(db: Session, email: str, password: str) -> tuple[User, str]:
    normalized = normalize_email(email)
    _check_rate_limit(normalized)

    user = db.query(User).filter(User.email == normalized).one_or_none()

    if user is None or not verify_password(password, user.password_hash):
        _record_failure(normalized)
        audit_service.record(
            db,
            "LOGIN_FAILED",
            actor_user_id=user.id if user else None,
            entity_type="user",
            entity_id=user.id if user else None,
            detail={"email": normalized},
        )
        db.commit()
        raise invalid_credentials()

    if user.status in ("SUSPENDED", "DISABLED"):
        audit_service.record(db, "LOGIN_DENIED", actor_user_id=user.id, detail={"status": user.status})
        db.commit()
        raise ApiError(403, "ACCOUNT_DISABLED", "This account is disabled. Contact your department.")

    user.last_login_at = utcnow()
    audit_service.record(db, "LOGIN_SUCCESS", actor_user_id=user.id, actor_role=user.role)
    db.commit()

    token = create_access_token(user.id, user.role)
    return user, token


def get_current_user(db: Session, user_id: str) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise ApiError(401, "UNAUTHORIZED", "Session no longer valid.")
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise ApiError(400, "INVALID_CREDENTIALS", "Current password is incorrect.")
    if len(new_password) < 8:
        raise validation_failed("Password too short.", details={"new_password": ["Minimum 8 characters."]})
    if current_password == new_password:
        raise validation_failed("Password unchanged.", details={"new_password": ["Choose a new password."]})

    user.password_hash = hash_password(new_password)
    user.is_first_login = False
    audit_service.record(db, "PASSWORD_CHANGED", actor_user_id=user.id, actor_role=user.role)
    db.commit()


def user_public_dict(user: User, include_email: bool = True) -> dict:
    return {
        "id": user.id,
        "email": user.email if include_email else None,
        "role": user.role,
        "status": user.status,
        "is_first_login": user.is_first_login,
    }


def link_student_for_user(db: Session, user: User) -> Student | None:
    return db.query(Student).filter(Student.user_id == user.id).one_or_none()
