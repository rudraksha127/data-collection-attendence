"""Admin schemas — queue, stats, detail and review-action payloads."""
from datetime import datetime

from pydantic import BaseModel, Field


class AdminQueueStudent(BaseModel):
    id: str | None = None
    full_name: str
    roll_no: str | None = None
    department: str | None = None


class AdminQueueItem(BaseModel):
    id: str
    status: str
    version: int
    student: AdminQueueStudent
    photo_count: int = 0
    submitted_at: datetime | None = None
    updated_at: datetime | None = None


class AdminSubmissionsPage(BaseModel):
    items: list[AdminQueueItem]
    page: int
    page_size: int
    total: int


class AdminStats(BaseModel):
    pending: int = 0
    under_review: int = 0
    needs_correction: int = 0
    approved: int = 0
    rejected: int = 0


class AdminReviewRequest(BaseModel):
    """Review action payload — version is mandatory (optimistic concurrency)."""

    version: int = Field(ge=1)
    reason_code: str | None = Field(default=None, max_length=64)
    reason: str | None = Field(default=None, max_length=1000)
    affected_fields: list[str] | None = None
