"""Student profile schemas."""
from pydantic import AliasChoices, BaseModel, Field


class StudentProfileOut(BaseModel):
    # Model PK is student_id; frontend contract exposes it as id
    id: str = Field(validation_alias=AliasChoices("student_id", "id"))
    user_id: str
    full_name: str
    college_email: str
    email: str | None = None
    scholar_number: str
    roll_number: str | None = None
    department: str | None = None
    program: str | None = None
    academic_year: str | None = None
    semester: str | None = None
    year: str | None = None
    section: str | None = None
    phone: str | None = None
    status: str

    model_config = {"from_attributes": True}


class StudentProfilePatch(BaseModel):
    """Only fields the collection form owns are patchable."""

    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    roll_number: str | None = Field(default=None, max_length=32)
    department: str | None = Field(default=None, max_length=80)
    program: str | None = Field(default=None, max_length=80)
    academic_year: str | None = Field(default=None, max_length=20)
    semester: str | None = Field(default=None, max_length=10)
    year: str | None = Field(default=None, max_length=10)
    section: str | None = Field(default=None, max_length=10)
    phone: str | None = Field(default=None, max_length=20)
