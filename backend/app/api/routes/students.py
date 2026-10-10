"""Student profile routes — identity always comes from the authenticated token."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.database import get_db
from app.core.exceptions import not_found, ok
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentProfileOut, StudentProfilePatch

router = APIRouter(prefix="/api/v1/students", tags=["students"])


def _profile_dict(student: Student) -> dict:
    data = StudentProfileOut.model_validate(student).model_dump()
    data["email"] = student.college_email
    return data


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), user: User = Depends(current_user)) -> object:
    student = db.query(Student).filter(Student.user_id == user.id).one_or_none()
    if student is None:
        raise not_found("Student profile")
    return ok(_profile_dict(student))


@router.patch("/me")
def patch_my_profile(
    payload: StudentProfilePatch,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    student = db.query(Student).filter(Student.user_id == user.id).one_or_none()
    if student is None:
        raise not_found("Student profile")
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return ok(_profile_dict(student))
