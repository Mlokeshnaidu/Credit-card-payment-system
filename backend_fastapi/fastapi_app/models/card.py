from sqlalchemy import Column, Integer, String, ForeignKey
from ..core.database import Base

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # Made optional for demo purposes
    last_four_digits = Column(String(4), nullable=False)  # renamed to match DB column
    # Optional additional fields for future use
    card_holder_name = Column(String(255), nullable=True)
    masked_card_number = Column(String(20), nullable=True)
    expiry_month = Column(Integer, nullable=True)
    expiry_year = Column(Integer, nullable=True)
    bank_name = Column(String(100), nullable=True)
    is_default = Column(Integer, nullable=True)
    created_at = Column(String, nullable=True)
    updated_at = Column(String, nullable=True)
    card_type = Column(String(20), nullable=False)

    def __repr__(self):
        return f"<Card id={self.id} user_id={self.user_id} last_four={self.last_four_digits}>"
