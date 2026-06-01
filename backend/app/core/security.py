"""
FastAPI JWT middleware — verifies access tokens on protected AI endpoints.
Frontend sends: Authorization: Bearer <access_token>
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

bearer = HTTPBearer()

ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET", "")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    """
    FastAPI dependency. Returns the decoded JWT payload.
    Use as: user = Depends(get_current_user)
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, ACCESS_SECRET, algorithms=["HS256"])
        return {"userId": payload["userId"], "email": payload["email"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"stage": "auth", "message": "Access token has expired."},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"stage": "auth", "message": "Invalid access token."},
        )