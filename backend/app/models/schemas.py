"""
Pydantic schemas for API requests and responses.
These match the TypeScript types defined in frontend/src/types/index.ts
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class PaymentStatus(str, Enum):
    """Payment status enum"""
    pending = "pending"
    paid = "paid"
    settled = "settled"


class SessionStatus(str, Enum):
    """Session status enum"""
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class BillItemBase(BaseModel):
    """Base bill item schema"""
    name: str
    price: float
    quantity: int = 1
    category: Optional[str] = None
    lineNumber: int = Field(..., alias="lineNumber")

    class Config:
        populate_by_name = True


class BillItemCreate(BillItemBase):
    """Schema for creating a bill item"""
    pass


class BillItem(BillItemBase):
    """Complete bill item schema"""
    id: str
    sessionId: str

    class Config:
        from_attributes = True


class ItemAssignmentBase(BaseModel):
    """Base item assignment schema"""
    itemId: str
    participantId: str
    splitPercentage: float  # 0-1 (e.g., 0.5 = 50%)
    amount: float


class ItemAssignmentCreate(ItemAssignmentBase):
    """Schema for creating an item assignment"""
    pass


class ItemAssignment(ItemAssignmentBase):
    """Complete item assignment schema"""
    id: str

    class Config:
        from_attributes = True


class ParticipantBase(BaseModel):
    """Base participant schema"""
    userId: Optional[str] = None
    guestName: Optional[str] = None
    amountOwed: float = 0.0
    amountPaid: float = 0.0
    paymentStatus: PaymentStatus = PaymentStatus.pending


class ParticipantCreate(ParticipantBase):
    """Schema for creating a participant"""
    pass


class Participant(ParticipantBase):
    """Complete participant schema"""
    id: str
    sessionId: str
    joinedAt: datetime

    class Config:
        from_attributes = True


class SessionBase(BaseModel):
    """Base session schema"""
    restaurantName: Optional[str] = None
    receiptImageUrl: Optional[str] = None
    subtotal: float = 0.0
    tax: float = 0.0
    tip: float = 0.0
    total: float = 0.0


class SessionCreate(SessionBase):
    """Schema for creating a session"""
    pass


class Session(SessionBase):
    """Complete session schema"""
    id: str
    sessionCode: str
    createdBy: Optional[str] = None
    status: SessionStatus = SessionStatus.active
    createdAt: datetime
    updatedAt: datetime
    items: List[BillItem] = []
    participants: List[Participant] = []
    assignments: List[ItemAssignment] = []

    class Config:
        from_attributes = True


class Receipt(BaseModel):
    """Receipt data from OCR parsing"""
    id: str
    restaurantName: Optional[str] = None
    items: List[BillItemBase] = []
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    tip: Optional[float] = None
    total: Optional[float] = None
    confidence: Optional[str] = None


# Request/Response schemas

class CreateSessionRequest(BaseModel):
    """Request to create a new session"""
    restaurantName: Optional[str] = None
    items: Optional[List[BillItemCreate]] = None


class JoinSessionRequest(BaseModel):
    """Request to join a session"""
    sessionCode: str
    guestName: Optional[str] = None


class JoinSessionResponse(BaseModel):
    """Response when joining a session"""
    session: Session
    participant: Participant


class AssignItemRequest(BaseModel):
    """Request to assign an item to participants"""
    itemId: str
    participantIds: List[str]
    splitEqually: bool = True


class UploadReceiptResponse(BaseModel):
    """Response from uploading a receipt"""
    receiptId: str
    imageUrl: str
