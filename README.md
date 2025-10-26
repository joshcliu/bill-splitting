# Bill Splitting App

A real-time bill splitting application that uses AI-powered receipt scanning to automatically divide restaurant bills among friends.

## Features

- AI-powered receipt scanning using Claude Sonnet 4.5 vision API
- Real-time collaboration with multiple users
- Automatic tax and tip distribution
- QR code and link sharing
- Camera support for mobile devices
- Flexible item assignment and splitting

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, Zustand, Socket.io
**Backend:** Python 3.11+, FastAPI (planned), Claude API

## Project Structure

```
bill-splitting/
├── frontend/          # Next.js React application
├── backend/           # Python backend with Claude vision
└── PLAN.md           # Detailed architecture and roadmap
```

## Setup

### Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Mac/Linux
   # or
   venv\Scripts\activate     # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

5. Test receipt parser:
   ```bash
   python test_receipt.py path/to/receipt.jpg
   ```

### Frontend

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Usage

1. **Create Session** - Start a new bill splitting session
2. **Scan Receipt** - Take a photo or upload an image
3. **Invite Friends** - Share the session code or QR code
4. **Split Bill** - Each person selects their items
5. **View Totals** - See individual amounts including proportional tax and tip

## Environment Variables

### Backend (.env)
- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `CLAUDE_MODEL` - Model version (default: claude-sonnet-4-20250514)
- `DEBUG` - Debug mode (default: True)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (default: ws://localhost:8000)

## Development Status

**Completed:** Frontend UI, receipt scanning interface, state management
**In Progress:** FastAPI backend, WebSocket implementation, database integration
**Planned:** User authentication, payment integration, bill history

## Commands

**Frontend:**
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run linter
```

**Backend:**
```bash
python test_receipt.py <image>  # Test receipt parsing
```

## License

MIT
