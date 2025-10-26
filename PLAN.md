# Bill Splitting App

A real-time bill splitting application that uses receipt scanning to automatically divide restaurant bills among friends.

## Overview

This application allows users to scan restaurant receipts and automatically split the bill among multiple people in real-time. Users can customize who ordered what, handle taxes and tips, and settle payments efficiently.

## Key Features

### Core Functionality
- **Receipt Scanning**: OCR-powered receipt scanning to extract items, prices, and totals
- **Real-time Collaboration**: Multiple users can join a bill-splitting session simultaneously
- **Smart Item Assignment**: Assign menu items to specific people or split items among multiple people
- **Tax & Tip Calculation**: Automatically calculate and distribute tax and tip proportionally
- **Payment Tracking**: Track who has paid and who still owes money
- **Payment Integration**: Integration with Venmo, Cash App, PayPal for easy settlements

### User Experience
- **Quick Session Creation**: Generate a shareable link/QR code for friends to join
- **Guest Access**: Join sessions without creating an account
- **Bill History**: Save and review past bills (for registered users)
- **Multiple Split Methods**: Split equally, by item, by percentage, or custom amounts

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Redux or Zustand
- **Real-time**: WebSocket (Socket.io)
- **UI Library**: Tailwind CSS + shadcn/ui or Material-UI
- **Mobile**: React Native (future) or PWA
- **Receipt Capture**: Device camera API

### Backend
- **Runtime**: Python 3.11+
- **Framework**: FastAPI (async support, automatic API docs, WebSocket support)
- **Database**: PostgreSQL (relational data) + Redis (sessions/cache)
- **ORM**: SQLAlchemy with Alembic for migrations
- **Real-time**: python-socketio with FastAPI integration
- **OCR Service**: Google Cloud Vision API, AWS Textract, or pytesseract
- **Authentication**: FastAPI JWT or Firebase Auth
- **API**: RESTful + WebSocket

### Infrastructure
- **Hosting**: Vercel (frontend), Railway/Render/Fly.io (Python backend)
- **File Storage**: AWS S3 or Cloudinary (receipt images)
- **Monitoring**: Sentry for error tracking
- **API Documentation**: Automatic with FastAPI (Swagger UI + ReDoc)

## Project Structure

```
bill-splitting/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Reusable UI components
│   │   │   ├── receipt/          # Receipt scanning & display
│   │   │   ├── session/          # Bill splitting session
│   │   │   └── payment/          # Payment tracking
│   │   ├── pages/
│   │   │   ├── index.tsx         # Landing page
│   │   │   ├── scan.tsx          # Receipt scanning page
│   │   │   ├── session/[id].tsx  # Active bill session
│   │   │   ├── history.tsx       # Bill history
│   │   │   └── profile.tsx       # User profile
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API calls
│   │   ├── store/                # State management
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Helper functions
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/           # API route handlers
│   │   │   │   ├── sessions.py
│   │   │   │   ├── receipts.py
│   │   │   │   ├── items.py
│   │   │   │   └── users.py
│   │   │   └── deps.py           # Dependencies (DB sessions, auth)
│   │   ├── models/               # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── session.py
│   │   │   ├── bill_item.py
│   │   │   └── participant.py
│   │   ├── schemas/              # Pydantic schemas (request/response)
│   │   │   ├── __init__.py
│   │   │   ├── session.py
│   │   │   ├── receipt.py
│   │   │   └── user.py
│   │   ├── services/             # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── ocr_service.py    # Receipt OCR processing
│   │   │   ├── bill_service.py   # Bill calculation logic
│   │   │   └── payment_service.py
│   │   ├── core/                 # Core configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py         # Settings and environment
│   │   │   ├── security.py       # Auth utilities
│   │   │   └── database.py       # DB connection
│   │   ├── middleware/           # Custom middleware
│   │   │   └── __init__.py
│   │   ├── socket/               # WebSocket handlers
│   │   │   ├── __init__.py
│   │   │   └── events.py
│   │   └── utils/                # Helper functions
│   │       └── __init__.py
│   ├── alembic/                  # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/
│   ├── requirements.txt
│   └── pyproject.toml
│
├── shared/                       # Shared types between frontend/backend
│   └── types/
│
└── docs/                         # Additional documentation
```

## Database Schema

### Core Tables
*Note: Using SQLAlchemy ORM with PostgreSQL backend*

#### Users
```python
users
  - id (UUID, PK)
  - email (String, unique, indexed)
  - name (String)
  - phone (String, optional)
  - payment_methods (JSON) # Venmo, PayPal handles
  - created_at (DateTime)
  - updated_at (DateTime)
```

#### Sessions
```python
sessions
  - id (UUID, PK)
  - session_code (String, unique, indexed) # Short shareable code
  - created_by (UUID, FK -> users)
  - restaurant_name (String)
  - receipt_image_url (String)
  - subtotal (Numeric(10,2))
  - tax (Numeric(10,2))
  - tip (Numeric(10,2))
  - total (Numeric(10,2))
  - status (Enum: active, completed, cancelled)
  - created_at (DateTime)
  - updated_at (DateTime)
```

#### Session Participants
```python
session_participants
  - id (UUID, PK)
  - session_id (UUID, FK -> sessions)
  - user_id (UUID, FK -> users, nullable) # Null for guests
  - guest_name (String, nullable)
  - amount_owed (Numeric(10,2))
  - amount_paid (Numeric(10,2))
  - payment_status (Enum: pending, paid, settled)
  - joined_at (DateTime)
```

