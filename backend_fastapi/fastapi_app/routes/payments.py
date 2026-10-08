import uuid
import random
import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from ..core.database import get_db
from ..models.user import PaymentLog

router = APIRouter(prefix="/payments", tags=["Payments"])


class PaymentRequest(BaseModel):
    transaction_id: str = Field(..., description="Unique transaction ID from Django")
    amount: float = Field(..., gt=0, description="Payment amount (must be positive)")
    currency: str = Field(default="INR", max_length=3)
    card_last_four: Optional[str] = Field(default="", min_length=4, max_length=4)
    card_type: Optional[str] = Field(default="", description="CREDIT or DEBIT")
    user_id: int
    merchant_name: Optional[str] = ""
    description: Optional[str] = ""


class PaymentResponse(BaseModel):
    transaction_id: str
    status: str
    message: str
    failure_reason: Optional[str] = None
    processing_time_ms: int
    timestamp: str


class PaymentStatusResponse(BaseModel):
    transaction_id: str
    status: str
    amount: str
    currency: str
    created_at: str


def simulate_payment(amount: float, card_type: str) -> dict:
    """
    Simulate payment processing with realistic rules:
    - High amounts (>50000) have higher failure chance
    - Basic card type validation
    - Random success/failure with weighted probability
    """
    time.sleep(0.5)  # Simulate network/processing delay

    # Weighted success probability
    if amount > 100000:
        success_prob = 0.6  # 60% for very high amounts
    elif amount > 50000:
        success_prob = 0.75  # 75% for high amounts
    else:
        success_prob = 0.90  # 90% for normal amounts

    is_success = random.random() < success_prob

    if is_success:
        return {"status": "SUCCESS", "failure_reason": ""}
    else:
        reasons = [
            "Insufficient funds",
            "Card declined by issuer",
            "Transaction limit exceeded",
            "Suspicious activity detected",
        ]
        return {"status": "FAILED", "failure_reason": random.choice(reasons)}


@router.post("/process", response_model=PaymentResponse, summary="Process a Payment")
async def process_payment(payment: PaymentRequest, db: Session = Depends(get_db)):
    """
    **Module 3: Process Payment**

    - Accepts payment request from Django
    - Initial status: PENDING (set by Django)
    - Final status: SUCCESS or FAILED (determined here)
    - Simulates realistic payment processing
    - Logs payment result to payment_logs table
    """
    start_time = time.time()

    # Simulate payment processing
    result = simulate_payment(payment.amount, payment.card_type)
    processing_ms = int((time.time() - start_time) * 1000)

    # Log to payment_logs table
    try:
        log_entry = PaymentLog(
            transaction_id=payment.transaction_id,
            user_id=payment.user_id,
            amount=str(payment.amount),
            currency=payment.currency,
            card_last_four=payment.card_last_four if payment.card_last_four else None,
            card_type=payment.card_type if payment.card_type else None,
            status=result["status"],
            failure_reason=result["failure_reason"],
            processing_time_ms=processing_ms,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Continue even if logging fails - don't block payment response

    return PaymentResponse(
        transaction_id=payment.transaction_id,
        status=result["status"],
        message="Payment processed successfully" if result["status"] == "SUCCESS" else "Payment failed",
        failure_reason=result["failure_reason"] if result["failure_reason"] else None,
        processing_time_ms=processing_ms,
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get("/status/{transaction_id}", response_model=PaymentStatusResponse, summary="Get Payment Status")
async def get_payment_status(transaction_id: str, db: Session = Depends(get_db)):
    """
    **Get Payment Status**

    - Retrieve the processing status of a payment by transaction ID
    """
    log = db.query(PaymentLog).filter(PaymentLog.transaction_id == transaction_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found in payment logs"
        )
    return PaymentStatusResponse(
        transaction_id=log.transaction_id,
        status=log.status,
        amount=log.amount,
        currency=log.currency,
        created_at=str(log.created_at),
    )


@router.get("/logs", summary="Get All Payment Logs")
async def get_payment_logs(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    **Get Payment Processing Logs**

    - Returns all payment logs with optional status filter
    - Admin use only (no auth in FastAPI - Django handles auth)
    """
    query = db.query(PaymentLog)
    if status_filter:
        query = query.filter(PaymentLog.status == status_filter.upper())
    total = query.count()
    logs = query.offset(skip).limit(limit).all()

    return {
        "logs": [
            {
                "id": log.id,
                "transaction_id": log.transaction_id,
                "user_id": log.user_id,
                "amount": log.amount,
                "currency": log.currency,
                "card_last_four": log.card_last_four,
                "card_type": log.card_type,
                "status": log.status,
                "failure_reason": log.failure_reason,
                "processing_time_ms": log.processing_time_ms,
                "created_at": str(log.created_at),
            }
            for log in logs
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.get("/", summary="Payments service health check")
async def payments_root():
    """
    Minimal endpoint that proves the payments service is up.
    Returns a tiny JSON payload – useful for scripts / monitoring.
    """
    return {
        "status": "ready",
        "available_endpoints": [
            "/process   (POST)",
            "/status/{transaction_id}   (GET)",
            "/logs   (GET)",
        ],
    }
