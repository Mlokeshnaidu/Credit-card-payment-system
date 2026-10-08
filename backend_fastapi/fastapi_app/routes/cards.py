from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.card import Card   # Adjust if your model lives elsewhere
from pydantic import BaseModel

router = APIRouter(prefix="/cards", tags=["Cards"])

class CardCreate(BaseModel):
    card_number: str
    expiry_month: int
    expiry_year: int
    cvv: str
    card_type: str = "VISA"  # default if not supplied
    # Optional extra fields matching DB schema
    card_holder_name: Optional[str] = "Test User"
    masked_card_number: Optional[str] = None
    bank_name: Optional[str] = None
    is_default: Optional[int] = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CardResponse(BaseModel):
    id: int
    last_four: str
    card_type: str

# -------------------- CREATE --------------------
@router.post("/", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(payload: CardCreate, db: Session = Depends(get_db)):
    # Simple implementation – store only the last four digits
    new_card = Card(
        user_id=1,                         # 👉‑Replace with real user handling later
        last_four_digits=payload.card_number[-4:],
        card_type=payload.card_type,
        card_holder_name=payload.card_holder_name,
        masked_card_number=payload.masked_card_number,
        expiry_month=payload.expiry_month,
        expiry_year=payload.expiry_year,
        bank_name=payload.bank_name,
        is_default=payload.is_default,
        created_at=payload.created_at,
        updated_at=payload.updated_at,
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return CardResponse(id=new_card.id,
                        last_four=new_card.last_four_digits,
                        card_type=new_card.card_type)

# -------------------- LIST --------------------
@router.get("/", response_model=list[CardResponse])
async def list_cards(db: Session = Depends(get_db)):
    # 👉‑Replace the hard‑coded user_id with the JWT‑derived id in production
    cards = db.query(Card).filter(Card.user_id == 1).all()
    return [
        CardResponse(id=c.id, last_four=c.last_four_digits, card_type=c.card_type)
        for c in cards
    ]

# -------------------- DELETE --------------------
@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return
