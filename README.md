# Dream Catcher — Intent-Based 5G Network Slice Controller

Dream Catcher is a system that automatically detects high-priority network activity (video calls, gaming, streaming) and switches WAN/network slice priority in real time to maintain quality of experience. It consists of four components that can run independently or together.

---

## Repository Structure

```
final-codebase-dreamcatcher/
├── dream-catcher-backend/          # Node.js REST API + WebSocket server (port 3002)
├── dream-catcher-frontend-business/ # Business stakeholder dashboard (port 5173)
├── dream-catcher-frontend-user/    # End-user router dashboard (port 5173)
└── dream-catcher-tui/              # Terminal UI — traffic monitor + slice controller
```

---

## Component Overview

### `dream-catcher-backend`
REST API and WebSocket server that acts as the central telemetry hub. Serves live metrics, network slice state, device info, and optimization events to the frontend dashboards.

- Runs on **port 3002**
- Two telemetry sources: `mock` (default, built-in 41s demo scenario) or `tui` (receives events forwarded from the TUI)
- WebSocket endpoint `ws://localhost:3002/ws/telemetry` pushes a telemetry tick every second
- Real network metrics (latency, jitter, packet loss) via ICMP ping

### `dream-catcher-frontend-business`
Business stakeholder dashboard showing the business impact of intelligent slice switching.

- Runs on **port 5173**
- Displays: quality-over-time chart with before/after switch markers, live technical metric cards, workflow state visualization, and business impact summary
- Can run in self-contained demo mode (no backend needed) or connected to the backend via WebSocket
- Switch between end-user and business view by editing `dashboardType` in `App.jsx`

### `dream-catcher-frontend-user`
End-user facing router dashboard for monitoring and configuring the 5G smart router.

- Runs on **port 5173**
- Displays: router status, current activity and active network slice, performance metrics, network priority configuration, and an optimization log
- Has its own local Express server on **port 3001**

### `dream-catcher-tui`
Fullscreen terminal UI that monitors live network traffic using deep packet inspection (NFStream + Python), classifies flows by intent, and automatically switches WAN priority via pfSense API when real-time traffic (Zoom, Teams, FaceTime) is detected.

- Built with [Ink](https://github.com/vadimdemedes/ink) (React for terminals) + TypeScript
- **Demo mode**: fully self-contained, no Python or network hardware needed
- **Live mode**: requires Python 3.12+, NFStream, root privileges, and a pfSense router
- Can forward events to the backend (`BACKEND_INGEST_URL`) to drive the frontend dashboards with real detections

---

## How to Run

Each component is a standalone Node.js project. Run them independently or combine them for a full end-to-end demo.

### Prerequisites

- Node.js 18+ and npm
- (TUI live mode only) Python 3.12+, root privileges, pfSense router

---

### Option A — Full Stack Demo (Recommended)

This wires the TUI → backend → frontend dashboards together.

**Terminal 1 — Backend (TUI ingest mode):**
```bash
cd dream-catcher-backend
npm install
TELEMETRY_SOURCE=tui npm run dev
# Backend listens on http://localhost:3002
```

**Terminal 2 — TUI (demo mode, forwarding events to backend):**
```bash
cd dream-catcher-tui
npm install
BACKEND_INGEST_URL=http://127.0.0.1:3002/api/ingest/event npm run dev -- --demo
```

**Terminal 3 — Business Dashboard:**
```bash
cd dream-catcher-frontend-business
npm install
npm run dev
# Open http://localhost:5173
```

---

### Option B — Backend + Frontend (Mock Data)

Backend runs its own built-in 41-second demo scenario. No TUI needed.

**Terminal 1 — Backend:**
```bash
cd dream-catcher-backend
npm install
npm run dev
# Starts on http://localhost:3002
```

**Terminal 2 — Business Dashboard:**
```bash
cd dream-catcher-frontend-business
npm install
npm run dev
# Open http://localhost:5173
```

---

### Option C — Frontend Self-Contained Demo

The business frontend includes a built-in telemetry simulator. No backend needed.

```bash
cd dream-catcher-frontend-business
npm install
npm run dev
# Open http://localhost:5173 — runs entirely in-browser
```

---

### Option D — TUI Only

```bash
cd dream-catcher-tui
npm install

# Demo mode (no dependencies)
npm run dev -- --demo

# Live mode (requires Python, root, pfSense)
sudo npm run dev -- -i en0
```

---

### Option E — End-User Dashboard

```bash
cd dream-catcher-frontend-user
npm install
npm run dev
# Open http://localhost:5173
```

---

## What to Expect

### TUI (demo mode)
A fullscreen terminal UI with four panels:
- **Left** — Scrolling table of detected network flows, color-coded by intent (red = real-time video calls, yellow = interactive work tools, cyan = gaming, blue = streaming, gray = background)
- **Top-right** — Current WAN slice state: `IDLE → SWITCHING → ACTIVE → COOLDOWN → REVERTING`
- **Mid-right** — Live metrics (latency, jitter, packet loss, throughput) with Unicode sparklines
- **Bottom-right** — Timestamped log of slice switch events

The demo runs a 45-second loop: idle traffic → Zoom detected → switch to low-latency WAN2 → real-time flows continue → cooldown → revert to WAN1 → repeat.

### Business Dashboard
A web dashboard with:
- Quality-over-time chart showing the measurable QoE improvement after a slice switch, with annotated before/after markers
- Live technical metric cards (latency, jitter, packet loss, throughput)
- Workflow state visualization showing the detection → decision → switching → stabilized pipeline
- Business impact summary (users affected, time patterns)

### Backend
Serves REST and WebSocket telemetry. After startup you can verify:
```bash
curl http://localhost:3002/api/health
curl http://localhost:3002/api/network-slice/current
curl http://localhost:3002/api/metrics/current
```

The WebSocket at `ws://localhost:3002/ws/telemetry` pushes a `telemetry_tick` message every second containing metrics, current slice, device states, and switch events.

---


## Demo Scenario Timeline

Both the backend simulator and TUI demo run scripted cycles so demos are reliable and reproducible:

| Time | Phase | What Happens |
|------|-------|-------------|
| 0–10s | Idle | Normal browsing traffic on default slice |
| 10s | Detect | Real-time traffic (e.g. Zoom) detected |
| 10–13s | Switching | System initiates slice switch |
| 13s | Stabilized | Low-latency slice active, QoE improves |
| 13–30s | Active | Optimized operation continues |
| 30–40s | Cooldown | Real-time traffic ends, cooldown timer runs |
| 40s+ | Revert | Returns to default slice |

---

## Environment Variables

| Variable | Component | Default | Description |
|----------|-----------|---------|-------------|
| `PORT` | backend | `3002` | HTTP server port |
| `TELEMETRY_SOURCE` | backend | `mock` | `mock` or `tui` |
| `BACKEND_INGEST_URL` | tui | unset | Forward TUI events to backend |
| `BACKEND_INGEST_FLOWS` | tui | unset | Set to `1` to include flow events |

---

## Tech Stack

| Component | Stack |
|-----------|-------|
| Backend | Node.js, Express, `ws` (WebSocket), `ping` |
| Business Frontend | React 18, Vite, Recharts |
| User Frontend | React 18, Vite |
| TUI | TypeScript, Ink (React for terminals), Node.js |
| Python Bridge (TUI live mode) | NFStream, nDPI, scapy, psutil, pyyaml |
