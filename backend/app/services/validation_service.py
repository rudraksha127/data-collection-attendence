"""Server-side validation — the backend is the final authority.

Client validation is UX only. Stable error codes, never raw string comparison.
"""
import re

from app.core.config import settings
from app.core.exceptions import ApiError, validation_failed

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\d{10}$")

# Field policy derived from the actual frontend forms (see BACKEND_FRONTEND_CONTRACT.md)
REQUIRED_FIELDS = ["full_name", "email", "phone", "roll_number", "department", "semester", "section"]


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_form_data(form_data: dict, *, strict: bool = True) -> dict:
    """Validate + normalize form data. Returns cleaned data.

    Raises ApiError 422 VALIDATION_FAILED with per-field details.
    """
    errors: dict[str, list[str]] = {}
    cleaned: dict = {}

    data = dict(form_data or {})

    for field in REQUIRED_FIELDS:
        value = data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            if strict:
                errors.setdefault(field, []).append("This field is required.")
            continue

    # full_name
    name = data.get("full_name")
    if isinstance(name, str) and name.strip():
        normalized = re.sub(r"\s+", " ", name.strip())
        if len(normalized) > 120 or any(ord(c) < 32 for c in normalized):
            errors.setdefault("full_name", []).append("Invalid name.")
        else:
            cleaned["full_name"] = normalized

    # email
    email = data.get("email")
    if isinstance(email, str) and email.strip():
        if not EMAIL_RE.match(email.strip()):
            errors.setdefault("email", []).append("Invalid email format.")
        else:
            cleaned["email"] = normalize_email(email)

    # phone
    phone = data.get("phone")
    if isinstance(phone, str) and phone.strip():
        digits = re.sub(r"[\s-]", "", phone.strip())
        if not PHONE_RE.match(digits):
            errors.setdefault("phone", []).append("Enter a valid 10-digit mobile number.")
        else:
            cleaned["phone"] = digits

    # simple short strings
    for field, max_len in [
        ("roll_number", 32),
        ("department", 80),
        ("program", 80),
        ("academic_year", 20),
        ("semester", 10),
        ("year", 10),
        ("section", 10),
    ]:
        value = data.get(field)
        if isinstance(value, str) and value.strip():
            if len(value.strip()) > max_len:
                errors.setdefault(field, []).append(f"Maximum {max_len} characters.")
            else:
                cleaned[field] = value.strip()

    # pass through any additional non-empty scalar values (typed mapping layer, not renames)
    for key, value in data.items():
        if key in cleaned or key in REQUIRED_FIELDS:
            continue
        if isinstance(value, (str, int, float, bool)) and value != "":
            cleaned[key] = value

    if errors and strict:
        raise validation_failed("Some fields need attention.", details=errors)

    return cleaned


def validate_photo_readiness(photo_count: int) -> None:
    if photo_count < settings.photo_min:
        raise ApiError(
            422,
            "PHOTO_REQUIRED",
            f"At least {settings.photo_min} photos are required before submitting.",
            details={"photos": [f"{photo_count}/{settings.photo_min} captured"]},
        )
