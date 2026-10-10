"""Password hashing (bcrypt) and JWT access-token helpers.

Security invariants:
- Passwords are never stored, logged, or returned in plaintext.
- Tokens are short-lived access credentials; the backend stays the authorization authority.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings
from app.core.exceptions import unauthorized


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_ttl_minutes),
        "jti": str(__import__("uuid").uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise unauthorized("Session expired. Sign in again.")
    except jwt.InvalidTokenError:
        raise unauthorized("Invalid session.")


def initial_password(full_name: str, scholar_number: str) -> str:
    """Temporary credential format (PROMPT 1): first 4 letters of name in CAPS + 6-digit scholar number."""
    letters = "".join(c for c in full_name.upper() if c.isalpha())[:4]
    digits = "".join(c for c in scholar_number if c.isdigit())[:6]
    return f"{letters}{digits}"
