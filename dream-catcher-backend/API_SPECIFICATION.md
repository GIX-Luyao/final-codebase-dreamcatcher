# Smart Router API Specification

## Overview

This document outlines the API endpoints required for the Smart Router dashboard application. The project consists of two dashboards:

1. **End-User Dashboard** - Consumer-facing dashboard showing network optimization status
2. **Business Dashboard** - Enterprise view with real-time telemetry and device monitoring

---

## Base URL

```
Development: http://localhost:3002/api
```

---

## 1. Health & Status

### `GET /api/health`

Server health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-22T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 2. Network Slice Endpoints

### `GET /api/network-slice/current`

Get current network slice and activity information.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activityType` | string | No | Filter by activity type |

**Response:**
```json
{
  "success": true,
  "data": {
    "currentSlice": {
      "id": "video-conferencing",
      "name": "Video Conferencing Slice",
      "type": "video",
      "status": "active",
      "bandwidth": 45,
      "latency": 12,
      "packetLoss": 0,
      "description": "Optimized for real-time video communication",
      "icon": "video"
    },
    "currentActivity": {
      "isLive": true,
      "activityType": "Video Conference",
      "priority": "high",
      "icon": "video",
      "sliceId": "video-conferencing"
    },
    "performanceMetrics": {
      "weeklyReliability": 98,
      "description": "Network performed optimally 98% of the time this week"
    }
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `GET /api/network-slice/slices`

List all available network slice types.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "normal",
      "name": "Normal Slice",
      "type": "normal",
      "bandwidth": 25,
      "latency": 28,
      "packetLoss": 0.2,
      "description": "Standard network slice for general usage"
    },
    {
      "id": "video-conferencing",
      "name": "Video Conferencing Slice",
      "type": "video",
      "bandwidth": 45,
      "latency": 12,
      "packetLoss": 0,
      "description": "Optimized for real-time video communication"
    },
    {
      "id": "gaming",
      "name": "Gaming Slice",
      "type": "gaming",
      "bandwidth": 35,
      "latency": 8,
      "packetLoss": 0,
      "description": "Ultra-low latency for gaming"
    },
    {
      "id": "streaming",
      "name": "Streaming Slice",
      "type": "streaming",
      "bandwidth": 50,
      "latency": 18,
      "packetLoss": 0.1,
      "description": "High bandwidth for media streaming"
    },
    {
      "id": "iot",
      "name": "IoT Slice",
      "type": "iot",
      "bandwidth": 10,
      "latency": 35,
      "packetLoss": 0.3,
      "description": "Efficient slice for IoT devices"
    }
  ],
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `GET /api/network-slice/activities`

List all supported activity types.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "Video Conference",
      "priority": "high",
      "sliceId": "video-conferencing",
      "icon": "video"
    },
    {
      "type": "Gaming",
      "priority": "high",
      "sliceId": "gaming",
      "icon": "gamepad"
    },
    {
      "type": "Streaming",
      "priority": "medium",
      "sliceId": "streaming",
      "icon": "play"
    },
    {
      "type": "Web Browsing",
      "priority": "normal",
      "sliceId": "normal",
      "icon": "globe"
    },
    {
      "type": "File Download",
      "priority": "medium",
      "sliceId": "normal",
      "icon": "download"
    },
    {
      "type": "Idle",
      "priority": "low",
      "sliceId": "normal",
      "icon": "pause"
    }
  ],
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `GET /api/network-slice/simulate`

