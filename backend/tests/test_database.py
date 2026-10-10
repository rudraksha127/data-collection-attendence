"""Database invariants — uniqueness, normalization, and stable internal identity."""
import pytest
from sqlalchemy.exc import IntegrityError

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Student, User
from tests.conftest import VALID_FORM, auth_headers, create_student, upload_photos


def test_duplicate_email_rejected_by_db():
    session = SessionLocal()
    try:
        session.add(User(email="dup@test.com", password_hash=hash_password("Pass1234"), role="STUDENT"))
        session.commit()
        session.add(User(email="dup@test.com", password_hash=hash_password("Pass1234"), role="STUDENT"))
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()
    finally:
        session.close()


def test_email_normalization_enforced_in_storage():
    """User@College.edu and user@college.edu are the same identity — every write path
    normalizes first (PROMPT 1 §9), so the unique constraint then rejects the duplicate."""
    from app.services.validation_service import normalize_email

    session = SessionLocal()
    try:
        session.add(User(email=normalize_email("user@college.edu"), password_hash=hash_password("Pass1234"), role="STUDENT"))
        session.commit()
        session.add(User(email=normalize_email("USER@COLLEGE.EDU"), password_hash=hash_password("Pass1234"), role="STUDENT"))
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()
    finally:
        session.close()


def test_duplicate_scholar_number_rejected():
    session = SessionLocal()
    try:
        user_a = User(email="a@test.com", password_hash=hash_password("Pass1234"), role="STUDENT")
        user_b = User(email="b@test.com", password_hash=hash_password("Pass1234"), role="STUDENT")
        session.add_all([user_a, user_b])
        session.flush()
        session.add(Student(user_id=user_a.id, college_email="a@test.com", full_name="A", scholar_number="111111"))
        session.commit()
        session.add(Student(user_id=user_b.id, college_email="b@test.com", full_name="B", scholar_number="111111"))
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()
    finally:
        session.close()


def test_student_id_stable_across_updates(client, student_token, draft_submission, admin_token):
    """student_id never changes even when roll number / section change after approval."""
    sid = draft_submission["id"]
    headers = auth_headers(student_token)
    patched = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": draft_submission["version"]},
    )
    assert patched.status_code == 200
    upload_photos(client, student_token, sid, count=6)
    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]
    client.post(f"/api/v1/submissions/{sid}/submit", headers=headers, json={"version": version})

    admin_headers = auth_headers(admin_token)
    v = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]
    client.post(f"/api/v1/admin/submissions/{sid}/approve", headers=admin_headers, json={"version": v})

    before = client.get("/api/v1/students/me", headers=headers).json()["data"]

    # Student record can be updated (new section/roll) — id must not move
    update = client.patch(
        "/api/v1/students/me", headers=headers, json={"roll_number": "CS-002", "section": "B"}
    )
    assert update.status_code == 200
    after = update.json()["data"]
    assert after["id"] == before["id"]
    assert after["roll_number"] == "CS-002"
    assert after["section"] == "B"


def test_submission_versions_increase_monotonically(client, student_token, draft_submission):
    sid = draft_submission["id"]
    headers = auth_headers(student_token)
    versions = [draft_submission["version"]]

    patched = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": versions[-1]},
    )
    versions.append(patched.json()["data"]["version"])

    upload_photos(client, student_token, sid, count=1)
    current = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]
    versions.append(current["version"])

    assert versions == sorted(versions)
    assert len(set(versions)) == len(versions)  # strictly increasing


def test_audit_events_recorded_for_state_changes(client, student_token, draft_submission, admin_token):
    sid = draft_submission["id"]
    headers = auth_headers(student_token)
    patched = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": draft_submission["version"]},
    )
    upload_photos(client, student_token, sid, count=6)
    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]
    client.post(f"/api/v1/submissions/{sid}/submit", headers=headers, json={"version": version})

    audit = client.get("/api/v1/admin/audit", headers=auth_headers(admin_token)).json()["data"]
    event_types = {entry["event_type"] for entry in audit}
    assert "SUBMISSION_CREATED" in event_types
    assert "SUBMISSION_UPDATED" in event_types
    assert "PHOTO_UPLOADED" in event_types
    assert "SUBMISSION_SUBMITTED" in event_types
    # No password material anywhere in the audit trail
    assert not any("password" in str(entry).lower() for entry in audit)
