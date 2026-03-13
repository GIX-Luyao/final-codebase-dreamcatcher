/**
 * Data Models for Smart Router API
 * Following API_SPECIFICATION.md definitions
 */

/**
 * @typedef {'normal' | 'video' | 'gaming' | 'streaming' | 'iot'} SliceType
 * @typedef {'active' | 'inactive' | 'switching'} SliceStatus
 * @typedef {'high' | 'medium' | 'low'} Priority
 * @typedef {'laptop' | 'phone' | 'tablet' | 'tv' | 'iot' | 'other'} DeviceType
 * @typedef {'idle' | 'switching' | 'stabilized'} DecisionStatus
 */

/**
 * Network Slice definition
 */
export class NetworkSlice {
  constructor({
    id,
    name,
    type,
    status = 'active',
    bandwidth,
    latency,
    packetLoss,
    description,
    icon
  }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.status = status;
    this.bandwidth = bandwidth;
    this.latency = latency;
    this.packetLoss = packetLoss;
    this.description = description;
    this.icon = icon;
  }
}

/**
 * Device definition
 */
export class Device {
  constructor({
    id,
    name,
    type,
    macAddress,
    ipAddress,
    currentApp = null,
    intent,
    priority,
    bandwidthUsage,
    connected = true,
    connectedSince,
    history = []
  }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.macAddress = macAddress;
    this.ipAddress = ipAddress;
    this.currentApp = currentApp;
    this.intent = intent;
    this.priority = priority;
    this.bandwidthUsage = bandwidthUsage;
    this.connected = connected;
    this.connectedSince = connectedSince;
    this.history = history;
  }
}

/**
 * Current Activity definition
 */
export class CurrentActivity {
  constructor({
    isLive,
    activityType,
    priority,
    icon,
    sliceId
  }) {
    this.isLive = isLive;
    this.activityType = activityType;
    this.priority = priority;
    this.icon = icon;
    this.sliceId = sliceId;
  }
}

/**
 * Performance Metrics definition
 */
export class PerformanceMetrics {
  constructor({
    weeklyReliability,
    description
  }) {
    this.weeklyReliability = weeklyReliability;
    this.description = description;
  }
}

/**
 * Telemetry Tick for real-time streaming
 */
export class TelemetryTick {
  constructor({
    state,
    metrics,
    event = null,
    switchMarker = null,
    seriesPoint
  }) {
    this.state = state;
    this.metrics = metrics;
    this.event = event;
    this.switchMarker = switchMarker;
    this.seriesPoint = seriesPoint;
  }
}

/**
 * Event definition
 */
export class Event {
  constructor({
    id,
    timestamp,
    type,
    message,
    details = {}
  }) {
    this.id = id;
    this.timestamp = timestamp;
    this.type = type;
    this.message = message;
    this.details = details;
  }
}

/**
 * API Response wrapper
 */
export function createResponse(data, success = true) {
  return {
    success,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * API Error Response wrapper
 */
export function createErrorResponse(code, message, details = {}) {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}
