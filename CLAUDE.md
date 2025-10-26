# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bill splitting application that uses Claude Sonnet 4.5 vision API to parse restaurant receipts and enable real-time collaborative bill splitting among friends. Currently in early development with the backend receipt parsing MVP implemented.

## Tech Stack

- **Backend**: Python 3.11+ with FastAPI (in development), currently standalone receipt parser
- **Receipt Parsing**: Claude Sonnet 4.5 vision API for OCR and structured data extraction
- **Frontend**: Next.js 16 + React 19 + TypeScript (implemented)
- **UI Components**: Tailwind CSS v4 + shadcn/ui
- **State Management**: Zustand
- **Real-time**: WebSocket via Socket.io client (implemented on frontend, backend pending)
- **Data Storage**: In-memory (Redis) for MVP, PostgreSQL for production (planned)

## Development Commands

### Backend Setup

```bash
# From project root
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
# From project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs at http://localhost:3000

# Build for production
npm run build

# Lint code
npm run lint
```

### Testing Receipt Parser

```bash
# From backend/ directory with venv activated
# Note: Use Python's UTF-8 mode on Windows to avoid emoji encoding issues
python -X utf8 test_receipt.py path/to/receipt.jpg

# Example output will be saved to <filename>_parsed.json
```

### Environment Configuration

**Backend** requires an Anthropic API key in `backend/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=4096
DEBUG=True
LOG_LEVEL=INFO
FRONTEND_URL=http://localhost:3000
```

**Frontend** environment in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Get API keys from: https://console.anthropic.com/

## Architecture

### Current Implementation

**Backend** - Receipt parsing MVP:

- **`backend/app/services/receipt_parser.py`**: Core receipt parsing using Claude vision API
  - `ReceiptParser` class handles image encoding and API communication
  - System prompt engineered to extract structured JSON from receipt images
  - Validates mathematical consistency (items sum to subtotal, tax/tip calculations)
  - Returns confidence levels (high/medium/low) and validation results
  - Fixed to handle `None` values in prices/quantities

- **`backend/app/config.py`**: Environment-based configuration with validation
  - Loads from `.env` file using python-dotenv
  - Validates required API keys on initialization

- **`backend/test_receipt.py`**: CLI test script with pretty-printed output
  - Use `python -X utf8` on Windows to avoid emoji encoding errors

**Frontend** - Full application UI:

- **Pages** (`frontend/src/app/`):
  - `page.tsx` - Landing page with create/join session options
  - `scan/page.tsx` - Receipt scanning with camera capture and file upload
  - `session/[id]/page.tsx` - Bill splitting session view

- **Services** (`frontend/src/services/`):
  - `api.ts` - Complete Axios-based API client for all backend endpoints
  - `socket.ts` - WebSocket service using Socket.io for real-time updates

- **State Management** (`frontend/src/store/`):
  - `sessionStore.ts` - Zustand store for session state (items, participants, assignments)
  - `appStore.ts` - Global app state (loading, errors)

- **Types** (`frontend/src/types/`):
  - Complete TypeScript definitions matching backend schema
  - Session, BillItem, Participant, ItemAssignment, Receipt, User
  - WebSocket event types and API request/response types

- **UI Components** (`frontend/src/components/ui/`):
  - shadcn/ui components: Button, Card, Input

### Planned Backend Architecture

**Backend** (`backend/app/`) needs to be built to match frontend expectations:
- `main.py` - FastAPI app entry point with CORS configuration
- `routes/` - REST endpoints:
  - `sessions.py` - Session CRUD, join, complete
  - `receipts.py` - Upload, scan using existing receipt_parser
  - `websocket.py` - Real-time collaboration events
- `services/` - Business logic:
  - `receipt_parser.py` - ✅ Already implemented
  - `bill_calculator.py` - Calculate splits, tax/tip distribution
  - `session_manager.py` - In-memory session state management
- `models/` - Pydantic schemas matching frontend types:
  - `schemas.py` - Request/response models
  - `session.py` - Session, Participant domain models
  - `receipt.py` - BillItem, ItemAssignment models

### Key Design Decisions

1. **LLM-based Receipt Parsing**: Uses Claude vision API instead of traditional OCR to handle various receipt formats, handwriting, and extract context. Returns structured JSON directly.

2. **In-memory First**: MVP uses in-memory or Redis for session storage before migrating to PostgreSQL for production.

3. **Guest-first UX**: Sessions don't require user accounts; shareable codes/links enable quick collaboration.

4. **Proportional Split Logic**: Tax and tip are distributed proportionally based on each person's share of items.

## Code Patterns

### Receipt Parser Usage

