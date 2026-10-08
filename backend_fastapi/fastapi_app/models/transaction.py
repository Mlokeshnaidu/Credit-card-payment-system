from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from ..core.database import Base
from datetime import datetime


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    description = Column(String(255), default="", nullable=True)
    merchant_name = Column(String(255), default="", nullable=True)
    status = Column(String(20), default="PENDING", nullable=False)
    transaction_id = Column(String(100), unique=True, index=True, nullable=True)
    failure_reason = Column(String(255), default="", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def date(self):
        """Compatibility property for created_at timestamp"""
        return self.created_at

    def __repr__(self):
        return f"<Transaction id={self.id} card_id={self.card_id} amount={self.amount} status={self.status}>"
