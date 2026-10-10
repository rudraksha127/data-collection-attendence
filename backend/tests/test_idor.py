"""IDOR guards — a student can never reach another student's submission or photos.

Failures return 404 (not 403) so submission ids don't leak their existence.
Admin access to any submission is verified as the positive control.
"""
from tests.conftest import auth_headers, create_student, login_token, upload_photos


def _make_second_student(client) -> str:
    email, password = create_student("Aditi", "654321", "aditi@student.example")
    return login_token(client, email, password)


def test_student_cannot_read_others_submission(client, student_token, draft_submission):
    other_token = _make_second_student(client)
    sid = draft_submission["id"]

    # Same request succeeds for the owner...
    owner = client.get(f"/api/v1/submissions/{sid}", headers=auth_headers(student_token))
    assert owner.status_code == 200

    # ...but 404s for another student (no existence leak)
    response = client.get(f"/api/v1/submissions/{sid}", headers=auth_headers(other_token))
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_student_cannot_patch_or_submit_others_submission(client, student_token, draft_submission):
    other_token = _make_second_student(client)
    sid = draft_submission["id"]

    patch = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=auth_headers(other_token),
        json={"form_data": {"full_name": "Hacked"}, "version": draft_submission["version"]},
    )
    assert patch.status_code == 404

    submit = client.post(
        f"/api/v1/submissions/{sid}/submit",
        headers=auth_headers(other_token),
        json={"version": draft_submission["version"]},
    )
    assert submit.status_code == 404


def test_student_cannot_touch_others_photos(client, student_token, draft_submission):
    other_token = _make_second_student(client)
    sid = draft_submission["id"]

    upload_photos(client, student_token, sid, count=1)
    photos = client.get(f"/api/v1/submissions/{sid}", headers=auth_headers(student_token)).json()["data"]["photos"]
    photo_id = photos[0]["id"]

    # Read meta
    assert (
        client.get(
            f"/api/v1/submissions/{sid}/photos/{photo_id}", headers=auth_headers(other_token)
        ).status_code
        == 404
    )
    # Fetch signed URL (would allow fetching image bytes)
    assert (
        client.get(
            f"/api/v1/submissions/{sid}/photos/{photo_id}/url", headers=auth_headers(other_token)
        ).status_code
        == 404
    )
    # Delete
    assert (
        client.delete(
            f"/api/v1/submissions/{sid}/photos/{photo_id}", headers=auth_headers(other_token)
        ).status_code
        == 404
    )
    # Owner still has it
    assert (
        client.get(
            f"/api/v1/submissions/{sid}/photos/{photo_id}", headers=auth_headers(student_token)
        ).status_code
        == 200
    )


def test_unauthenticated_access_rejected_everywhere(client, draft_submission, student_token):
    sid = draft_submission["id"]
    for path in (
        f"/api/v1/submissions/{sid}",
        "/api/v1/submissions/me",
        "/api/v1/students/me",
        "/api/v1/admin/submissions",
    ):
        assert client.get(path).status_code == 401, path

    upload_photos(client, student_token, sid, count=1)
    photos = client.get(f"/api/v1/submissions/{sid}", headers=auth_headers(student_token)).json()["data"]["photos"]
    photo_id = photos[0]["id"]
    # Signed download URL requires a valid token even without session header
    bad = client.get(f"/api/v1/submissions/{sid}/photos/{photo_id}/download?token=bogus")
    assert bad.status_code == 401


def test_admin_reaches_any_submission_positive_control(client, student_token, draft_submission, admin_token):
    sid = draft_submission["id"]
    response = client.get(f"/api/v1/admin/submissions/{sid}", headers=auth_headers(admin_token))
    assert response.status_code == 200
    assert response.json()["data"]["id"] == sid


def test_student_cannot_reach_admin_endpoints(client, student_token):
    for path in (
        "/api/v1/admin/submissions",
        "/api/v1/admin/submissions/summary",
        "/api/v1/admin/audit",
    ):
        response = client.get(path, headers=auth_headers(student_token))
        assert response.status_code == 403, path
        assert response.json()["error"]["code"] == "FORBIDDEN"
