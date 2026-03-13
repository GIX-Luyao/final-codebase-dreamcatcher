# Dream Catcher — Backend

REST API and WebSocket server that acts as the central telemetry hub for the Dream Catcher system. Serves network slice state, device info, metrics, and optimization events to the frontend dashboards.

## How It Works

The backend supports two telemetry sources, controlled by the `TELEMETRY_SOURCE` environment variable:

- **`mock`** (default) — runs a built-in 41-second demo scenario via `telemetrySimulator.js`
- **`tui`** — receives `BridgeEvent` payloads forwarded from `dream-catcher-tui` via `POST /api/ingest/event` and serves them through the same REST and WebSocket APIs

In both modes the frontend dashboards connect the same way — the telemetry source is transparent to consumers.

## Project Structure

```
dream-catcher-backend/
├── package.json
└── src/
    ├── index.js                    # Server entry point
    ├── models/
    │   └── index.js                # Data models (NetworkSlice, Device, Event, etc.)
    ├── routes/
    │   ├── index.js                # Route exports
    │   ├── health.js               # GET /api/health
    │   ├── networkSlice.js         # GET /api/network-slice/*
    │   ├── telemetry.js            # GET /api/telemetry
    │   ├── devices.js              # GET /api/devices/*
    │   ├── metrics.js              # GET /api/metrics/*
    │   ├── events.js               # GET /api/events
    │   ├── router.js               # GET/PUT /api/router/*
    │   └── analytics.js            # GET /api/analytics/*
    ├── services/
    │   ├── mockData.js             # Mock data generators
    │   ├── networkBenchmark.js     # Real ICMP ping measurements
    │   └── telemetrySimulator.js   # Built-in 41s demo scenario
    └── websocket/
        └── telemetryStream.js      # WebSocket connection handler
```

## Quick Start

### Prerequisites

- Node.js 18+

### Install and Run

```bash
npm install

# Development (auto-reload on file changes)
npm run dev

# Production
npm start
```

The server starts on **http://localhost:3002** by default.

### Run in TUI Ingest Mode

```bash
TELEMETRY_SOURCE=tui npm run dev
```

Then start `dream-catcher-tui` with `BACKEND_INGEST_URL=http://127.0.0.1:3002/api/ingest/event` to forward TUI events into the backend.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | HTTP server port |
| `HOST` | `127.0.0.1` | Server bind address |
| `TELEMETRY_SOURCE` | `mock` | `mock` or `tui` |

## API Endpoints

Base URL: `http://localhost:3002/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/network-slice/current` | Current network slice and activity |
| GET | `/api/network-slice/slices` | All slice types |
| GET | `/api/network-slice/activities` | All activity types |
| GET | `/api/telemetry` | Polling endpoint for telemetry data |
| POST | `/api/ingest/event` | Ingest a TUI `BridgeEvent` (TUI mode only) |
| GET | `/api/devices` | List all connected devices |
| GET | `/api/devices/:id` | Get specific device details |
| GET | `/api/metrics/current` | Current metrics (real ICMP ping measurements) |
| GET | `/api/metrics/history` | Historical metrics for charting |
| GET | `/api/events` | Optimization event log |
| GET | `/api/router/status` | Router status |
| PUT | `/api/router/config` | Update router configuration |
| GET | `/api/router/priority-rules` | Priority rules |
| GET | `/api/analytics/impact` | Business impact metrics |

Query parameters for `/api/metrics/history`: `period` (`1h`, `6h`, `24h`, `7d`), `resolution` (`1s`, `1m`, `5m`, `1h`)

Query parameters for `/api/events`: `limit` (1–200), `offset`, `type`

Query parameters for `/api/analytics/impact`: `period` (`24h`, `7d`, `30d`)

## WebSocket

**Connection:** `ws://localhost:3002/ws/telemetry`

On connect the server sends a `welcome` message, then pushes a `telemetry_tick` every second containing metrics, current slice, device states, and any active switch events.

**Client → Server messages:**
- `{ "type": "ping" }` — keepalive
- `{ "type": "get_state" }` — request current state snapshot

### Verify with curl / wscat

```bash
curl http://localhost:3002/api/health
curl http://localhost:3002/api/network-slice/current
curl http://localhost:3002/api/metrics/current

# WebSocket test
npm install -g wscat
wscat -c ws://localhost:3002/ws/telemetry
```

## Demo Scenario (mock mode)

The built-in simulator runs a 41-second repeating cycle:

| Time | Phase | Event |
|------|-------|-------|
| 0–10s | Normal browsing | — |
| 10s | Meeting detected | `MEETING_DETECTED` |
| 10–13s | Switching to video slice | `SWITCH_INITIATED` |
| 13s | Switch complete | `SWITCH_COMPLETED`, `STABILIZED` |
| 13–28s | Optimized on video slice | — |
| 28s | Meeting ended | `MEETING_ENDED` |
| 28–32s | Switching back | `SWITCH_BACK_INITIATED` |
| 32s | Back to normal | `SWITCH_BACK_COMPLETED` |
| 32–41s | Normal operation | — |

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `cors` | CORS middleware |
| `ws` | WebSocket server |
| `ping` | ICMP latency measurement |
| `uuid` | Unique ID generation |
