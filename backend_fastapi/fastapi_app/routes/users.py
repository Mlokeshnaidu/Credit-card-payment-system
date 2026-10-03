from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", summary="Get All Users")
async def get_users(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """
    **Get all users** (for internal FastAPI use)
    """
    users = db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "date_joined": str(u.date_joined),
            }
            for u in users
        ],
        "total": db.query(User).count(),
    }


@router.get("/{user_id}", summary="Get User by ID")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """**Get user by ID**"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "phone": user.phone,
        "is_active": user.is_active,
        "date_joined": str(user.date_joined),
    }
