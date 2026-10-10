"""Approval idempotency — repeated review actions are safe and never corrupt state."""
from tests.conftest import (
    VALID_FORM,
    auth_headers,
    create_student,
    create_student_user_only,
    login_token,
    upload_photos,
)


def _submit(client, student_token, draft_submission) -> str:
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
    return sid


def test_repeated_approve_is_idempotent(client, student_token, draft_submission, admin_token):
    sid = _submit(client, student_token, draft_submission)
    admin_headers = auth_headers(admin_token)
    version = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]

    first = client.post(
        f"/api/v1/admin/submissions/{sid}/approve", headers=admin_headers, json={"version": version}
    )
    assert first.status_code == 200
    approved = first.json()["data"]
    assert approved["status"] == "APPROVED"
    version_after_first = approved["version"]

    # Repeat with the ORIGINAL (now stale) version — must still succeed, no version bump
    second = client.post(
        f"/api/v1/admin/submissions/{sid}/approve", headers=admin_headers, json={"version": version}
    )
    assert second.status_code == 200
    assert second.json()["data"]["status"] == "APPROVED"
    assert second.json()["data"]["version"] == version_after_first

    # Exactly one APPROVE entry in the review history
    detail = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]
    assert sum(1 for r in detail["reviews"] if r["action"] == "APPROVE") == 1


def test_stale_version_rejected_before_state_change(client, student_token, draft_submission, admin_token):
    sid = _submit(client, student_token, draft_submission)
    admin_headers = auth_headers(admin_token)
    stale_version = client.get(
        f"/api/v1/admin/submissions/{sid}", headers=admin_headers
    ).json()["data"]["version"]

    # Move to UNDER_REVIEW (bumps version)
    client.post(
        f"/api/v1/admin/submissions/{sid}/start-review",
        headers=admin_headers,
        json={"version": stale_version},
    )

    # Approving with the stale version fails cleanly with a stable code
    stale_approve = client.post(
        f"/api/v1/admin/submissions/{sid}/approve",
        headers=admin_headers,
        json={"version": stale_version},
    )
    assert stale_approve.status_code == 409
    assert stale_approve.json()["error"]["code"] == "REVIEW_VERSION_STALE"

    # State untouched
    detail = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]
    assert detail["status"] == "UNDER_REVIEW"


def test_repeated_reject_is_idempotent(client, student_token, draft_submission, admin_token):
    sid = _submit(client, student_token, draft_submission)
    admin_headers = auth_headers(admin_token)
    version = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]

    payload = {"version": version, "reason_code": "INCOMPLETE", "reason": "Missing docs."}
    first = client.post(f"/api/v1/admin/submissions/{sid}/reject", headers=admin_headers, json=payload)
    assert first.status_code == 200
    assert first.json()["data"]["status"] == "REJECTED"

    second = client.post(f"/api/v1/admin/submissions/{sid}/reject", headers=admin_headers, json=payload)
    assert second.status_code == 200
    assert second.json()["data"]["status"] == "REJECTED"


def test_approval_syncs_canonical_student_store(client, admin_token):
    """On approval the student master record is created — the authoritative store.

    Uses a bare user (no pre-provisioned profile) to mirror real provisioning.
    """
    email, password = create_student_user_only("Rudraksh", "123456", "rudraksh.sync@student.example")
    token = login_token(client, email, password)
    headers = auth_headers(token)

    # No canonical profile yet (submission still pending)
    assert client.get("/api/v1/students/me", headers=headers).status_code == 404

    sid = client.post("/api/v1/submissions", headers=headers).json()["data"]["id"]
    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]
    client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": version},
    )
    upload_photos(client, token, sid, count=6)
    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]
    client.post(f"/api/v1/submissions/{sid}/submit", headers=headers, json={"version": version})

    admin_headers = auth_headers(admin_token)
    v = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]
    approved = client.post(
        f"/api/v1/admin/submissions/{sid}/approve", headers=admin_headers, json={"version": v}
    )
    assert approved.status_code == 200

    profile = client.get("/api/v1/students/me", headers=headers)
    assert profile.status_code == 200
    data = profile.json()["data"]
    assert data["full_name"] == "Rudraksh"
    assert data["email"] == "rudraksh.sync@student.example"
    assert data["status"] == "ACTIVE"

    detail = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]
    assert detail["student_profile"]["student_id"] == data["id"]


def test_second_student_flow_isolated(client, student_token, draft_submission, admin_token):
    """One student's review never bleeds into another's submission."""
    sid = _submit(client, student_token, draft_submission)
    other_email, other_password = create_student("Aditi", "654321", "aditi@student.example")
    other_token = login_token(client, other_email, other_password)

    other_draft = client.post("/api/v1/submissions", headers=auth_headers(other_token)).json()["data"]
    assert other_draft["id"] != sid

    admin_headers = auth_headers(admin_token)
    version = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]
    client.post(
        f"/api/v1/admin/submissions/{sid}/approve", headers=admin_headers, json={"version": version}
    )

    other_state = client.get(
        f"/api/v1/submissions/{other_draft['id']}", headers=auth_headers(other_token)
    ).json()["data"]
    assert other_state["status"] == "DRAFT"
