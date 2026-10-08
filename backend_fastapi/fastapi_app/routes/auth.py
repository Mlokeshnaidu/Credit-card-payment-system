from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from ..core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=150)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.JWT_EXPIRY_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/verify-token", summary="Verify JWT Token")
async def verify_jwt_token(token: str):
    """
    **Verify a JWT Token**

    - Validates if the provided JWT token is valid
    - Returns token payload if valid
    - Note: Primary auth is handled by Django; this is for FastAPI-internal validation
    """
    payload = verify_token(token)
    return {"valid": True, "payload": payload}

# ---------- OAuth2 password flow (token endpoint) ----------
@router.post("/token", response_model=TokenResponse, summary="Obtain JWT via username & password")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != settings.BASIC_USERNAME or form_data.password != settings.BASIC_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    access_token = create_access_token({"sub": form_data.username})
    return TokenResponse(access_token=access_token, expires_in=settings.JWT_EXPIRY_MINUTES)
