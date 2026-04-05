from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.auth import (
    AuthLoginRequest,
    AuthRegisterRequest,
    AuthTokenResponse,
    AuthUserResponse,
)
from app.core.security import (
    create_access_token,
    hash_password,
    normalize_email,
    verify_password,
)
from app.services.cart_service import get_or_create_user_cart, merge_session_cart_into_user_cart

router = APIRouter(prefix="/auth")


def _find_user_by_email(db: Session, email: str) -> User | None:
    normalized = normalize_email(email)
    stmt = select(User).where(User.email == normalized)
    return db.execute(stmt).scalar_one_or_none()


@router.post("/register", response_model=AuthTokenResponse, summary="Register user")
def register_user(
    payload: AuthRegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> AuthTokenResponse:
    existing = _find_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "detail": "User with this email already exists",
                "code": "auth_email_exists",
            },
        )

    user = User(
        email=normalize_email(payload.email),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.flush()

    user_cart = get_or_create_user_cart(db, user)
    user_cart = merge_session_cart_into_user_cart(db, x_session_id, user, user_cart)

    access_token = create_access_token(user.id)
    db.commit()
    db.refresh(user)
    response.headers["X-Session-Id"] = user_cart.session_id

    return AuthTokenResponse(
        access_token=access_token,
        user=AuthUserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthTokenResponse, summary="Login user")
def login_user(
    payload: AuthLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    x_session_id: str | None = Header(default=None, alias="X-Session-Id"),
) -> AuthTokenResponse:
    user = _find_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Invalid email or password",
                "code": "auth_invalid_credentials",
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "detail": "User is inactive",
                "code": "auth_user_inactive",
            },
        )

    user_cart = get_or_create_user_cart(db, user)
    user_cart = merge_session_cart_into_user_cart(db, x_session_id, user, user_cart)

    access_token = create_access_token(user.id)
    db.commit()
    response.headers["X-Session-Id"] = user_cart.session_id

    return AuthTokenResponse(
        access_token=access_token,
        user=AuthUserResponse.model_validate(user),
    )


@router.get("/me", response_model=AuthUserResponse, summary="Get current user")
def get_me(current_user: User = Depends(get_current_user)) -> AuthUserResponse:
    return AuthUserResponse.model_validate(current_user)
