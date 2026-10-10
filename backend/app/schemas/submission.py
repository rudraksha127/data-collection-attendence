"""Submission + photo schemas — response shapes match the frontend contract."""
from datetime import datetime

from pydantic import BaseModel, Field


class PhotoValidationOut(BaseModel):
    valid: bool
    reason_code: str | None = None
    reason: str | None = None


class PhotoOut(BaseModel):
    id: str
    sequence_number: int
    status: str
    capture_mode: str | None = None
    validation: PhotoValidationOut
    created_at: datetime | None = None


class ValidationSummaryOut(BaseModel):
    required: int
    valid: int
    invalid: int
    remaining: int


class SubmissionOut(BaseModel):
    id: str
    status: str
    version: int
    form_data: dict
    photos: list[PhotoOut]
    validation_summary: ValidationSummaryOut
    created_at: datetime | None = None
    updated_at: datetime | None = None
    submitted_at: datetime | None = None
    available_actions: list[str]


class SubmissionPatchRequest(BaseModel):
    form_data: dict = Field(default_factory=dict)
    version: int = Field(ge=1)


class SubmitRequest(BaseModel):
    version: int = Field(ge=1)


# ----- Photos -----

class PhotoUploadResponse(BaseModel):
    id: str
    sequence_number: int
    status: str
    validation: PhotoValidationOut


class SignedUrlResponse(BaseModel):
    url: str
    expires_in: int


class FormConfigResponse(BaseModel):
    photo_min: int
    photo_max: int
    required_fields: list[str]
    statuses: list[str]
