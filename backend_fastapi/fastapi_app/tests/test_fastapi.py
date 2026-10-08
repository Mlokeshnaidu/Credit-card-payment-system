"""
Unit tests for FastAPI Payment Processing Service & Dashboard Summary
Module 11: Testing Requirements
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from fastapi_app.main import app
from fastapi_app.core.config import settings
from fastapi_app.core.database import Base, get_db
from fastapi_app.models import User, Card, Transaction, PaymentLog

# Setup an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed test user
    user = User(
        id=1,
        email="testuser@example.com",
        username="testuser",
        full_name="Test User",
        password="pbkdf2_sha256$test$hashedpassword",
        is_active=True,
    )
    db.add(user)

    # Seed test card
    card = Card(
        id=1,
        user_id=1,
        card_holder_name="Test User",
        last_four_digits="4242",
        masked_card_number="**** **** **** 4242",
        card_type="CREDIT",
        expiry_month=12,
        expiry_year=2028,
        bank_name="Test Bank",
        is_default=1,
    )
    db.add(card)

    # Seed transactions
    now = datetime.utcnow()
    t1 = Transaction(
        id=1,
        user_id=1,
        card_id=1,
        amount=1500.0,
        currency="INR",
        status="SUCCESS",
        transaction_id="TXN-001",
        description="Grocery Store",
        created_at=now,
    )
    t2 = Transaction(
        id=2,
        user_id=1,
        card_id=1,
        amount=2500.0,
        currency="INR",
        status="SUCCESS",
        transaction_id="TXN-002",
        description="Online Shopping",
        created_at=now - timedelta(days=2),
    )
    t3 = Transaction(
        id=3,
        user_id=1,
        card_id=1,
        amount=500.0,
        currency="INR",
        status="FAILED",
        transaction_id="TXN-003",
        failure_reason="Insufficient funds",
        description="Coffee Shop",
        created_at=now - timedelta(days=3),
    )
    db.add_all([t1, t2, t3])
    db.commit()

    yield

    db.close()
    Base.metadata.drop_all(bind=engine)


def generate_test_jwt(user_id=1, username="testuser"):
    payload = {
        "user_id": user_id,
        "username": username,
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# --- 1. Health & Root Tests ---
def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# --- 2. Dashboard Summary Tests ---
def test_dashboard_summary_with_valid_jwt():
    token = generate_test_jwt(user_id=1)
    response = client.get(
        "/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total_transactions"] == 3
    assert data["total_amount_spent"] == 4000.0  # 1500 + 2500
    assert data["current_month_spending"] == 4000.0
    assert data["available_credit_limit"] == 46000.0  # 50000 - 4000
    assert len(data["last_5_transactions"]) == 3

    first_txn = data["last_5_transactions"][0]
    assert "amount" in first_txn
    assert "masked_card_number" in first_txn
    assert "date" in first_txn
    assert "status" in first_txn
    assert first_txn["masked_card_number"] == "**** **** **** 4242"


def test_dashboard_summary_missing_token():
    response = client.get("/dashboard/summary")
    assert response.status_code == 401
    assert "Authentication token required" in response.json()["detail"]


def test_dashboard_summary_invalid_token():
    response = client.get(
        "/dashboard/summary",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert response.status_code == 401


# --- 3. Payment Processing Tests ---
def test_payment_process():
    payload = {
        "transaction_id": "TXN-TEST-123",
        "amount": 1000.0,
        "currency": "INR",
        "card_last_four": "4242",
        "card_type": "CREDIT",
        "user_id": 1,
        "merchant_name": "Amazon",
    }
    response = client.post("/api/payments/process", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == "TXN-TEST-123"
    assert data["status"] in ["SUCCESS", "FAILED"]


def test_payment_status():
    # Process payment first
    payload = {
        "transaction_id": "TXN-STATUS-001",
        "amount": 200.0,
        "currency": "INR",
        "card_last_four": "4242",
        "card_type": "DEBIT",
        "user_id": 1,
    }
    client.post("/api/payments/process", json=payload)

    # Check status
    response = client.get("/api/payments/status/TXN-STATUS-001")
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == "TXN-STATUS-001"
    assert data["status"] in ["SUCCESS", "FAILED"]


# --- 4. Card Management Tests ---
def test_list_cards():
    response = client.get("/api/cards/")
    assert response.status_code == 200
    cards = response.json()
    assert isinstance(cards, list)
    assert len(cards) >= 1
    assert cards[0]["last_four"] == "4242"
