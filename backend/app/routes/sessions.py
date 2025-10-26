"""
Session management API routes.
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.schemas import (
    Session, SessionCreate, SessionStatus,
    Participant, ParticipantCreate,
    BillItem, BillItemCreate,
    ItemAssignment, ItemAssignmentCreate, AssignItemRequest,
    JoinSessionRequest, JoinSessionResponse
)
from app.services.session_manager import session_manager

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=Session, status_code=status.HTTP_201_CREATED)
async def create_session(data: SessionCreate):
    """Create a new bill splitting session"""
    session = session_manager.create_session(data)
    return session


@router.get("/{session_id}", response_model=Session)
async def get_session(session_id: str):
    """Get a session by ID"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    return session


@router.get("/code/{session_code}", response_model=Session)
async def get_session_by_code(session_code: str):
    """Get a session by its 6-character code"""
    session = session_manager.get_session_by_code(session_code.upper())
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with code {session_code} not found"
        )
    return session


@router.put("/{session_id}", response_model=Session)
async def update_session(session_id: str, updates: dict):
    """Update a session"""
    session = session_manager.update_session(session_id, updates)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str):
    """Delete a session"""
    success = session_manager.delete_session(session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )


@router.post("/join", response_model=JoinSessionResponse)
async def join_session(data: JoinSessionRequest):
    """Join a session with a session code"""
    session = session_manager.get_session_by_code(data.sessionCode.upper())
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with code {data.sessionCode} not found"
        )

    # Create a participant for this user
    participant_data = ParticipantCreate(guestName=data.guestName)
    participant = session_manager.add_participant(session.id, participant_data)

    return JoinSessionResponse(session=session, participant=participant)


@router.post("/{session_id}/complete", response_model=Session)
async def complete_session(session_id: str):
    """Mark a session as completed"""
    session = session_manager.update_session(session_id, {"status": SessionStatus.completed})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    return session


# Participants

@router.get("/{session_id}/participants", response_model=List[Participant])
async def get_participants(session_id: str):
    """Get all participants in a session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    return session.participants


@router.post("/{session_id}/participants", response_model=Participant, status_code=status.HTTP_201_CREATED)
async def add_participant(session_id: str, data: ParticipantCreate):
    """Add a participant to a session"""
    participant = session_manager.add_participant(session_id, data)
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    return participant


@router.put("/participants/{participant_id}", response_model=Participant)
async def update_participant(participant_id: str, updates: dict):
    """Update a participant"""
    participant = session_manager.update_participant(participant_id, updates)
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Participant {participant_id} not found"
        )
    return participant


@router.post("/participants/{participant_id}/mark-paid", response_model=Participant)
async def mark_participant_paid(participant_id: str):
    """Mark a participant as paid"""
    participant = session_manager.update_participant(participant_id, {"paymentStatus": "paid"})
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Participant {participant_id} not found"
        )
    return participant


# Bill Items

@router.get("/{session_id}/items", response_model=List[BillItem])
async def get_session_items(session_id: str):
    """Get all items in a session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    return session.items


@router.post("/{session_id}/items", response_model=BillItem, status_code=status.HTTP_201_CREATED)
async def add_item(session_id: str, data: BillItemCreate):
    """Add an item to a session"""
    item = session_manager.add_item(session_id, data)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    return item


@router.put("/items/{item_id}", response_model=BillItem)
async def update_item(item_id: str, updates: dict):
    """Update a bill item"""
    item = session_manager.update_item(item_id, updates)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str):
    """Delete a bill item"""
    success = session_manager.delete_item(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )


# Item Assignments

@router.post("/items/assign", response_model=List[ItemAssignment])
async def assign_item(data: AssignItemRequest):
    """Assign an item to one or more participants"""
    item = session_manager.get_item(data.itemId)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {data.itemId} not found"
        )

    # Calculate split
    num_participants = len(data.participantIds)
    if num_participants == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must assign item to at least one participant"
        )

    split_percentage = 1.0 / num_participants if data.splitEqually else 1.0
    amount_per_person = (item.price * item.quantity) * split_percentage

    # Create assignments
    assignments = []
    for participant_id in data.participantIds:
        assignment_data = ItemAssignmentCreate(
            itemId=data.itemId,
            participantId=participant_id,
            splitPercentage=split_percentage,
            amount=amount_per_person
        )
        assignment = session_manager.add_assignment(assignment_data)
        if assignment:
            assignments.append(assignment)

    return assignments


@router.put("/assignments/{assignment_id}", response_model=ItemAssignment)
async def update_assignment(assignment_id: str, updates: dict):
    """Update an item assignment"""
    # Find and update assignment
    for session in session_manager.sessions.values():
        for assignment in session.assignments:
            if assignment.id == assignment_id:
                for key, value in updates.items():
                    if hasattr(assignment, key):
                        setattr(assignment, key, value)
                return assignment

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Assignment {assignment_id} not found"
    )


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(assignment_id: str):
    """Delete an item assignment"""
    success = session_manager.delete_assignment(assignment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found"
        )
