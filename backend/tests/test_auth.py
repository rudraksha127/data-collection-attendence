"""Auth tests — login envelope, credentials, normalization, rate limiting, password hygiene."""
from app.core.security import initial_password
from tests.conftest import auth_headers, login_token


def test_initial_password_format_matches_spec():
    # PROMPT 1 example: Rudraksh / 123456 -> RUDR123456
    assert initial_password("Rudraksh", "123456") == "RUDR123456"
    assert initial_password("Ananya", "987654") == "ANAN987654"
    # No leading zeroes lost if scholar number has them within first 6 digits
    assert initial_password("Rudraksh", "012345") == "RUDR012345"


def test_login_success_returns_frontend_contract(client, student_credentials):
    email, password = student_credentials
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert set(data.keys()) == {"user", "access_token", "token_type"}
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["is_first_login"] is True
    assert data["user"]["email"] == email
    assert "password" not in response.text
    assert "password_hash" not in response.text


def test_login_normalizes_email(client, student_credentials):
    _, password = student_credentials
    response = client.post(
        "/api/v1/auth/login", json={        "email": "Rudraksh@Student.EXAMPLE", "password": password}
    )
    assert response.status_code == 200


def test_login_wrong_password_is_generic_401(client, student_credentials):
    email, _ = student_credentials
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "WRONG-123456"})

    assert response.status_code == 401
    error = response.json()["error"]
    assert error["code"] == "INVALID_CREDENTIALS"
    # Generic message — must not reveal whether the account exists
    assert error["message"] == "Invalid email or password."


def test_login_unknown_email_same_error(client):
    response = client.post(
        "/api/v1/auth/login", json={"email": "nobody@test.com", "password": "whatever123"}
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_rate_limit_after_repeated_failures(client, student_credentials):
    email, _ = student_credentials
    for _ in range(5):
        response = client.post("/api/v1/auth/login", json={"email": email, "password": "bad-pass"})
        assert response.status_code == 401
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "bad-pass"})
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "TOO_MANY_REQUESTS"


def test_me_requires_token_and_returns_user(client, student_token):
    anonymous = client.get("/api/v1/auth/me")
    assert anonymous.status_code == 401
    assert anonymous.json()["error"]["code"] == "UNAUTHORIZED"

    response = client.get("/api/v1/auth/me", headers=auth_headers(student_token))
    assert response.status_code == 200
    user = response.json()["data"]
    assert user["role"] == "STUDENT"
    assert "password" not in response.text


def test_invalid_token_rejected(client):
    response = client.get("/api/v1/auth/me", headers=auth_headers("not-a-real-token"))
    assert response.status_code == 401


def test_change_password_rotates_credential(client, student_credentials):
    email, password = student_credentials
    token = login_token(client, email, password)

    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers(token),
        json={"current_password": password, "new_password": "NewStrongPass1"},
    )
    assert response.status_code == 200

    # Old credential no longer works; new one does; first-login flag cleared
    old = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert old.status_code == 401

    new = client.post(
        "/api/v1/auth/login", json={"email": email, "password": "NewStrongPass1"}
    )
    assert new.status_code == 200
    assert new.json()["data"]["user"]["is_first_login"] is False


def test_change_password_rejects_wrong_current(client, student_credentials):
    email, password = student_credentials
    token = login_token(client, email, password)
    response = client.post(
        "/api/v1/auth/change-password",
        headers=auth_headers(token),
        json={"current_password": "not-my-password", "new_password": "NewStrongPass1"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_logout_returns_ok(client, student_token):
    response = client.post("/api/v1/auth/logout", headers=auth_headers(student_token))
    assert response.status_code == 200
    assert response.json()["data"]["logged_out"] is True
