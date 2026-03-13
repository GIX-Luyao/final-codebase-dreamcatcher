# Dream Catcher — End-User Dashboard

End-user facing dashboard for monitoring and configuring the 5G smart router. Shows real-time router status, active network slice, performance metrics, and an optimization log.

## What It Shows

- **System status** — router state, optimization mode, and current operating mode
- **Current activity** — detected high-priority task and the active network slice
- **Performance metrics** — weekly reliability statistics
- **Network priority configuration** — toggle between automatic and custom rule modes, with Work and Games optimization goals
- **Optimization log** — transparent feed of system decisions and slice switch events

## Quick Start

### Prerequisites

- Node.js 18+

### Install and Run

```bash
npm install

# Run frontend and backend together (recommended)
npm run dev:all
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001

# Run frontend only
npm run dev

# Run backend only
npm run dev:server
```

### Build

```bash
npm run build
```

## Project Structure

The component includes a bundled Express server (`server/`) for its own local API:

```
dream-catcher-frontend-user/
├── server/
│   └── index.js        # Local Express API (port 3001)
└── src/                # React frontend (port 5173)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18, Vite |
| Animations | Framer Motion |
| Icons | Lucide React |
| Local API server | Express, CORS |
