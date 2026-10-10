"""FastAPI dependencies — authentication and authorization guards.

Frontend route protection is UX only; these server checks are the real authority.
"""
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import forbidden, unauthorized
from app.core.security import decode_access_token
from app.models.user import User
from app.services.auth_service import get_current_user


def get_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise unauthorized()
    return authorization.split(" ", 1)[1].strip()


def current_user(
    token: str = Depends(get_token),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    return get_current_user(db, payload.get("sub", ""))


def current_admin(user: User = Depends(current_user)) -> User:
    if user.role != "ADMIN":
        raise forbidden("Administrator access required.")
    return user
