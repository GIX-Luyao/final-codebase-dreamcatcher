/**
 * TUI State Store
 * Ingests BridgeEvents from dream-catcher-tui and exposes backend-compatible data.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  NETWORK_SLICES,
  ACTIVITY_TYPES,
  PRIORITY_RULES
} from './mockData.js';
import { CurrentActivity, PerformanceMetrics, Event } from '../models/index.js';

const emitter = new EventEmitter();
const MAX_EVENTS = 200;
const MAX_SERIES = 200;
const DEVICE_TTL_MS = 60_000;
const CONNECTION_TIMEOUT_MS = 10_000;

const DEFAULT_METRICS = {
  latencyMs: 0,
  jitterMs: 0,
  throughputMbps: 0,
  packetLossPct: 0,
  qualityScore: 0
};

// 2A: Device tracking
const deviceMap = new Map();

const KNOWN_DEVICES = {
  '192.168.1.100': 'MacBook Pro',
  '192.168.1.102': 'iPhone 15',
  '192.168.1.103': 'iPad Air',
  '192.168.1.110': 'Apple TV',
  '192.168.1.115': 'HomePod',
};

// 2D: Series history accumulation
const seriesHistory = [];

const state = {
  currentSliceId: 'normal',
  decisionStatus: 'idle',
  currentActivityType: 'Web Browsing',
  lastTriggerApp: null,
  lastSwitchTrigger: null,  // Separate trigger for switch events (not overwritten by flows)
  lastIntent: null,
  lastStatus: null,
  lastPhase: null,        // 2B: track previous phase for transition mapping
  lastMetrics: { ...DEFAULT_METRICS },
  lastEventCode: null,
  lastEventAt: null,
  eventCount: 0,
  events: []
};

function mapWanToSliceId(activeWan) {
  return activeWan === 'wan2' ? 'video-conferencing' : 'normal';
}

function mapPhaseToDecisionStatus(phase) {
  if (phase === 'switching' || phase === 'reverting') return 'switching';
  if (phase === 'active' || phase === 'cooldown') return 'stabilized';
  return 'idle';
}

function sliceIdForIntent(intent) {
  const rule = PRIORITY_RULES.find(r => r.intent === intent);
  return rule ? rule.sliceId : 'normal';
}

function activityFromIntent(intent) {
  const sliceId = sliceIdForIntent(intent);
  return ACTIVITY_TYPES.find(a => a.sliceId === sliceId) || ACTIVITY_TYPES[3];
}

// 2A: Map intent to priority string
function priorityFromIntent(intent) {
  const rule = PRIORITY_RULES.find(r => r.intent === intent);
  if (!rule) return 'normal';
  if (rule.priority <= 1) return 'high';
  if (rule.priority <= 3) return 'medium';
  return 'low';
}

function computeQualityScore({ latencyMs, jitterMs, packetLossPct }) {
  const latencyScore = Math.max(0, Math.min(100, 100 - (latencyMs - 20) * 0.5));
  const jitterScore = Math.max(0, Math.min(100, 100 - (jitterMs - 5) * 2));
  const packetLossScore = Math.max(0, Math.min(100, 100 - packetLossPct * 20));

  return Math.round(
    latencyScore * 0.4 +
    jitterScore * 0.3 +
    packetLossScore * 0.3
  );
}

function pushEvent(type, message, details = {}) {
  const event = new Event({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  });

  state.events.unshift(event);
  if (state.events.length > MAX_EVENTS) {
    state.events.length = MAX_EVENTS;
  }
}

// 2A: Get active devices (filter stale entries)
function getActiveDevices() {
  const now = Date.now();
  const active = [];
  for (const [ip, dev] of deviceMap) {
    if (now - dev.lastSeenAt <= DEVICE_TTL_MS) {
      active.push({ ...dev });
    } else {
      deviceMap.delete(ip);
    }
  }
  return active;
}

// 2B: Map phase transitions to event codes
function mapPhaseTransition(currentPhase, previousPhase) {
  if (currentPhase === 'switching' && previousPhase !== 'switching') return 'MEETING_DETECTED';
  if (currentPhase === 'active' && previousPhase === 'switching') return 'STABILIZED';
  if (currentPhase === 'cooldown' && previousPhase === 'active') return 'MEETING_ENDED';
  if (currentPhase === 'reverting' && previousPhase === 'cooldown') return 'SWITCH_BACK_INITIATED';
  return null;
}

// 2C: Map event code to switchMarker
function switchMarkerForEvent(eventCode) {
  switch (eventCode) {
    case 'MEETING_DETECTED':
      return { phase: 'before', label: 'Before switching', reason: state.lastSwitchTrigger ? `Triggered by ${state.lastSwitchTrigger}` : 'Auto switch', timestamp: Date.now() };
    case 'SWITCH_COMPLETED':
      return { phase: 'after', label: 'After switching', reason: state.lastSwitchTrigger ? `Triggered by ${state.lastSwitchTrigger}` : 'Auto switch', timestamp: Date.now() };
    case 'MEETING_ENDED':
      return { phase: 'before', label: 'Before switching', reason: 'High-priority task ended', timestamp: Date.now() };
    case 'SWITCH_BACK_COMPLETED':
      return { phase: 'after', label: 'After switching', reason: 'Returning to normal', timestamp: Date.now() };
    default:
      return null;
  }
}

export function applyTuiEvent(event) {
  if (!event || !event.type || !event.data) return;

  state.lastEventAt = event.ts || Date.now();
  state.eventCount++;

  // Diagnostic: log every 10th event to confirm TUI→backend pipeline
  if (state.eventCount % 10 === 1) {
    console.log(`[TUI] Event #${state.eventCount}: type=${event.type}, devices=${deviceMap.size}, lastEventAt=${state.lastEventAt}`);
  }
  state.lastEventCode = null;

  switch (event.type) {
    case 'status': {
      const nextSliceId = mapWanToSliceId(event.data.activeWan);
      state.currentSliceId = nextSliceId;
      state.decisionStatus = mapPhaseToDecisionStatus(event.data.phase);

      // 2B: Map phase transition to meaningful event code
      const transitionCode = mapPhaseTransition(event.data.phase, state.lastPhase);
      state.lastPhase = event.data.phase;
      state.lastStatus = { ...event.data };

      if (transitionCode) {
        state.lastEventCode = transitionCode;
        pushEvent(
          'OPTIMIZATION_TRIGGERED',
          transitionCode,
          { phase: event.data.phase, activeWan: event.data.activeWan }
        );
      }
      break;
    }
    case 'switch': {
      const isToWan2 = event.data.action === 'switch_to_wan2';
      const toSliceId = isToWan2 ? 'video-conferencing' : 'normal';
      const fromSliceId = isToWan2 ? 'normal' : 'video-conferencing';

      state.currentSliceId = toSliceId;
      state.decisionStatus = 'stabilized';
      state.lastTriggerApp = event.data.trigger || null;
      state.lastSwitchTrigger = event.data.trigger || null;  // Store switch trigger separately

      const toSlice = NETWORK_SLICES.find(s => s.id === toSliceId) || NETWORK_SLICES[0];
      pushEvent(
        'SLICE_SWITCH',
        `Switched to ${toSlice.name}`,
        {
          from: fromSliceId,
          to: toSliceId,
          reason: event.data.reason,
          trigger: event.data.trigger,
          durationMs: event.data.durationMs,
          success: event.data.success
        }
      );

      state.lastEventCode = isToWan2 ? 'SWITCH_COMPLETED' : 'SWITCH_BACK_COMPLETED';
      break;
    }
    case 'metrics': {
      const metrics = {
        latencyMs: event.data.latencyMs,
        jitterMs: event.data.jitterMs,
        throughputMbps: event.data.throughputMbps,
        packetLossPct: event.data.packetLossPct
      };
      state.lastMetrics = {
        ...metrics,
        qualityScore: computeQualityScore(metrics)
      };
      state.lastEventCode = 'METRICS_UPDATE';
      break;
    }
    case 'flow': {
      // 2A: Upsert device from flow event
      const srcIp = event.data.srcIp;
      if (srcIp) {
        const deviceId = `device-${srcIp.replace(/\./g, '-')}`;
        const name = KNOWN_DEVICES[srcIp] || `Device ${srcIp}`;
        const intent = event.data.intent || 'Background';
        deviceMap.set(srcIp, {
          id: deviceId,
          name,
          app: event.data.app || 'Unknown',
          intent,
          priority: priorityFromIntent(intent),
          lastSeenAt: Date.now(),
          ipAddress: srcIp,
          connected: true
        });
      }

      state.lastTriggerApp = event.data.app || state.lastTriggerApp;
      state.lastIntent = event.data.intent || state.lastIntent;
      const activity = activityFromIntent(event.data.intent);
      state.currentActivityType = activity.type;
      state.lastEventCode = 'FLOW_UPDATE';
      break;
    }
    default:
      return;
  }

  const tick = getCurrentTelemetryTick();

  // 2D: Accumulate series history
  if (tick.seriesPoint) {
    seriesHistory.push(tick.seriesPoint);
    if (seriesHistory.length > MAX_SERIES) {
      seriesHistory.splice(0, seriesHistory.length - MAX_SERIES);
    }
  }

  emitter.emit('tick', tick);
}

export function getCurrentSliceData() {
  const slice = NETWORK_SLICES.find(s => s.id === state.currentSliceId) || NETWORK_SLICES[0];
  const activityType = state.currentActivityType || 'Web Browsing';
  const activityInfo = ACTIVITY_TYPES.find(a => a.type === activityType) || ACTIVITY_TYPES[3];

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

export function getCurrentMetrics() {
  return {
    ...state.lastMetrics,
    currentSlice: state.currentSliceId,
    sliceSwitchesToday: countSwitchesToday()
  };
}

function countSwitchesToday() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return state.events.filter(e => e.type === 'SLICE_SWITCH' && new Date(e.timestamp) >= startOfDay).length;
}

export function getEvents({ limit = 50, offset = 0, type = null } = {}) {
  let events = state.events;
  if (type && type !== 'all') {
    events = events.filter(e => e.type === type);
  }

  return {
    events: events.slice(offset, offset + limit),
    total: events.length,
    limit,
    offset
  };
}

export function getCurrentTelemetryTick() {
  const sliceType = (NETWORK_SLICES.find(s => s.id === state.currentSliceId) || NETWORK_SLICES[0]).type;

  // 2C: Correct switchMarker format (before/after)
  const marker = switchMarkerForEvent(state.lastEventCode);

  return {
    state: {
      devices: getActiveDevices(),
      currentSlice: sliceType,
      decisionStatus: state.decisionStatus
    },
    metrics: state.lastMetrics,
    event: state.lastEventCode,
    switchMarker: marker,
    seriesPoint: {
      timestamp: Date.now(),
      latencyMs: state.lastMetrics.latencyMs,
      jitterMs: state.lastMetrics.jitterMs,
      quality: state.lastMetrics.qualityScore,
      throughputMbps: state.lastMetrics.throughputMbps,
      packetLossPct: state.lastMetrics.packetLossPct
    }
  };
}

export function onTick(listener) {
  emitter.on('tick', listener);
  return () => emitter.off('tick', listener);
}

// 2A: Device exports for REST routes
export function getTuiDevices() {
  return getActiveDevices();
}

export function getTuiDevice(id) {
  return getActiveDevices().find(d => d.id === id) || null;
}

// 2D: Series history export
export function getSeriesHistory() {
  return [...seriesHistory];
}

// 2E: Connection status
export function isTuiConnected() {
  if (!state.lastEventAt) return false;
  return (Date.now() - state.lastEventAt) < CONNECTION_TIMEOUT_MS;
}

export function getTuiConnectionInfo() {
  return {
    connected: isTuiConnected(),
    lastEventAt: state.lastEventAt,
    eventCount: state.eventCount
  };
}

// 2F: Reset
export function resetTuiState() {
  state.currentSliceId = 'normal';
  state.decisionStatus = 'idle';
  state.currentActivityType = 'Web Browsing';
  state.lastTriggerApp = null;
  state.lastSwitchTrigger = null;
  state.lastIntent = null;
  state.lastStatus = null;
  state.lastPhase = null;
  state.lastMetrics = { ...DEFAULT_METRICS };
  state.lastEventCode = null;
  state.lastEventAt = null;
  state.eventCount = 0;
  state.events = [];
  deviceMap.clear();
  seriesHistory.length = 0;
}
