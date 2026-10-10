"""Auth routes — POST login/logout, GET me, POST change-password."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.database import get_db
from app.core.exceptions import ok, unauthorized
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, LoginResponse, UserOut
from app.services import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> object:
    user, token = auth_service.login(db, payload.email, payload.password)
    return ok(
        LoginResponse(
            user=UserOut(**auth_service.user_public_dict(user)),
            access_token=token,
        ).model_dump()
    )


@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    # JWT is stateless; the client discards its token. Audit the event for the trail.
    from app.services import audit_service

    audit_service.record(db, "LOGOUT", actor_user_id=user.id, actor_role=user.role)
    db.commit()
    return ok({"logged_out": True})


@router.get("/me")
def me(user: User = Depends(current_user)) -> object:
    return ok(UserOut(**auth_service.user_public_dict(user)).model_dump())


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> object:
    auth_service.change_password(db, user, payload.current_password, payload.new_password)
    return ok({"password_changed": True})
