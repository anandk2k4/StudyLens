# app/core/security.py

import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

bearer_scheme = HTTPBearer(auto_error=True)

ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET", "")


class AuthPayload:
    """Decoded JWT payload — injected into route handlers via Depends."""
    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email   = email


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AuthPayload:
    """
    FastAPI dependency — verifies JWT and returns decoded payload.

    Usage:
        @router.post("/upload/")
        async def upload(current_user: AuthPayload = Depends(get_current_user)):
            print(current_user.user_id)
    """
    if not ACCESS_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"stage": "auth", "message": "JWT_ACCESS_SECRET is not set on the server."},
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(token, ACCESS_SECRET, algorithms=["HS256"])
        return AuthPayload(
            user_id=payload["userId"],
            email=payload["email"],
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"stage": "auth", "message": "Access token has expired."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"stage": "auth", "message": f"Invalid token: {e}"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"stage": "auth", "message": "Token missing required fields."},
            headers={"WWW-Authenticate": "Bearer"},
        )