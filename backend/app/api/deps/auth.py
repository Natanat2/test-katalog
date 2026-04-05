from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User

required_bearer = HTTPBearer(auto_error=True)
optional_bearer = HTTPBearer(auto_error=False)


def _decode_user_id_from_credentials(
    credentials: HTTPAuthorizationCredentials | None,
) -> tuple[int | None, bool]:
    if credentials is None:
        return None, False

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        return None, True

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub.isdigit():
        return None, True
    return int(sub), True


def get_optional_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
) -> User | None:
    user_id, has_auth_header = _decode_user_id_from_credentials(credentials)
    if user_id is None and has_auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Invalid or missing access token",
                "code": "auth_invalid_token",
            },
        )

    if user_id is None:
        return None

    stmt = select(User).where(User.id == user_id, User.is_active.is_(True))
    user = db.execute(stmt).scalar_one_or_none()
    if user is None and has_auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Invalid or missing access token",
                "code": "auth_invalid_token",
            },
        )
    return user


def get_current_user(
    maybe_user: User | None = Depends(get_optional_current_user),
) -> User:
    if maybe_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "detail": "Invalid or missing access token",
                "code": "auth_invalid_token",
            },
        )
    return maybe_user
