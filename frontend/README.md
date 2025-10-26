# Bill Splitter Frontend

React + TypeScript frontend for the Bill Splitting application.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Real-time**: Socket.io client
- **HTTP Client**: Axios

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── scan/              # Receipt scanning
│   └── session/[id]/      # Bill splitting session
├── components/
│   ├── common/            # Reusable components
│   ├── receipt/           # Receipt-related components
│   ├── session/           # Session-related components
│   ├── payment/           # Payment components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── services/              # API and socket services
├── store/                 # Zustand stores
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 8000

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and configure the API URLs.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Key Features

### Landing Page
- Create new bill splitting session
- Join existing session with code
- Feature highlights

### Receipt Scanning
- Camera capture for mobile devices
- File upload support
- AI-powered extraction using Claude vision
- Manual entry option

### Bill Splitting Session
- Real-time updates via WebSocket
- QR code sharing
- Item selection and assignment
- Automatic tax and tip calculation
- Participant tracking
- Payment status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000` |

## Development Notes

- The app uses Next.js App Router with client-side rendering for interactive features
- WebSocket connection is established automatically when the app loads
- State management is handled by Zustand stores (session and app state)
- All API calls go through the centralized `api` service
- UI components follow the shadcn/ui patterns for consistency

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Other Platforms

Build the production version:
```bash
npm run build
```

The output will be in the `.next` directory. Serve it with:
```bash
npm start
```

## Contributing

Please follow the existing code structure and patterns when adding new features.
