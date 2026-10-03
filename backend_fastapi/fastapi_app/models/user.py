from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    """FastAPI User model - mirrors Django User table"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(254), unique=True, index=True, nullable=False)
    username = Column(String(150), unique=True, index=True, nullable=False)
    full_name = Column(String(255))
    phone = Column(String(20), nullable=True)
    password = Column(String(255), nullable=False)  # Django hashed password
    is_active = Column(Boolean, default=True)
    is_staff = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    date_joined = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class PaymentLog(Base):
    """Payment processing log - FastAPI specific"""
    __tablename__ = "payment_logs"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, index=True)
    user_id = Column(Integer, index=True)
    amount = Column(String(20))
    currency = Column(String(3), default='INR')
    card_last_four = Column(String(4))
    card_type = Column(String(10))
    status = Column(String(10))  # PENDING, SUCCESS, FAILED
    failure_reason = Column(String(255), nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
