# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bill splitting application that uses Claude Sonnet 4.5 vision API to parse restaurant receipts and enable real-time collaborative bill splitting among friends. Currently in early development with the backend receipt parsing MVP implemented.

## Tech Stack

- **Backend**: Python 3.11+ with FastAPI (planned), currently standalone receipt parser
- **Receipt Parsing**: Claude Sonnet 4.5 vision API for OCR and structured data extraction
- **Frontend**: React + TypeScript (planned, not yet implemented)
- **Real-time**: WebSocket via Socket.io (planned)
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

### Testing Receipt Parser

```bash
# From backend/ directory with venv activated
python test_receipt.py path/to/receipt.jpg

# Example output will be saved to <filename>_parsed.json
```

### Environment Configuration

The backend requires an Anthropic API key in `backend/.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=4096
DEBUG=True
LOG_LEVEL=INFO
```

Get API keys from: https://console.anthropic.com/

## Architecture

### Current Implementation

The codebase currently has a working receipt parser module:

- **`backend/app/services/receipt_parser.py`**: Core receipt parsing using Claude vision API
  - `ReceiptParser` class handles image encoding and API communication
  - System prompt engineered to extract structured JSON from receipt images
  - Validates mathematical consistency (items sum to subtotal, tax/tip calculations)
  - Returns confidence levels (high/medium/low) and validation results

- **`backend/app/config.py`**: Environment-based configuration with validation
  - Loads from `.env` file using python-dotenv
  - Validates required API keys on initialization

- **`backend/test_receipt.py`**: CLI test script with pretty-printed output

### Planned Architecture (from PLAN.md)

The full application will follow this structure:

**Backend** (`backend/app/`):
- `routes/` - FastAPI endpoints for receipts, sessions, websocket
- `services/` - Business logic (receipt_parser already exists, need bill_calculator, session_manager)
- `models/` - Pydantic schemas and ORM models (sessions, participants, bill_items, item_assignments)
- `main.py` - FastAPI app entry point (not yet created)

**Frontend** (not yet created):
- React + TypeScript with Tailwind CSS + shadcn/ui
- Real-time collaboration via WebSocket
- State management via Redux or Zustand
- Components organized by domain: receipt/, session/, payment/

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

## API Design (Planned)

When implementing FastAPI endpoints, follow RESTful conventions:

- Session management: `POST /api/sessions`, `GET /api/sessions/:id`
- Receipt processing: `POST /api/receipts/upload`, `POST /api/receipts/scan`
- Bill items: `GET /api/sessions/:id/items`, `POST /api/items/:id/assign`
- WebSocket: Connect to `/ws/session/:id` for real-time updates

Events to broadcast via WebSocket:
- `item_assigned`, `participant_joined`, `payment_updated`, `bill_updated`

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
- Receipt parser with Claude vision API integration
- Basic validation and confidence scoring
- Environment configuration

**Next Steps** (from PLAN.md):
1. Create FastAPI app structure in `backend/app/main.py`
2. Implement bill splitting calculation logic in `services/bill_calculator.py`
3. Create session management with in-memory storage
4. Add WebSocket support for real-time collaboration
5. Build React frontend

## Important Notes

- The receipt parser expects images in JPEG, PNG, or WebP format
- API responses include validation results - always check `validation.is_valid` before trusting totals
- The system prompt in `receipt_parser.py` is carefully engineered; changes may affect parsing accuracy
- Claude model version is configurable via environment but defaults to `claude-sonnet-4-20250514`
