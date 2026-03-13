# Business Stakeholder Dashboard - Demo Mode (MWS)

## Purpose
This dashboard exists to communicate business impact and decision logic. It translates network behavior into understandable outcomes (quality improvement, switching events).

It currently consumes telemetry via a streaming interface that supports both deterministic demo simulation and future live backend data, without requiring changes to UI components.

## Inputs --> Process --> Outputs
### Inputs
- Simulated telemetry (latency, jitter, packet loss)
- Task detection events (e.g. online meeting)
- Router decision state (normal / switching / stabilized)

### Process
- Stream telemetry via a unified hook
- Compute derived quality score from network metrics
- Detect switching boundaries and annotate timeline

### Output
- Real-time quality-over-time chart
- Before/after switching markers
- Live technical metric cards
- Visual workflow state (active slice, task priority)

## Evidence of functionality
- Deterministic demo runs end-to-end without backend
- Switching simulated events reliably produce measurable QoE change
- UI components respond to live streaming data
- Data contract mirrors expected backend payload shape

## Key Assumption Validated
- Task-aware slice switching produces observable, explainable movements in user experience quality that can be communicated to business stakeholders in real time.



---

# Telemetry Architecture
The Business Dashboard consumes router telemetry through a small pipeline designed to support both deterministic demo simulation and future backend integration. The goal is to keep UI components agnostic to the data source.

## `mock/telemetrySimulator.js` — Deterministic Telemetry Producer (Demo Mode)

**Purpose:** Generate a repeatable, time-based stream of telemetry updates that mimics a real router.

**How it works:**
- Runs a scripted scenario on a fixed timeline (e.g., normal → meeting detected → switching → stabilized → switch back)
- Emits an update every tickMs containing:
    - metrics (latency, jitter, packet loss, throughput)
    - a derived quality score (computed from weighted metrics)
    - state (e.g., switching/stabilized) and optional events (e.g., switch initiated/completed)
    - a series point for charting

Why: Ensures demos and development are reliable and reproducible without depending on live router/backend availability

## `hooks/useTelemetryStream.js` — Streaming Consumer + UI-Friendly State

**Purpose:** Provide a single React hook that turns telemetry updates into UI-ready state for charts, metric cards, and workflow highlights.

**How it works:**
- Subscribes to a telemetry source (currently the simulator in demo mode)
- Maintains and exposes:
    - metrics: latest snapshot for technical metric cards
    - series : rolling time series (e.g., last 60 points) for the quality chart
    - markers: “Before Switching” / “After Switching” annotations derived from switch events
    - state: current decision/slice status for workflow visualization
    - Encapsulates timing + buffering logic so UI components remain simple

**Why:** UI components can render real-time behavior by reading metrics/series/markers/state, without knowing whether data came from a simulator or the backend.

## `telemetry/telemetryClient.js` — Source Adapter (Backend-ready Interface)

**Purpose:** Define the boundary where the frontend will connect to real router telemetry when backend endpoints/streams are available.

**How it works:**
- Provides a subscribeTelemetry(onTick) function (or equivalent) that represents the “real” data source interface
- In demo mode, this may proxy to the simulator; in production, it will be replaced with:
    - polling (REST)
    - WebSocket streaming
    - SSE (Server-Sent Events)
    - or another transport

**Why:** Swapping from simulator → backend should only require changing the telemetry client implementation, not rewriting UI components or charts.