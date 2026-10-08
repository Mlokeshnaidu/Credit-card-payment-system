"""
Authentication and security dependencies for FastAPI
Module 8: Security Rules & JWT Verification
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, Dict, Any
from .config import settings

# HTTPBearer extracts Authorization: Bearer <token>
security_bearer = HTTPBearer(auto_error=False)


def get_token_from_header_or_credentials(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> str:
    """Extract raw token string from HTTP Bearer credentials"""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token using settings.JWT_SECRET_KEY.
    Compatible with Django SimpleJWT and internal FastAPI tokens.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_jwt_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> Dict[str, Any]:
    """
    FastAPI dependency: verifies JWT and returns the decoded payload.
    Raises 401 if missing or invalid.
    """
    token = get_token_from_header_or_credentials(credentials)
    return decode_jwt_token(token)
