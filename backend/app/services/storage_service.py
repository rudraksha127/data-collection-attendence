"""Private object storage abstraction.

Provider-agnostic interface with a local filesystem adapter for development.
Production can swap in S3/R2/MinIO without touching route handlers.
Images are private: access only through authorized endpoints / short-lived signed URLs.
"""
import hashlib
import os
import uuid
from pathlib import Path

import jwt
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.exceptions import ApiError, not_found, unauthorized


class StorageError(Exception):
    pass


class LocalStorageAdapter:
    """Local FS adapter — files live under STORAGE_ROOT and are never publicly served."""

    def __init__(self, root: str) -> None:
        self.root = Path(root).resolve()

    def put(self, key: str, content: bytes) -> str:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return key

    def get(self, key: str) -> bytes:
        path = self.root / key
        if not path.is_file():
            raise StorageError("Object not found.")
        return path.read_bytes()

    def delete(self, key: str) -> None:
        path = self.root / key
        if path.is_file():
            path.unlink()


class StorageService:
    def __init__(self) -> None:
        self.adapter = LocalStorageAdapter(settings.storage_root)

    @staticmethod
    def sha256(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    def build_key(user_id: str, submission_id: str, sequence: int) -> str:
        # Generated IDs only — no PII or original filename in the path
        return os.path.join(
            "student-data", user_id, submission_id, f"{sequence}_{uuid.uuid4().hex}.img"
        )

    def save_photo(self, key: str, content: bytes) -> None:
        try:
            self.adapter.put(key, content)
        except OSError as exc:
            raise StorageError(f"Failed to store object: {exc}") from exc

    def read_photo(self, key: str) -> bytes:
        try:
            return self.adapter.get(key)
        except (OSError, StorageError) as exc:
            raise not_found("Photo file") from exc

    def delete_photo(self, key: str) -> None:
        try:
            self.adapter.delete(key)
        except OSError:
            pass  # best-effort; metadata deletion remains authoritative

    # ---- short-lived signed URLs (no storage credentials exposed) ----

    @staticmethod
    def sign_photo_url(submission_id: str, photo_id: str, ttl_seconds: int = 300) -> str:
        token = jwt.encode(
            {
                "purpose": "photo_access",
                "sid": submission_id,
                "pid": photo_id,
                "exp": datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds),
            },
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
        return f"/api/v1/submissions/{submission_id}/photos/{photo_id}/download?token={token}"

    @staticmethod
    def verify_photo_token(token: str, submission_id: str, photo_id: str) -> None:
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        except jwt.ExpiredSignatureError:
            raise ApiError(401, "URL_EXPIRED", "This link expired. Request a new one.")
        except jwt.InvalidTokenError:
            raise unauthorized("Invalid access link.")
        if payload.get("sid") != submission_id or payload.get("pid") != photo_id:
            raise unauthorized("Invalid access link.")


storage_service = StorageService()