```python
from app.services.receipt_parser import ReceiptParser

parser = ReceiptParser()

# From file path
receipt_data = parser.parse_receipt_from_path("receipt.jpg")

# From bytes
with open("receipt.jpg", "rb") as f:
    receipt_data = parser.parse_receipt(f.read())

# Response structure:
# {
#   "restaurant_name": str,
#   "items": [{"name": str, "price": float, "quantity": int}],
#   "subtotal": float,
#   "tax": float,
#   "tip": float,
#   "total": float,
#   "confidence": "high" | "medium" | "low",
#   "validation": {
#     "is_valid": bool,
#     "issues": [str],
#     "warnings": [str]
#   }
# }
```

### Configuration Pattern

All environment variables are centralized in `app/config.py` using a Config class. The config validates required values on import and raises clear errors if missing.

## API Design

The frontend expects these FastAPI endpoints (all prefixed with `/api`):

**Session Management**:
- `POST /api/sessions` - Create new session, returns Session with unique code
- `GET /api/sessions/{id}` - Get session by ID
- `GET /api/sessions/code/{code}` - Get session by 6-character code
- `PUT /api/sessions/{id}` - Update session (restaurant name, totals, etc.)
- `DELETE /api/sessions/{id}` - Delete session
- `POST /api/sessions/join` - Join session with code, returns session + participant
- `POST /api/sessions/{id}/complete` - Mark session as completed

**Receipt Processing**:
- `POST /api/receipts/upload` - Upload receipt image (multipart/form-data)
- `POST /api/receipts/{id}/scan` - Scan receipt using Claude vision API
- `GET /api/receipts/{id}` - Get parsed receipt data

**Bill Items**:
- `GET /api/sessions/{id}/items` - Get all items in session
- `POST /api/sessions/{id}/items` - Add item manually
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

**Item Assignments**:
- `POST /api/items/assign` - Assign item to participant(s)
- `PUT /api/assignments/{id}` - Update assignment
- `DELETE /api/assignments/{id}` - Remove assignment

**Participants**:
- `GET /api/sessions/{id}/participants` - Get all participants
- `POST /api/sessions/{id}/participants` - Add participant
- `PUT /api/participants/{id}` - Update participant
- `POST /api/participants/{id}/mark-paid` - Mark participant as paid

**WebSocket Events** (to implement):
- Client emits: `join_session`, `leave_session`
- Server broadcasts: `item_assigned`, `participant_joined`, `payment_updated`, `bill_updated`

## Data Models (Planned)

Key entities based on PLAN.md:

- **Session**: Unique shareable code, receipt data, totals, status (active/completed/cancelled)
- **Participant**: Links to user or stores guest_name, tracks amount_owed/paid
- **BillItem**: Individual line items from receipt with price and quantity
- **ItemAssignment**: Many-to-many relationship between participants and items with split_percentage

## Testing

Currently no test suite exists. When adding tests:
- Use `pytest` for backend tests
- Test receipt parser with sample receipts in `backend/tests/`
- Mock Anthropic API calls to avoid costs during testing

## Current State vs. Plan

**Completed**:
- ✅ Receipt parser with Claude vision API integration
- ✅ Basic validation and confidence scoring
- ✅ Environment configuration
- ✅ Full Next.js frontend with all pages and UI
- ✅ Complete API client and WebSocket service on frontend
- ✅ Zustand state management
- ✅ TypeScript type definitions

**In Progress**:
- ⚠️ FastAPI backend server to connect frontend and receipt parser

**Next Steps**:
1. Create FastAPI app in `backend/app/main.py` with CORS
2. Implement session management routes with in-memory storage
3. Implement receipt upload/scan routes using existing `receipt_parser.py`
4. Add WebSocket support for real-time collaboration
5. Implement bill calculation logic (tax/tip distribution)
6. Test end-to-end with frontend

## Important Notes

### Backend
- The receipt parser expects images in JPEG, PNG, or WebP format
- API responses include validation results - always check `validation.is_valid` before trusting totals
- The system prompt in `receipt_parser.py` is carefully engineered; changes may affect parsing accuracy
- Claude model version is configurable via environment but defaults to `claude-sonnet-4-20250514`
- On Windows, run Python with `-X utf8` flag to avoid emoji encoding issues in test script

### Frontend
- Frontend expects backend at `http://localhost:8000` by default (configurable)
- Session codes are 6-character alphanumeric strings
- Camera capture uses `getUserMedia` API with rear-facing camera preference
- All API calls go through centralized `api` service in `services/api.ts`
- Real-time updates handled by `socketService` in `services/socket.ts`

### Integration
- Frontend types in `frontend/src/types/index.ts` must match backend Pydantic schemas
- WebSocket events must be consistent between frontend and backend
- CORS must be configured on backend to allow frontend origin
