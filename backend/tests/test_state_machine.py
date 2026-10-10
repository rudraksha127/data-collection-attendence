"""State machine tests — transitions, edit locks, and the correction loop from PROMPT 1."""
from tests.conftest import VALID_FORM, auth_headers, upload_photos


def _submit_draft(client, student_token, draft_submission, form=VALID_FORM) -> str:
    """PATCH + upload 6 photos + submit. Returns submission id (status SUBMITTED)."""
    sid = draft_submission["id"]
    headers = auth_headers(student_token)

    version = draft_submission["version"]
    patched = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": form, "version": version},
    )
    assert patched.status_code == 200, patched.text

    upload_photos(client, student_token, sid, count=6)
    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]

    submitted = client.post(
        f"/api/v1/submissions/{sid}/submit", headers=headers, json={"version": version}
    )
    assert submitted.status_code == 200, submitted.text
    assert submitted.json()["data"]["status"] == "SUBMITTED"
    return sid


def test_draft_patch_submit_flow(client, student_token, draft_submission):
    sid = _submit_draft(client, student_token, draft_submission)
    headers = auth_headers(student_token)
    current = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]
    assert current["status"] == "SUBMITTED"
    assert current["submitted_at"] is not None
    assert current["available_actions"] == []


def test_locked_after_submit(client, student_token, draft_submission):
    sid = _submit_draft(client, student_token, draft_submission)
    headers = auth_headers(student_token)
    current = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]

    patch = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": current["version"]},
    )
    assert patch.status_code == 409
    assert patch.json()["error"]["code"] == "SUBMISSION_LOCKED"


def test_concurrent_edit_rejected_with_stale_version(client, student_token, draft_submission):
    sid = draft_submission["id"]
    headers = auth_headers(student_token)
    stale = draft_submission["version"]

    first = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": stale},
    )
    assert first.status_code == 200

    # Replaying the old version must fail with a stable 409 code
    second = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": stale},
    )
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "CONCURRENT_UPDATE"


def test_submit_requires_enough_photos(client, student_token, draft_submission):
    sid = draft_submission["id"]
    headers = auth_headers(student_token)

    patched = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": draft_submission["version"]},
    )
    version = patched.json()["data"]["version"]
    upload_photos(client, student_token, sid, count=3)

    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]
    response = client.post(
        f"/api/v1/submissions/{sid}/submit", headers=headers, json={"version": version}
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "PHOTO_REQUIRED"


def test_admin_review_happy_path(client, student_token, draft_submission, admin_token):
    sid = _submit_draft(client, student_token, draft_submission)
    admin_headers = auth_headers(admin_token)

    version = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]

    started = client.post(
        f"/api/v1/admin/submissions/{sid}/start-review",
        headers=admin_headers,
        json={"version": version},
    )
    assert started.status_code == 200
    assert started.json()["data"]["status"] == "UNDER_REVIEW"

    new_version = started.json()["data"]["version"]
    approved = client.post(
        f"/api/v1/admin/submissions/{sid}/approve",
        headers=admin_headers,
        json={"version": new_version},
    )
    assert approved.status_code == 200
    assert approved.json()["data"]["status"] == "APPROVED"


def test_admin_cannot_approve_draft(client, student_token, draft_submission, admin_token):
    """DRAFT is not reviewable — the state machine blocks it (409, not silent success)."""
    sid = draft_submission["id"]
    response = client.post(
        f"/api/v1/admin/submissions/{sid}/approve",
        headers=auth_headers(admin_token),
        json={"version": draft_submission["version"]},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "SUBMISSION_LOCKED"


def test_reject_requires_reason_code(client, student_token, draft_submission, admin_token):
    sid = _submit_draft(client, student_token, draft_submission)
    admin_headers = auth_headers(admin_token)
    version = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]

    no_reason = client.post(
        f"/api/v1/admin/submissions/{sid}/reject",
        headers=admin_headers,
        json={"version": version},
    )
    assert no_reason.status_code == 422
    assert no_reason.json()["error"]["code"] == "VALIDATION_FAILED"

    with_reason = client.post(
        f"/api/v1/admin/submissions/{sid}/reject",
        headers=admin_headers,
        json={"version": version, "reason_code": "PHOTO_BLURRY", "reason": "Face unclear in photos."},
    )
    assert with_reason.status_code == 200
    assert with_reason.json()["data"]["status"] == "REJECTED"


def test_correction_loop_student_fixes_and_resubmits(client, student_token, draft_submission, admin_token):
    """SUBMITTED -> NEEDS_CORRECTION -> student edits -> resubmitted."""
    sid = _submit_draft(client, student_token, draft_submission)
    student_headers = auth_headers(student_token)
    admin_headers = auth_headers(admin_token)

    version = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers).json()["data"]["version"]
    correction = client.post(
        f"/api/v1/admin/submissions/{sid}/request-correction",
        headers=admin_headers,
        json={"version": version, "reason_code": "WRONG_PHONE", "reason": "Phone number invalid."},
    )
    assert correction.status_code == 200
    assert correction.json()["data"]["status"] == "NEEDS_CORRECTION"

    # Student can edit again
    current = client.get(f"/api/v1/submissions/{sid}", headers=student_headers).json()["data"]
    assert "edit" in current["available_actions"]

    fixed = {**VALID_FORM, "phone": "9123456789"}
    patched = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=student_headers,
        json={"form_data": fixed, "version": current["version"]},
    )
    assert patched.status_code == 200

    resubmitted = client.post(
        f"/api/v1/submissions/{sid}/submit",
        headers=student_headers,
        json={"version": patched.json()["data"]["version"]},
    )
    assert resubmitted.status_code == 200
    assert resubmitted.json()["data"]["status"] == "SUBMITTED"


def test_one_active_submission_per_student(client, student_token, draft_submission):
    """A second active draft conflicts until the first is terminal."""
    response = client.post("/api/v1/submissions", headers=auth_headers(student_token))
    assert response.status_code == 409