Get simulated network data with realistic variations (for demo purposes).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activityType` | string | No | Simulate specific activity |

**Response:** Same format as `/api/network-slice/current` with randomized metric variations.

---

## 3. Real-Time Telemetry (Business Dashboard)

These endpoints are required for the business dashboard's real-time monitoring features.

### `GET /api/telemetry`

Polling endpoint for telemetry data.

**Response:**
```json
{
  "success": true,
  "data": {
    "state": {
      "devices": [
        {
          "id": "device-1",
          "name": "MacBook Pro",
          "app": "Zoom",
          "intent": "Conversational Real-time",
          "priority": "high"
        },
        {
          "id": "device-2",
          "name": "iPhone",
          "app": "Dropbox",
          "intent": "Background",
          "priority": "low"
        }
      ],
      "currentSlice": "video",
      "decisionStatus": "stabilized"
    },
    "metrics": {
      "latencyMs": 20,
      "jitterMs": 2,
      "throughputMbps": 55,
      "packetLossPct": 0.05,
      "qualityScore": 95
    },
    "event": null,
    "switchMarker": null,
    "seriesPoint": {
      "timestamp": 1705920600000,
      "latencyMs": 20,
      "jitterMs": 2,
      "quality": 95,
      "throughputMbps": 55,
      "packetLossPct": 0.05
    }
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `WebSocket /ws/telemetry`

Real-time telemetry stream via WebSocket.

**Connection:** `ws://localhost:3002/ws/telemetry`

**Message Format (server → client):**
```json
{
  "type": "telemetry_tick",
  "data": {
    "state": { ... },
    "metrics": { ... },
    "event": "MEETING_DETECTED",
    "switchMarker": {
      "phase": "switching",
      "label": "Switching to Video Slice",
      "reason": "High-priority meeting detected",
      "timestamp": 1705920600000
    },
    "seriesPoint": { ... }
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

**Event Types:**
| Event | Description |
|-------|-------------|
| `MEETING_DETECTED` | Video conference activity detected |
| `SWITCH_INITIATED` | Network slice switch started |
| `SWITCH_COMPLETED` | Network slice switch finished |
| `STABILIZED` | Network performance stabilized |
| `MEETING_ENDED` | Video conference activity ended |
| `SWITCH_BACK_INITIATED` | Switching back to normal slice |
| `SWITCH_BACK_COMPLETED` | Returned to normal slice |

---

## 4. Device Management

### `GET /api/devices`

List all connected devices with their current activity.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "device-1",
      "name": "MacBook Pro",
      "type": "laptop",
      "macAddress": "AA:BB:CC:DD:EE:F1",
      "ipAddress": "192.168.1.101",
      "currentApp": "Zoom",
      "intent": "Conversational Real-time",
      "priority": "high",
      "bandwidthUsage": 15.5,
      "connected": true,
      "connectedSince": "2024-01-22T08:00:00.000Z"
    },
    {
      "id": "device-2",
      "name": "iPhone 15",
      "type": "phone",
      "macAddress": "AA:BB:CC:DD:EE:F2",
      "ipAddress": "192.168.1.102",
      "currentApp": "Safari",
      "intent": "Buffered Consumption",
      "priority": "low",
      "bandwidthUsage": 2.3,
      "connected": true,
      "connectedSince": "2024-01-22T09:30:00.000Z"
    }
  ],
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `GET /api/devices/:id`

Get details for a specific device.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Device identifier |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "device-1",
    "name": "MacBook Pro",
    "type": "laptop",
    "macAddress": "AA:BB:CC:DD:EE:F1",
    "ipAddress": "192.168.1.101",
    "currentApp": "Zoom",
    "intent": "Conversational Real-time",
    "priority": "high",
    "bandwidthUsage": 15.5,
    "connected": true,
    "connectedSince": "2024-01-22T08:00:00.000Z",
    "history": [
      {
        "timestamp": "2024-01-22T10:00:00.000Z",
        "app": "Safari",
        "intent": "Buffered Consumption"
      },
      {
        "timestamp": "2024-01-22T10:15:00.000Z",
        "app": "Zoom",
        "intent": "Conversational Real-time"
      }
    ]
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

## 5. Metrics & Analytics

### `GET /api/metrics/current`

Get current network performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "latencyMs": 20,
    "jitterMs": 2,
    "throughputMbps": 55,
    "packetLossPct": 0.05,
    "qualityScore": 95,
    "activeDevices": 3,
    "currentSlice": "video",
    "sliceSwitchesToday": 12
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `GET /api/metrics/history`

Get historical metrics for charting.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `1h` | Time period: `1h`, `6h`, `24h`, `7d` |
| `resolution` | string | No | `1m` | Data resolution: `1s`, `1m`, `5m`, `1h` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "1h",
    "resolution": "1m",
    "points": [
      {
        "timestamp": 1705917000000,
        "latencyMs": 25,
        "jitterMs": 3,
        "throughputMbps": 45,
        "packetLossPct": 0.1,
        "qualityScore": 88
      },
      {
        "timestamp": 1705917060000,
        "latencyMs": 22,
        "jitterMs": 2,
        "throughputMbps": 48,
        "packetLossPct": 0.08,
        "qualityScore": 91
      }
    ],
    "markers": [
      {
        "timestamp": 1705917300000,
        "type": "slice_switch",
        "from": "normal",
        "to": "video",
        "reason": "Meeting detected"
      }
    ]
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

## 6. Events & Logs

### `GET /api/events`

Get optimization event log.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Number of events to return |
| `offset` | number | No | 0 | Pagination offset |
| `type` | string | No | all | Filter by event type |

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt-001",
        "timestamp": "2024-01-22T10:30:00.000Z",
        "type": "SLICE_SWITCH",
        "message": "Switched to Video Conferencing Slice",
        "details": {
          "from": "normal",
          "to": "video",
          "trigger": "Zoom meeting detected",
          "deviceId": "device-1"
        }
      },
      {
        "id": "evt-002",
        "timestamp": "2024-01-22T10:15:00.000Z",
        "type": "DEVICE_CONNECTED",
        "message": "iPhone 15 connected to network",
        "details": {
          "deviceId": "device-2",
          "ipAddress": "192.168.1.102"
        }
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

## 7. Router Configuration

### `GET /api/router/status`

Get router status and configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "running",
    "optimizationEnabled": true,
    "optimizationMode": "automatic",
    "firmwareVersion": "2.1.0",
    "uptime": 864000,
    "connectedDevices": 5,
    "currentSlice": "video",
    "lastSliceSwitch": "2024-01-22T10:15:00.000Z"
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `PUT /api/router/config`

Update router configuration.

**Request Body:**
```json
{
  "optimizationMode": "automatic",
  "priorityRules": [
    {
      "priority": 1,
      "intent": "Conversational Real-time",
      "examples": ["video calls", "voice calls", "FaceTime"]
    },
    {
      "priority": 2,
      "intent": "Interactive Workflows",
      "examples": ["AI workflows", "real-time editing", "cloud coding"]
    },
    {
      "priority": 3,
      "intent": "Interactive Entertainment",
      "examples": ["gaming", "live streaming", "AR/VR"]
    },
    {
      "priority": 4,
      "intent": "Buffered Consumption",
      "examples": ["streaming", "browsing", "social media"]
    },
    {
      "priority": 5,
      "intent": "Background",
      "examples": ["updates", "IoT", "backups"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

### `GET /api/router/priority-rules`

Get current priority rules configuration.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "priority": 1,
      "intent": "Conversational Real-time",
      "examples": ["video calls", "voice calls", "FaceTime"],
      "sliceId": "video-conferencing"
    },
    {
      "priority": 2,
      "intent": "Interactive Workflows",
      "examples": ["AI workflows", "real-time editing", "cloud coding"],
      "sliceId": "video-conferencing"
    },
    {
      "priority": 3,
      "intent": "Interactive Entertainment",
      "examples": ["gaming", "live streaming", "AR/VR"],
      "sliceId": "gaming"
    },
    {
      "priority": 4,
      "intent": "Buffered Consumption",
      "examples": ["streaming", "browsing", "social media"],
      "sliceId": "streaming"
    },
    {
      "priority": 5,
      "intent": "Background",
      "examples": ["updates", "IoT", "backups"],
      "sliceId": "normal"
    }
  ],
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

## 8. Business Analytics (Business Dashboard)

### `GET /api/analytics/impact`

Get business impact metrics.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `7d` | Time period: `24h`, `7d`, `30d` |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "usersImpacted": 2000,
    "qoeImprovement": 35,
    "avgLatencyReduction": 45,
    "sliceSwitches": 1250,
    "uptimePercent": 99.9,
    "peakConcurrentDevices": 150,
    "bandwidthSaved": 1250
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

---

## Data Models

### NetworkSlice
```typescript
interface NetworkSlice {
  id: string;
  name: string;
  type: 'normal' | 'video' | 'gaming' | 'streaming' | 'iot';
  status: 'active' | 'inactive' | 'switching';
  bandwidth: number;      // Mbps
  latency: number;        // ms
  packetLoss: number;     // percentage
  description: string;
  icon: string;
}
```

### Device
```typescript
interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'phone' | 'tablet' | 'tv' | 'iot' | 'other';
  macAddress: string;
  ipAddress: string;
  currentApp: string | null;
  intent: string;
  priority: 'high' | 'medium' | 'low';
  bandwidthUsage: number;  // Mbps
  connected: boolean;
  connectedSince: string;  // ISO timestamp
}
```

### TelemetryTick
```typescript
interface TelemetryTick {
  state: {
    devices: Device[];
    currentSlice: string;
    decisionStatus: 'idle' | 'switching' | 'stabilized';
  };
  metrics: {
    latencyMs: number;
    jitterMs: number;
    throughputMbps: number;
    packetLossPct: number;
    qualityScore: number;
  };
  event: string | null;
  switchMarker: {
    phase: string;
    label: string;
    reason: string;
    timestamp: number;
  } | null;
  seriesPoint: {
    timestamp: number;
    latencyMs: number;
    jitterMs: number;
    quality: number;
    throughputMbps: number;
    packetLossPct: number;
  };
}
```

### Event
```typescript
interface Event {
  id: string;
  timestamp: string;       // ISO timestamp
  type: 'SLICE_SWITCH' | 'DEVICE_CONNECTED' | 'DEVICE_DISCONNECTED' |
        'OPTIMIZATION_TRIGGERED' | 'CONFIG_CHANGED' | 'ALERT';
  message: string;
  details: Record<string, any>;
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid activity type specified",
    "details": {
      "parameter": "activityType",
      "provided": "invalid",
      "allowed": ["Video Conference", "Gaming", "Streaming", "Web Browsing", "File Download", "Idle"]
    }
  },
  "timestamp": "2024-01-22T10:30:00.000Z"
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PARAMETER` | 400 | Invalid request parameter |
| `NOT_FOUND` | 404 | Resource not found |
| `DEVICE_NOT_FOUND` | 404 | Device not found |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
