"""
In-memory session management service.
Stores active bill splitting sessions and provides CRUD operations.
"""

import uuid
import string
import random
from datetime import datetime
from typing import Dict, List, Optional
from app.models.schemas import (
    Session, SessionCreate, SessionStatus,
    Participant, ParticipantCreate,
    BillItem, BillItemCreate,
    ItemAssignment, ItemAssignmentCreate,
    PaymentStatus
)


class SessionManager:
    """Manages bill splitting sessions in memory"""

    def __init__(self):
        # In-memory storage
        self.sessions: Dict[str, Session] = {}
        self.sessions_by_code: Dict[str, str] = {}  # code -> session_id
        self.receipts: Dict[str, dict] = {}  # receipt_id -> receipt_data

    def _generate_session_code(self) -> str:
        """Generate a unique 6-character alphanumeric session code"""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if code not in self.sessions_by_code:
                return code

    def _generate_id(self) -> str:
        """Generate a unique UUID"""
        return str(uuid.uuid4())

    def create_session(self, data: SessionCreate) -> Session:
        """Create a new bill splitting session"""
        session_id = self._generate_id()
        session_code = self._generate_session_code()
        now = datetime.now()

        session = Session(
            id=session_id,
            sessionCode=session_code,
            restaurantName=data.restaurantName,
            receiptImageUrl=data.receiptImageUrl,
            subtotal=data.subtotal,
            tax=data.tax,
            tip=data.tip,
            total=data.total,
            status=SessionStatus.active,
            createdAt=now,
            updatedAt=now,
            items=[],
            participants=[],
            assignments=[]
        )

        self.sessions[session_id] = session
        self.sessions_by_code[session_code] = session_id

        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID"""
        return self.sessions.get(session_id)

    def get_session_by_code(self, session_code: str) -> Optional[Session]:
        """Get a session by its 6-character code"""
        session_id = self.sessions_by_code.get(session_code)
        if session_id:
            return self.sessions.get(session_id)
        return None

    def update_session(self, session_id: str, updates: dict) -> Optional[Session]:
        """Update a session"""
        session = self.sessions.get(session_id)
        if not session:
            return None

        # Update fields
        for key, value in updates.items():
            if hasattr(session, key):
                setattr(session, key, value)

        session.updatedAt = datetime.now()
        return session

    def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        session = self.sessions.get(session_id)
        if not session:
            return False

        del self.sessions[session_id]
        del self.sessions_by_code[session.sessionCode]
        return True

    def add_participant(self, session_id: str, data: ParticipantCreate) -> Optional[Participant]:
        """Add a participant to a session"""
        session = self.sessions.get(session_id)
        if not session:
            return None

        participant = Participant(
            id=self._generate_id(),
            sessionId=session_id,
            userId=data.userId,
            guestName=data.guestName,
            amountOwed=data.amountOwed,
            amountPaid=data.amountPaid,
            paymentStatus=data.paymentStatus,
            joinedAt=datetime.now()
        )

        session.participants.append(participant)
        session.updatedAt = datetime.now()
        return participant

    def get_participant(self, session_id: str, participant_id: str) -> Optional[Participant]:
        """Get a specific participant"""
        session = self.sessions.get(session_id)
        if not session:
            return None

        for participant in session.participants:
            if participant.id == participant_id:
                return participant
        return None

    def update_participant(self, participant_id: str, updates: dict) -> Optional[Participant]:
        """Update a participant"""
        for session in self.sessions.values():
            for participant in session.participants:
                if participant.id == participant_id:
                    for key, value in updates.items():
                        if hasattr(participant, key):
                            setattr(participant, key, value)
                    session.updatedAt = datetime.now()
                    return participant
        return None

    def add_item(self, session_id: str, data: BillItemCreate) -> Optional[BillItem]:
        """Add a bill item to a session"""
        session = self.sessions.get(session_id)
        if not session:
            return None

        item = BillItem(
            id=self._generate_id(),
            sessionId=session_id,
            name=data.name,
            price=data.price,
            quantity=data.quantity,
            category=data.category,
            lineNumber=data.lineNumber
        )

        session.items.append(item)
        session.updatedAt = datetime.now()
        return item

    def get_item(self, item_id: str) -> Optional[BillItem]:
        """Get a specific item"""
        for session in self.sessions.values():
            for item in session.items:
                if item.id == item_id:
                    return item
        return None

    def update_item(self, item_id: str, updates: dict) -> Optional[BillItem]:
        """Update an item"""
        for session in self.sessions.values():
            for item in session.items:
                if item.id == item_id:
                    for key, value in updates.items():
                        if hasattr(item, key):
                            setattr(item, key, value)
                    session.updatedAt = datetime.now()
                    return item
        return None

    def delete_item(self, item_id: str) -> bool:
        """Delete an item"""
        for session in self.sessions.values():
            for idx, item in enumerate(session.items):
                if item.id == item_id:
                    del session.items[idx]
                    session.updatedAt = datetime.now()
                    return True
        return False

    def add_assignment(self, data: ItemAssignmentCreate) -> Optional[ItemAssignment]:
        """Add an item assignment"""
        # Find the session containing this item
        item = self.get_item(data.itemId)
        if not item:
            return None

        session = self.sessions.get(item.sessionId)
        if not session:
            return None

        assignment = ItemAssignment(
            id=self._generate_id(),
            itemId=data.itemId,
            participantId=data.participantId,
            splitPercentage=data.splitPercentage,
            amount=data.amount
        )

        session.assignments.append(assignment)
        session.updatedAt = datetime.now()
        return assignment

    def delete_assignment(self, assignment_id: str) -> bool:
        """Delete an assignment"""
        for session in self.sessions.values():
            for idx, assignment in enumerate(session.assignments):
                if assignment.id == assignment_id:
                    del session.assignments[idx]
                    session.updatedAt = datetime.now()
                    return True
        return False

    def store_receipt(self, receipt_id: str, receipt_data: dict):
        """Store parsed receipt data"""
        self.receipts[receipt_id] = receipt_data

    def get_receipt(self, receipt_id: str) -> Optional[dict]:
        """Get stored receipt data"""
        return self.receipts.get(receipt_id)


# Global session manager instance
session_manager = SessionManager()