#### Bill Items
```python
bill_items
  - id (UUID, PK)
  - session_id (UUID, FK -> sessions)
  - name (String)
  - price (Numeric(10,2))
  - quantity (Integer)
  - category (String, optional)
  - line_number (Integer) # Order on receipt
  - created_at (DateTime)
```

#### Item Assignments
```python
item_assignments
  - id (UUID, PK)
  - item_id (UUID, FK -> bill_items)
  - participant_id (UUID, FK -> session_participants)
  - split_percentage (Numeric(5,4)) # 1.0000 = 100%, 0.5000 = 50%
  - amount (Numeric(10,2))
```

## API Endpoints

### Session Management
- `POST /api/sessions` - Create a new bill splitting session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/join` - Join a session
- `POST /api/sessions/:id/complete` - Complete and finalize session

### Receipt Processing
- `POST /api/receipts/upload` - Upload receipt image
- `POST /api/receipts/scan` - Process receipt with OCR
- `GET /api/receipts/:id` - Get processed receipt data

### Bill Items
- `GET /api/sessions/:id/items` - Get all items in a session
- `POST /api/sessions/:id/items` - Add item manually
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Item Assignment
- `POST /api/items/:id/assign` - Assign item to participant(s)
- `PUT /api/assignments/:id` - Update assignment split
- `DELETE /api/assignments/:id` - Remove assignment

### Participants
- `GET /api/sessions/:id/participants` - Get all participants
- `POST /api/sessions/:id/participants` - Add participant
- `PUT /api/participants/:id` - Update participant details
- `POST /api/participants/:id/mark-paid` - Mark as paid

### User
- `GET /api/users/me` - Get current user
- `GET /api/users/me/history` - Get bill history
- `PUT /api/users/me` - Update user profile

### WebSocket Events
- `join_session` - Join a bill session
- `leave_session` - Leave a bill session
- `item_assigned` - Item was assigned to someone
- `participant_joined` - New participant joined
- `payment_updated` - Payment status changed
- `bill_updated` - Bill totals recalculated

## User Flow

### 1. Create Session Flow
1. User opens app and clicks "Split a Bill"
2. User takes photo of receipt or uploads existing image
3. OCR processes receipt and extracts items
4. User reviews and corrects any OCR errors
5. Session is created with unique shareable code/link
6. User invites friends via link, QR code, or SMS

### 2. Join Session Flow
1. Friend receives link/QR code
2. Opens link (no account required)
3. Enters their name (or logs in)
4. Views the bill items in real-time

### 3. Bill Splitting Flow
1. Participants tap items they ordered
2. For shared items, select multiple people to split
3. App automatically calculates tax and tip proportionally
4. Real-time updates show everyone's current amount owed
5. Adjust tip percentage as desired
6. Review final amounts

### 4. Payment & Settlement Flow
1. Each person sees their total amount owed
2. Payment links/buttons for Venmo, Cash App, PayPal
3. Mark payments as complete
4. Session creator sees payment tracking dashboard
5. Session completes when all payments marked as received

## OCR Processing Pipeline

1. **Image Upload** → Receipt image captured or uploaded
2. **Pre-processing** → Image enhancement (contrast, rotation correction)
3. **OCR Extraction** → Text extraction using OCR service
4. **Parsing** → Extract structured data:
   - Restaurant name
   - Line items (name + price)
   - Subtotal
   - Tax
   - Tip (if present)
   - Total
5. **Validation** → Check if totals add up correctly
6. **Review** → User confirms/corrects extracted data

## Security Considerations

- **Session Access**: Sessions are private and require unique codes
- **Rate Limiting**: Prevent API abuse
- **Image Storage**: Automatic deletion of receipt images after 30 days
- **Guest Data**: Minimal data collection for guest users
- **Payment Info**: Never store payment credentials, only handles/usernames
- **Data Privacy**: GDPR compliant, allow users to delete their data

## Future Enhancements

### Phase 2
- [ ] Multiple currency support
- [ ] Split by percentage of total
- [ ] Custom tax rates per region
- [ ] Detailed analytics (spending habits, frequently visited restaurants)
- [ ] Integration with restaurant POS systems

### Phase 3
- [ ] Group management (saved groups of friends)
- [ ] Recurring splits (for roommates, subscriptions)
- [ ] Expense tracking and categorization
- [ ] Export to spreadsheet/PDF
- [ ] Split other types of bills (utilities, rent, trips)

### Phase 4
- [ ] Social features (friend lists, bill feed)
- [ ] Gamification (who treats most often, debt tracker)
- [ ] AI-powered item categorization
- [ ] Voice input for adding items
- [ ] Augmented reality receipt scanning

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)
- PostgreSQL 14+
- Redis (for caching and sessions)
- Google Cloud Vision API key (or alternative OCR service)

### Installation

#### Backend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/bill-splitting.git
cd bill-splitting/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd bill-splitting/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bill_splitting
REDIS_URL=redis://localhost:6379

# OCR Service
GOOGLE_CLOUD_VISION_API_KEY=your_api_key
# OR
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Authentication (JWT)
SECRET_KEY=your-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage
AWS_S3_BUCKET=your_bucket
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
FRONTEND_URL=http://localhost:3000

# Payment APIs (optional)
VENMO_API_KEY=your_key
PAYPAL_CLIENT_ID=your_client_id

# Application
DEBUG=True
LOG_LEVEL=INFO
```

#### Frontend (.env.local)
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Optional: Client-side API keys
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct.

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please open a GitHub issue or contact support@billsplitting.app

