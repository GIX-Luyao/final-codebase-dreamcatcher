/**
 * Mock Data Service
 * Generates mock data for devices, activities, events, and slices
 */

import { v4 as uuidv4 } from 'uuid';
import { NetworkSlice, Device, CurrentActivity, PerformanceMetrics, Event } from '../models/index.js';

// ============================================================================
// NETWORK SLICES
// ============================================================================

export const NETWORK_SLICES = [
  new NetworkSlice({
    id: 'normal',
    name: 'Normal Slice',
    type: 'normal',
    status: 'active',
    bandwidth: 25,
    latency: 28,
    packetLoss: 0.2,
    description: 'Standard network slice for general usage',
    icon: 'wifi'
  }),
  new NetworkSlice({
    id: 'video-conferencing',
    name: 'Video Conferencing Slice',
    type: 'video',
    status: 'active',
    bandwidth: 45,
    latency: 12,
    packetLoss: 0,
    description: 'Optimized for real-time video communication',
    icon: 'video'
  }),
  new NetworkSlice({
    id: 'gaming',
    name: 'Gaming Slice',
    type: 'gaming',
    status: 'active',
    bandwidth: 35,
    latency: 8,
    packetLoss: 0,
    description: 'Ultra-low latency for gaming',
    icon: 'gamepad'
  }),
  new NetworkSlice({
    id: 'streaming',
    name: 'Streaming Slice',
    type: 'streaming',
    status: 'active',
    bandwidth: 50,
    latency: 18,
    packetLoss: 0.1,
    description: 'High bandwidth for media streaming',
    icon: 'play'
  }),
  new NetworkSlice({
    id: 'iot',
    name: 'IoT Slice',
    type: 'iot',
    status: 'active',
    bandwidth: 10,
    latency: 35,
    packetLoss: 0.3,
    description: 'Efficient slice for IoT devices',
    icon: 'cpu'
  })
];

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

export const ACTIVITY_TYPES = [
  {
    type: 'Video Conference',
    priority: 'high',
    sliceId: 'video-conferencing',
    icon: 'video'
  },
  {
    type: 'Gaming',
    priority: 'high',
    sliceId: 'gaming',
    icon: 'gamepad'
  },
  {
    type: 'Streaming',
    priority: 'medium',
    sliceId: 'streaming',
    icon: 'play'
  },
  {
    type: 'Web Browsing',
    priority: 'normal',
    sliceId: 'normal',
    icon: 'globe'
  },
  {
    type: 'File Download',
    priority: 'medium',
    sliceId: 'normal',
    icon: 'download'
  },
  {
    type: 'Idle',
    priority: 'low',
    sliceId: 'normal',
    icon: 'pause'
  }
];

// ============================================================================
// PRIORITY RULES
// ============================================================================

export const PRIORITY_RULES = [
  {
    priority: 1,
    intent: 'Conversational Real-time',
    examples: ['video calls', 'voice calls', 'FaceTime'],
    sliceId: 'video-conferencing'
  },
  {
    priority: 2,
    intent: 'Interactive Workflows',
    examples: ['AI workflows', 'real-time editing', 'cloud coding'],
    sliceId: 'video-conferencing'
  },
  {
    priority: 3,
    intent: 'Interactive Entertainment',
    examples: ['gaming', 'live streaming', 'AR/VR'],
    sliceId: 'gaming'
  },
  {
    priority: 4,
    intent: 'Buffered Consumption',
    examples: ['streaming', 'browsing', 'social media'],
    sliceId: 'streaming'
  },
  {
    priority: 5,
    intent: 'Background',
    examples: ['updates', 'IoT', 'backups'],
    sliceId: 'normal'
  }
];

// ============================================================================
// MOCK DEVICES
// ============================================================================

