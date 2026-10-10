"""Contract tests — envelope, field names, endpoint shapes as the frontend consumes them."""
from tests.conftest import VALID_FORM, auth_headers, upload_photos


def test_health_envelope(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "status" in body["data"]


def test_error_envelope_shape(client):
    response = client.get("/api/v1/submissions/me", headers=auth_headers("bad-token"))
    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert set(body["error"].keys()) >= {"code", "message"}
    assert isinstance(body["error"]["code"], str)


def test_form_config_contract(client):
    """Frontend reads slot count + required fields from the backend (never hard-coded)."""
    response = client.get("/api/v1/submissions/form-config")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["photo_min"] == 6
    assert data["photo_max"] == 8
    for field in ("full_name", "email", "phone", "roll_number", "department", "semester", "section"):
        assert field in data["required_fields"], field
    assert data["statuses"] == [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "NEEDS_CORRECTION",
        "APPROVED",
        "REJECTED",
    ]


def test_submission_lifecycle_shape(client, student_token, draft_submission):
    """GET/PATCH/submit responses carry every key frontend/src/types/api.ts::Submission uses."""
    sid = draft_submission["id"]
    headers = auth_headers(student_token)

    patch = client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": draft_submission["version"]},
    )
    assert patch.status_code == 200
    submission = patch.json()["data"]
    for key in ("id", "status", "version", "form_data", "photos", "validation_summary", "available_actions"):
        assert key in submission, key
    assert submission["form_data"]["full_name"] == "Rudraksh"
    assert submission["form_data"]["email"] == "rudraksh@student.example"  # normalized
    assert submission["validation_summary"]["required"] == 6

    me = client.get("/api/v1/submissions/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["data"]["id"] == sid


def test_my_submission_404_when_absent_is_catched_by_frontend(client, student_token):
    # Frontend calls getMySubmission().catch(() => null) — 404 must be a clean envelope
    response = client.get("/api/v1/submissions/me", headers=auth_headers(student_token))
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_submit_without_required_fields_422_per_field_details(client, student_token, draft_submission):
    sid = draft_submission["id"]
    response = client.post(
        f"/api/v1/submissions/{sid}/submit",
        headers=auth_headers(student_token),
        json={"version": draft_submission["version"]},
    )
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_FAILED"
    details = error["details"]
    # frontend expects details: Record<string, string[]>
    for field in ("full_name", "email", "phone", "roll_number", "department", "semester", "section"):
        assert field in details, field
        assert isinstance(details[field], list) and isinstance(details[field][0], str)


def test_photo_upload_and_signed_url_flow(client, student_token, draft_submission):
    sid = draft_submission["id"]
    headers = auth_headers(student_token)

    photos = upload_photos(client, student_token, sid, count=1)
    photo = photos[0]
    assert photo["sequence_number"] == 1
    assert photo["status"] == "VALID"
    assert photo["validation"]["valid"] is True
    photo_id = photo["id"]

    # Signed URL for <img> tags
    url_response = client.get(f"/api/v1/submissions/{sid}/photos/{photo_id}/url", headers=headers)
    assert url_response.status_code == 200
    url = url_response.json()["data"]["url"]
    assert url.startswith("/api/v1/submissions/")

    # Download via signed token (no auth header — how browsers fetch images)
    download = client.get(url)
    assert download.status_code == 200
    assert download.headers["content-type"] == "image/jpeg"
    assert len(download.content) > 0


def test_photo_rejects_wrong_content_type(client, student_token, draft_submission):
    sid = draft_submission["id"]
    response = client.post(
        f"/api/v1/submissions/{sid}/photos",
        headers=auth_headers(student_token),
        files={"file": ("evil.exe", b"MZ binary", "application/octet-stream")},
        data={"sequence_number": "1", "capture_mode": "upload"},
    )
    assert response.status_code == 415
    assert response.json()["error"]["code"] == "PHOTO_INVALID"


def test_cors_preflight_from_pwa_origin(client):
    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


def test_admin_queue_and_summary_shapes(client, student_token, draft_submission, admin_token):
    """Mirror of frontend endpoints.ts listAdminSubmissions/getAdminSummary."""
    # Queue: submit the draft so it appears in status=SUBMITTED filter
    sid = draft_submission["id"]
    headers = auth_headers(student_token)
    client.patch(
        f"/api/v1/submissions/{sid}",
        headers=headers,
        json={"form_data": VALID_FORM, "version": draft_submission["version"]},
    )
    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]
    upload_photos(client, student_token, sid, count=6)
    version = client.get(f"/api/v1/submissions/{sid}", headers=headers).json()["data"]["version"]
    client.post(
        f"/api/v1/submissions/{sid}/submit",
        headers=headers,
        json={"version": version},
    )

    admin_headers = auth_headers(admin_token)

    queue = client.get(
        "/api/v1/admin/submissions",
        headers=admin_headers,
        params={"page": 1, "page_size": 20, "status": "SUBMITTED", "search": "Rudraksh"},
    )
    assert queue.status_code == 200
    page = queue.json()["data"]
    assert set(page.keys()) == {"items", "page", "page_size", "total"}
    assert page["total"] == 1
    item = page["items"][0]
    assert item["status"] == "SUBMITTED"
    assert item["student"]["full_name"] == "Rudraksh"
    assert item["photo_count"] == 6

    summary = client.get("/api/v1/admin/submissions/summary", headers=admin_headers)
    assert summary.status_code == 200
    counts = summary.json()["data"]
    assert set(counts.keys()) == {
        "pending",
        "under_review",
        "needs_correction",
        "approved",
        "rejected",
    }
    assert counts["pending"] == 1

    detail = client.get(f"/api/v1/admin/submissions/{sid}", headers=admin_headers)
    assert detail.status_code == 200
    data = detail.json()["data"]
    for key in ("id", "status", "version", "form_data", "photos", "validation_summary",
                "student_profile", "reviews", "admin_actions"):
        assert key in data, key
    assert data["admin_actions"]  # SUBMITTED -> review actions available
