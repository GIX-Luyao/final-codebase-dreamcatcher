# Dream Catcher — TUI

Fullscreen terminal UI for the Dream Catcher intent-based network slice controller. Monitors network traffic in real time, classifies flows by intent, and automatically switches WAN priority when latency-sensitive traffic (Zoom, Teams, FaceTime) is detected.

Built with [Ink](https://github.com/vadimdemedes/ink) (React for terminals) + TypeScript.

```
  ____                              ____       _       _
 |  _ \ _ __ ___  __ _ _ __ ___   / ___|__ _| |_ ___| |__   ___ _ __
 | | | | '__/ _ \/ _` | '_ ` _ \ | |   / _` | __/ __| '_ \ / _ \ '__|
 | |_| | | |  __/ (_| | | | | | || |__| (_| | || (__| | | |  __/ |
 |____/|_|  \___|\__,_|_| |_| |_| \____\__,_|\__\___|_| |_|\___|_|

┌─ Network Traffic ────────────────────────────────┐┌─ Slice Status ─────────────┐
│ 192.168.1.100:52066 66.220.156.68:443  Zoom      ││ Active: WAN2 (Low-Latency) │
│ 192.168.1.105:8080  142.250.80.46:443  YouTube   ││ Phase:  ACTIVE             │
│ 192.168.1.102:4433  52.96.166.130:443  Teams     ││ Trigger: Zoom              │
│ 192.168.1.100:9222  140.82.114.25:443  GITHUB    │├─ Network Metrics ──────────┤
│ 192.168.1.103:5353  224.0.0.251:5353   MDNS      ││ Latency   18.2ms ▁▂▃▅▇▅▃▂ │
│ ...                                               ││ Jitter     2.1ms ▁▁▂▁▁▂▁▁ │
│                                                   │├─ Slice Events ────────────┤
│                                                   ││ 10:23:15 ▲ SWITCH → WAN2  │
│                                                   ││ 10:22:45 ▼ REVERT → WAN1  │
└───────────────────────────────────────────────────┘└────────────────────────────┘
```

## pfSense Setup (Live Mode Only)

Live mode controls WAN switching via the pfSense REST API. Before running live mode you need:

1. **Install the pfSense API package** on your pfSense machine — install [pfSense-pkg-API](https://github.com/jaredhendrickson13/pfsense-api) via **System → Package Manager → Available Packages**.

2. **Generate an API key** — after installing the package, go to **System → API → Keys** and create a new key.

3. **Set your credentials** in `tools/wan_toggle-v2.py` (and `bridge/ndjson_bridge.py` if you use the standalone bridge):

```python
API_BASE_URL = "https://<your-pfsense-ip>/api/v2"
API_KEY = "YOUR_PFSENSE_API_KEY"
```

4. **Configure gateway names** to match your pfSense setup (check **System → Routing → Gateways**):

```python
GATEWAY_GROUP_NAME = "WAN_FAILOVER"   # your gateway group name
WAN1_GATEWAY_NAME  = "WAN1_DHCP"      # your WAN1 gateway name
WAN2_GATEWAY_NAME  = "WAN2_DHCP"      # your WAN2 gateway name
```

> The API key is not committed to this repository. Never commit credentials to source control.

---

## Quick Start

### Prerequisites

**Demo mode:** Node.js 18+

**Live mode:** Node.js 18+, Python 3.12+, root privileges, pfSense router with REST API enabled (see pfSense Setup above)

```bash
# Install Python dependencies (live mode only)
pip install nfstream pyyaml requests scapy psutil
```

### Install and Run

```bash
npm install

# Demo mode — simulated traffic, no dependencies needed
npm run dev -- --demo

# Demo mode + forward events to backend
BACKEND_INGEST_URL=http://127.0.0.1:3002/api/ingest/event npm run dev -- --demo

# Live mode — real traffic detection + WAN switching
sudo npm run dev -- -i en0

# Live mode with passive throughput measurement (default)
sudo npm run dev -- -i en0 --throughput-mode passive

# Live mode with active throughput measurement (HTTP download)
sudo npm run dev -- -i en0 --throughput-mode active
```

### Build

```bash
npm run build
npm start
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--demo` | Run with simulated traffic (45s looping cycle) | off (live mode) |
| `-i`, `--interface` | Network interface for live packet capture | `ens19` |
| `--python` | Path to Python 3 interpreter | `python3` |
| `--speed` | Demo playback speed multiplier | `1.0` |
| `--ingest` | Backend ingest URL (`POST /api/ingest/event`) | unset |
| `--throughput-mode` | `passive` (psutil) or `active` (HTTP download) | `passive` |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `q` | Quit |

## Panels

### Network Traffic (left)
Scrolling table of detected flows with fixed-width columns, color-coded by intent category:
- **Red** — Conversational Real-time (Zoom, FaceTime, Teams)
- **Yellow** — Interactive Workflows (Slack, GitHub)
- **Cyan** — Interactive Entertainment (Steam, Twitch)
- **Blue** — Buffered Consumption (YouTube, Netflix, Spotify)
- **Gray** — Background (DNS, NTP, iCloud sync)

Columns adapt to terminal width.

### Slice Status (top-right)
Current WAN state: active gateway, phase of the state machine (`IDLE → SWITCHING → ACTIVE → COOLDOWN → REVERTING`), triggering app, and time on slice. A pulsing `[*]` indicator shows when the low-latency slice is active.

### Network Metrics (mid-right)
Latency, jitter, throughput, and packet loss with Unicode sparkline history (`▁▂▃▄▅▆▇█`).

In live mode, metrics are measured every ~2 seconds:

| Metric | Method |
|--------|--------|
| Latency | ICMP ping to default gateway (scapy) |
| Jitter | Mean absolute deviation of last 30 RTT samples |
| Packet Loss | % of failed pings in 30-sample rolling window |
| Throughput (passive) | `psutil.net_io_counters()` bytes delta / time |
| Throughput (active) | HTTP download from Cloudflare speed test URL |

### Slice Events (bottom-right)
Persistent timestamped log of WAN switch events.

## Architecture

```
┌──────────────────────────┐     NDJSON (stdout)     ┌─────────────────────┐
│ bridge/ndjson_bridge.py  │ ──────────────────────▶ │ Ink React TUI       │
│                          │                          │                     │
│ NFStreamer + nDPI         │  {"type":"flow",...}     │ useFlows()          │
│ Intent classification    │  {"type":"switch",...}   │ useSliceState()     │
│ Auto WAN switching       │  {"type":"status",...}   │ useMetrics()        │
│ (pfSense API)            │  {"type":"metrics",...}  │                     │
└──────────────────────────┘                          └─────────────────────┘
```

**Live mode** spawns `bridge/ndjson_bridge.py` as a child process. The bridge runs NFStream for deep packet inspection, classifies flows using `intent_mapping.yaml`, and triggers WAN switching via the pfSense REST API when Conversational Real-time traffic is detected. All events stream to the TUI as newline-delimited JSON.

**Demo mode** generates the same event types in-process using scripted scenarios — no Python, no network hardware, no root needed.

### Running the Python Bridge Standalone

```bash
# Basic usage
sudo python3 bridge/ndjson_bridge.py en0

# With active throughput measurement
sudo python3 bridge/ndjson_bridge.py en0 --throughput-mode active

# With custom gateway
sudo python3 bridge/ndjson_bridge.py en0 --gateway 192.168.1.1

# View all options
python3 bridge/ndjson_bridge.py --help
```

## Backend Integration

If `--ingest` or `BACKEND_INGEST_URL` is set, the TUI forwards each `BridgeEvent` to `POST /api/ingest/event` on `dream-catcher-backend`. This lets the frontend dashboards display live detections and switch events driven by real traffic.

| Variable | Description |
|----------|-------------|
| `BACKEND_INGEST_URL` | Ingest endpoint URL |
| `BACKEND_INGEST_FLOWS=1` | Also forward flow events (not just slice events) |
| `BACKEND_INGEST_FLOW_SAMPLE_MS=500` | Throttle flow event forwarding interval |

## Demo Scenario

The demo plays a 45-second looping cycle:

| Time | Phase | What Happens |
|------|-------|-------------|
| 0–10s | Idle | Mixed background traffic on WAN1 |
| 10s | Detect | Zoom/FaceTime flow appears |
| 10–12s | Switch | WAN priority switches to WAN2 (low-latency) |
| 12–30s | Active | Real-time flows continue |
| 30s | Cooldown | Real-time traffic stops, 30s countdown begins |
| 40s | Revert | WAN priority reverts to WAN1 |
| 40–45s | Idle | Brief idle before cycle repeats |

## Project Structure

```
dream-catcher-tui/
├── src/
│   ├── index.tsx                  # CLI entry point (meow arg parsing)
│   ├── app.tsx                    # Root layout, event dispatch, mode routing
│   ├── components/
│   │   ├── FullScreen.tsx         # Alternate screen buffer + terminal size
│   │   ├── Header.tsx             # ASCII art logo + mode badge
│   │   └── StatusBar.tsx          # Bottom bar (mode, uptime, flows/sec)
│   ├── panels/
│   │   ├── FlowPanel.tsx          # Traffic table with adaptive columns
│   │   ├── FlowRow.tsx            # Single flow row, color-coded
│   │   ├── SliceStatus.tsx        # WAN state + pulsing indicator
│   │   ├── MetricsPanel.tsx       # Metrics + sparklines
│   │   └── EventPanel.tsx         # Switch event log
│   ├── hooks/
│   │   ├── useFlows.ts            # Ring buffer + flows/sec
│   │   ├── useSliceState.ts       # WAN state machine + cooldown
│   │   ├── useMetrics.ts          # Rolling metrics window
│   │   ├── useDemoEngine.ts       # Demo scenario playback
│   │   └── usePythonBridge.ts     # Python child process hook
│   ├── sources/
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── python-bridge.ts       # Child process + NDJSON parser
│   │   ├── demo-scenarios.ts      # 45s Zoom call cycle
│   │   ├── demo-data.ts           # Realistic flow templates
│   │   └── intent-colors.ts       # Intent → color mapping
│   └── utils/
│       ├── format.ts              # Fixed-width formatting
│       ├── ring-buffer.ts         # Circular buffer
│       └── sparkline.ts           # Unicode sparkline renderer
├── bridge/
│   └── ndjson_bridge.py           # Python NFStream → NDJSON bridge
├── package.json
└── tsconfig.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Terminal UI | Ink 5, React 18 |
| Language | TypeScript 5 |
| CLI parsing | meow |
| Python bridge | NFStream, nDPI, scapy, psutil, pyyaml |