const MOCK_DEVICES_DATA = [
  {
    id: 'device-1',
    name: 'MacBook Pro',
    type: 'laptop',
    macAddress: 'AA:BB:CC:DD:EE:F1',
    ipAddress: '192.168.1.101',
    currentApp: 'Zoom',
    intent: 'Conversational Real-time',
    priority: 'high',
    bandwidthUsage: 15.5
  },
  {
    id: 'device-2',
    name: 'iPhone 15',
    type: 'phone',
    macAddress: 'AA:BB:CC:DD:EE:F2',
    ipAddress: '192.168.1.102',
    currentApp: 'Safari',
    intent: 'Buffered Consumption',
    priority: 'low',
    bandwidthUsage: 2.3
  },
  {
    id: 'device-3',
    name: 'iPad Pro',
    type: 'tablet',
    macAddress: 'AA:BB:CC:DD:EE:F3',
    ipAddress: '192.168.1.103',
    currentApp: 'YouTube',
    intent: 'Buffered Consumption',
    priority: 'low',
    bandwidthUsage: 8.7
  },
  {
    id: 'device-4',
    name: 'PS5',
    type: 'other',
    macAddress: 'AA:BB:CC:DD:EE:F4',
    ipAddress: '192.168.1.104',
    currentApp: 'Call of Duty',
    intent: 'Interactive Entertainment',
    priority: 'high',
    bandwidthUsage: 12.1
  },
  {
    id: 'device-5',
    name: 'Smart TV',
    type: 'tv',
    macAddress: 'AA:BB:CC:DD:EE:F5',
    ipAddress: '192.168.1.105',
    currentApp: 'Netflix',
    intent: 'Buffered Consumption',
    priority: 'medium',
    bandwidthUsage: 25.0
  },
  {
    id: 'device-6',
    name: 'Nest Thermostat',
    type: 'iot',
    macAddress: 'AA:BB:CC:DD:EE:F6',
    ipAddress: '192.168.1.106',
    currentApp: null,
    intent: 'Background',
    priority: 'low',
    bandwidthUsage: 0.1
  }
];

// State for mock devices
let mockDevices = null;

/**
 * Get all mock devices with current state
 */
export function getMockDevices() {
  if (!mockDevices) {
    const now = new Date();
    mockDevices = MOCK_DEVICES_DATA.map(device => new Device({
      ...device,
      connected: true,
      connectedSince: new Date(now - Math.random() * 86400000).toISOString(),
      history: generateDeviceHistory(device.id)
    }));
  }
  return mockDevices;
}

/**
 * Get a specific device by ID
 */
export function getMockDevice(id) {
  const devices = getMockDevices();
  return devices.find(d => d.id === id) || null;
}

/**
 * Generate device history
 */
function generateDeviceHistory(deviceId) {
  const apps = ['Safari', 'Chrome', 'Zoom', 'Slack', 'Netflix', 'YouTube', 'Spotify'];
  const intents = ['Buffered Consumption', 'Conversational Real-time', 'Background', 'Interactive Workflows'];
  const history = [];
  const now = Date.now();

  for (let i = 0; i < 5; i++) {
    history.push({
      timestamp: new Date(now - (i + 1) * 900000).toISOString(),
      app: apps[Math.floor(Math.random() * apps.length)],
      intent: intents[Math.floor(Math.random() * intents.length)]
    });
  }

  return history;
}

// ============================================================================
// CURRENT STATE
// ============================================================================

let currentState = {
  currentSlice: 'normal',
  currentActivity: 'Web Browsing',
  decisionStatus: 'idle',
  optimizationMode: 'automatic',
  optimizationEnabled: true
};

/**
 * Get current network state
 */
export function getCurrentState() {
  return { ...currentState };
}

/**
 * Update current state
 */
export function updateCurrentState(updates) {
  currentState = { ...currentState, ...updates };
  return currentState;
}

/**
 * Get current network slice data
 */
export function getCurrentSliceData(activityType = null) {
  const activity = activityType || currentState.currentActivity;
  const activityInfo = ACTIVITY_TYPES.find(a => a.type === activity) || ACTIVITY_TYPES[3]; // Default to Web Browsing
  const slice = NETWORK_SLICES.find(s => s.id === activityInfo.sliceId) || NETWORK_SLICES[0];

  return {
    currentSlice: { ...slice },
    currentActivity: new CurrentActivity({
      isLive: true,
      activityType: activityInfo.type,
      priority: activityInfo.priority,
      icon: activityInfo.icon,
      sliceId: activityInfo.sliceId
    }),
    performanceMetrics: new PerformanceMetrics({
      weeklyReliability: 98,
      description: 'Network performed optimally 98% of the time this week'
    })
  };
}

