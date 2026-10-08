"""
FastAPI Dashboard Service
Module: Credit Card Dashboard Summary
Requirements:
- GET /dashboard/summary (and /api/dashboard/summary)
- JWT Authentication (401 on failure)
- Optimized queries with SELECT SUM(amount) and LIMIT 5
- Metrics: total_transactions, total_amount_spent, current_month_spending, available_credit_limit, last_5_transactions
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional, Dict, Any

from ..core.database import get_db
from ..core.security import verify_jwt_token
from ..models.transaction import Transaction
from ..models.card import Card
from ..models.user import User

router = APIRouter(tags=["Dashboard"])


def resolve_user_id(payload: Dict[str, Any], db: Session, requested_user_id: Optional[int] = None) -> int:
    """
    Extracts and validates user_id from decoded JWT payload.
    Supports Django simplejwt (user_id) and FastAPI tokens (sub).
    """
    if requested_user_id is not None:
        return requested_user_id

    # 1. Django simplejwt puts user_id in payload
    user_id = payload.get("user_id")
    if user_id is not None:
        try:
            return int(user_id)
        except (ValueError, TypeError):
            pass

    # 2. Check 'sub' claim
    sub = payload.get("sub")
    if sub is not None:
        if str(sub).isdigit():
            return int(sub)
        # sub is username or email; lookup in users table
        user = db.query(User).filter((User.username == sub) | (User.email == sub)).first()
        if user:
            return user.id

    # 3. Fallback: if identity could not be parsed, reject
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to determine user ID from token",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.get("/dashboard/summary", summary="Dashboard summary for credit card usage")
@router.get("/summary", summary="Dashboard summary for credit card usage (prefixed)")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(verify_jwt_token),
    user_id: Optional[int] = Query(default=None, description="Optional user ID override"),
):
    """
    Fetch comprehensive dashboard metrics for the authenticated user.
    - Optimized with SELECT SUM(amount)
    - Returns last 5 transactions with masked card number, amount, date, status
    """
    current_user_id = resolve_user_id(payload, db, user_id)

    # 1. Total transactions count
    total_transactions = (
        db.query(Transaction).filter(Transaction.user_id == current_user_id).count()
    )

    # 2. Total amount spent (sum of all SUCCESS transactions) - optimized with SELECT SUM(amount)
    total_amount_spent = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(Transaction.user_id == current_user_id, Transaction.status == "SUCCESS")
        .scalar()
        or 0.0
    )

    # 3. Current month spending (start of month UTC)
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1, 0, 0, 0)
    current_month_spending = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
        .filter(
            Transaction.user_id == current_user_id,
            Transaction.status == "SUCCESS",
            Transaction.created_at >= month_start,
        )
        .scalar()
        or 0.0
    )

    # 4. Available credit limit (base limit of 50000)
    base_credit_limit = 50000.0
    available_credit_limit = round(max(0.0, base_credit_limit - float(total_amount_spent)), 2)

    # 5. Last 5 transactions - optimized with LIMIT 5
    recent_txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user_id)
        .order_by(Transaction.created_at.desc())
        .limit(5)
        .all()
    )

    last_5_transactions = []
    for txn in recent_txns:
        card = db.query(Card).filter(Card.id == txn.card_id).first() if txn.card_id else None
        if card and card.masked_card_number:
            masked = card.masked_card_number
        elif card and card.last_four_digits:
            masked = f"**** **** **** {card.last_four_digits}"
        else:
            masked = "**** **** **** ****"

        txn_date = txn.created_at.isoformat() if txn.created_at else datetime.utcnow().isoformat()
        last_5_transactions.append(
            {
                "amount": float(txn.amount),
                "masked_card_number": masked,
                "masked_card": masked,
                "date": txn_date,
                "status": txn.status,
                "description": txn.description or txn.merchant_name or "Card Payment",
            }
        )

    return {
        "total_transactions": total_transactions,
        "total_amount_spent": round(float(total_amount_spent), 2),
        "current_month_spending": round(float(current_month_spending), 2),
        "available_credit_limit": available_credit_limit,
        "last_5_transactions": last_5_transactions,
    }
