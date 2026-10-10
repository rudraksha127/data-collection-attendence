"""Shared test fixtures — file-backed SQLite (shared across sessions), TestClient, seed helpers.

Environment MUST be set before any app import (settings are resolved at import time).
"""
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_backend.db"
os.environ["STORAGE_ROOT"] = "./test_storage"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["DEBUG"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password, initial_password
from app.main import app
from app.models import Student, User
from app.services import auth_service
from app.services.validation_service import normalize_email

# Fake JPEG bytes — content is never decoded, only type/size checked
def jpeg_bytes(seed: int = 0) -> bytes:
    return b"\xff\xd8\xff\xe0" + b"TESTDATA" + bytes([seed]) + os.urandom(32)


def create_student(full_name: str, scholar_number: str, email: str, **extra) -> tuple[str, str]:
    """Create a student user + profile directly in the DB. Returns (email, temp_password)."""
    session = SessionLocal()
    try:
        norm = normalize_email(email)
        password = initial_password(full_name, scholar_number)
        user = User(
            email=norm,
            password_hash=hash_password(password),
            role="STUDENT",
            status="ACTIVE",
            is_first_login=True,
        )
        session.add(user)
        session.flush()
        session.add(
            Student(
                user_id=user.id,
                college_email=norm,
                full_name=full_name,
                scholar_number=scholar_number,
                status="ACTIVE",
                **extra,
            )
        )
        session.commit()
        return norm, password
    finally:
        session.close()


def create_student_user_only(full_name: str, scholar_number: str, email: str) -> tuple[str, str]:
    """Create a student login WITHOUT a canonical profile — mirrors real provisioning
    (the profile is created by the backend on approval)."""
    session = SessionLocal()
    try:
        norm = normalize_email(email)
        password = initial_password(full_name, scholar_number)
        session.add(
            User(
                email=norm,
                password_hash=hash_password(password),
                role="STUDENT",
                status="ACTIVE",
                is_first_login=True,
            )
        )
        session.commit()
        return norm, password
    finally:
        session.close()


def create_admin(email: str = "admin@test.com", password: str = "AdminPass123") -> tuple[str, str]:
    session = SessionLocal()
    try:
        user = User(
            email=normalize_email(email),
            password_hash=hash_password(password),
            role="ADMIN",
            status="ACTIVE",
            is_first_login=False,
        )
        session.add(user)
        session.commit()
        return normalize_email(email), password
    finally:
        session.close()


def login_token(client: TestClient, email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["data"]["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def upload_photos(client: TestClient, token: str, submission_id: str, count: int = 6) -> list[dict]:
    photos = []
    for i in range(1, count + 1):
        response = client.post(
            f"/api/v1/submissions/{submission_id}/photos",
            headers=auth_headers(token),
            files={"file": (f"p{i}.jpg", jpeg_bytes(i), "image/jpeg")},
            data={"sequence_number": str(i), "capture_mode": "live"},
        )
        assert response.status_code in (200, 201), response.text
        photos.append(response.json()["data"])
    return photos


@pytest.fixture(scope="session")
def client():
    Base.metadata.create_all(engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_state():
    """Fresh DB + fresh rate limiter before every test."""
    auth_service.reset_rate_limits()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    auth_service.reset_rate_limits()


@pytest.fixture
def student_credentials() -> tuple[str, str]:
    return create_student(
        "Rudraksh",
        "123456",
        "rudraksh@student.example",
        roll_number="CS-001",
        department="Computer Science",
    )


@pytest.fixture
def student_token(client, student_credentials) -> str:
    email, password = student_credentials
    return login_token(client, email, password)


@pytest.fixture
def admin_credentials() -> tuple[str, str]:
    return create_admin()


@pytest.fixture
def admin_token(client, admin_credentials) -> str:
    email, password = admin_credentials
    return login_token(client, email, password)


@pytest.fixture
def draft_submission(client, student_token) -> dict:
    """A DRAFT submission owned by the student, ready for editing."""
    response = client.post("/api/v1/submissions", headers=auth_headers(student_token))
    assert response.status_code in (200, 201), response.text
    return response.json()["data"]


VALID_FORM = {
    "full_name": "Rudraksh",
    "email": "rudraksh@student.example",
    "phone": "9876543210",
    "roll_number": "CS-001",
    "department": "Computer Science",
    "semester": "5",
    "section": "A",
}
