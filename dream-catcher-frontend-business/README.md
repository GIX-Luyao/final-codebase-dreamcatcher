# Dream Catcher — Business Dashboard

Business stakeholder dashboard that visualizes the impact of intelligent network slice switching. Translates real-time router telemetry into observable quality-of-experience outcomes.

## What It Shows

- **Quality-over-time chart** — live QoE score with annotated before/after switch markers
- **Workflow visualization** — step-by-step view of detection → decision → switching → stabilized pipeline
- **Technical metric cards** — live latency, jitter, packet loss, and throughput with short-term trend deltas
- **Business impact summary** — users affected, time-of-day patterns, and optimization statistics
- **Decision state** — current router state (monitoring / switching / stabilized) and active slice

## Quick Start

### Prerequisites

- Node.js 18+

### Install and Run

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Build

```bash
npm run build
```

## Telemetry Modes

The dashboard can run in two modes without any code changes to UI components:

**Demo mode (default)** — a built-in `telemetrySimulator.js` generates a deterministic, repeating scenario inside the browser. No backend required. Useful for stakeholder demos and development.

**Backend mode** — swap the telemetry client to connect to `dream-catcher-backend` via WebSocket (`ws://localhost:3002/ws/telemetry`). The UI components are data-source agnostic.

## Telemetry Architecture

```
telemetrySimulator.js       →   useTelemetryStream.js   →   UI components
(deterministic scenario)        (React hook: metrics,       (chart, cards,
                                 series, markers, state)     workflow panel)

telemetryClient.js              ↑ swap this layer to
(source adapter boundary)         connect a real backend
```

- `mock/telemetrySimulator.js` — scripted timeline: normal → meeting detected → switching → stabilized → switch back
- `hooks/useTelemetryStream.js` — maintains rolling time series, derives quality score, annotates switch boundaries
- `telemetry/telemetryClient.js` — interface boundary; replace with REST polling, WebSocket, or SSE to connect a live backend

## Switching to the End-User View

This codebase contains both the business and end-user dashboard layouts. To switch views, edit `dashboardType` in `src/App.jsx`:

```javascript
// Business stakeholder view (default)
const dashboardType = 'business'

// End-user router view
const dashboardType = 'user'
```

## Demo Scenario

The built-in simulator runs a scripted cycle (duration defined in `telemetrySimulator.js`):

| Phase | What Happens |
|-------|-------------|
| Normal | Baseline metrics, no high-priority traffic |
| Meeting detected | Task detection event fires |
| Switching | Router initiates slice switch, quality dip visible |
| Stabilized | Low-latency slice active, QoE improves — "After Switching" marker appears |
| Switch back | Meeting ends, router reverts to default slice |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18, Vite |
| Charts | Recharts |
| Styling | CSS variables |