// ============================================================================
// EVENTS
// ============================================================================

const EVENT_TYPES = [
  'SLICE_SWITCH',
  'DEVICE_CONNECTED',
  'DEVICE_DISCONNECTED',
  'OPTIMIZATION_TRIGGERED',
  'CONFIG_CHANGED',
  'ALERT'
];

let eventLog = [];
let eventIdCounter = 1;

/**
 * Generate initial event log
 */
function initializeEventLog() {
  if (eventLog.length > 0) return;

  const now = Date.now();
  const events = [
    {
      type: 'SLICE_SWITCH',
      message: 'Switched to Video Conferencing Slice',
      details: { from: 'normal', to: 'video', trigger: 'Zoom meeting detected', deviceId: 'device-1' }
    },
    {
      type: 'DEVICE_CONNECTED',
      message: 'iPhone 15 connected to network',
      details: { deviceId: 'device-2', ipAddress: '192.168.1.102' }
    },
    {
      type: 'OPTIMIZATION_TRIGGERED',
      message: 'Adjusted background downloads for smooth streaming',
      details: { action: 'throttle_background', affectedDevices: ['device-6'] }
    },
    {
      type: 'SLICE_SWITCH',
      message: 'Switched to Gaming Slice',
      details: { from: 'normal', to: 'gaming', trigger: 'Gaming session detected', deviceId: 'device-4' }
    },
    {
      type: 'CONFIG_CHANGED',
      message: 'Priority rules updated',
      details: { changedBy: 'user', changes: ['Moved gaming to priority 2'] }
    }
  ];

  events.forEach((event, index) => {
    eventLog.push(new Event({
      id: `evt-${String(eventIdCounter++).padStart(3, '0')}`,
      timestamp: new Date(now - index * 300000).toISOString(),
      ...event
    }));
  });
}

/**
 * Get events with pagination
 */
export function getEvents({ limit = 50, offset = 0, type = null } = {}) {
  initializeEventLog();

  let filtered = [...eventLog];
  if (type && type !== 'all') {
    filtered = filtered.filter(e => e.type === type);
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    events: paginated,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
}

/**
 * Add a new event
 */
export function addEvent(type, message, details = {}) {
  const event = new Event({
    id: `evt-${String(eventIdCounter++).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  });
  eventLog.unshift(event);
  return event;
}

// ============================================================================
// ROUTER CONFIG
// ============================================================================

let routerConfig = {
  status: 'running',
  optimizationEnabled: true,
  optimizationMode: 'automatic',
  firmwareVersion: '2.1.0',
  uptime: 864000,
  priorityRules: [...PRIORITY_RULES]
};

/**
 * Get router status
 */
export function getRouterStatus() {
  const devices = getMockDevices();
  return {
    ...routerConfig,
    connectedDevices: devices.filter(d => d.connected).length,
    currentSlice: currentState.currentSlice,
    lastSliceSwitch: eventLog.find(e => e.type === 'SLICE_SWITCH')?.timestamp || new Date().toISOString()
  };
}

/**
 * Update router config
 */
export function updateRouterConfig(updates) {
  if (updates.optimizationMode) {
    routerConfig.optimizationMode = updates.optimizationMode;
  }
  if (updates.priorityRules) {
    routerConfig.priorityRules = updates.priorityRules;
  }
  addEvent('CONFIG_CHANGED', 'Router configuration updated', { changes: Object.keys(updates) });
  return routerConfig;
}

/**
 * Get priority rules
 */
export function getPriorityRules() {
  return routerConfig.priorityRules;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get business impact analytics
 */
export function getAnalyticsImpact(period = '7d') {
  const periodMultiplier = {
    '24h': 1,
    '7d': 7,
    '30d': 30
  }[period] || 7;

  return {
    period,
    usersImpacted: Math.floor(2000 * (periodMultiplier / 7)),
    qoeImprovement: 35,
    avgLatencyReduction: 45,
    sliceSwitches: Math.floor(1250 * (periodMultiplier / 7)),
    uptimePercent: 99.9,
    peakConcurrentDevices: 150,
    bandwidthSaved: Math.floor(1250 * (periodMultiplier / 7))
  };
}
