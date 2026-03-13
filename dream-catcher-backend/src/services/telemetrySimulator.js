/**
 * Telemetry Simulator Service
 * Generates deterministic telemetry data for demo/testing with real network metrics
 */

import { generateMetricsPoint } from './networkBenchmark.js';

// ============================================================================
// SCENARIO CONFIGURATION
// ============================================================================

/**
 * Demo scenario timeline (in seconds)
 * Total cycle: 41 seconds
 */
const SCENARIO = {
  NORMAL_PHASE: { start: 0, end: 10 },
  MEETING_DETECTED: { at: 10 },
  SWITCHING_TO_VIDEO: { start: 10, end: 13 },
  STABILIZED_ON_VIDEO: { start: 13, end: 28 },
  MEETING_ENDED: { at: 28 },
  SWITCHING_BACK: { start: 28, end: 32 },
  NORMAL_RESUMED: { start: 32, end: 41 }
};

const CYCLE_DURATION = 41; // seconds

// ============================================================================
// MOCK DEVICE DATA
// ============================================================================

const DEVICES = {
  normal: [
    { id: 'device-1', name: 'MacBook Pro', app: 'Safari', intent: 'Buffered Consumption', priority: 'low' },
    { id: 'device-2', name: 'iPhone', app: 'Dropbox', intent: 'Background', priority: 'low' },
    { id: 'device-3', name: 'iPad', app: 'YouTube', intent: 'Buffered Consumption', priority: 'low' }
  ],
  meeting: [
    { id: 'device-1', name: 'MacBook Pro', app: 'Zoom', intent: 'Conversational Real-time', priority: 'high' },
    { id: 'device-2', name: 'iPhone', app: 'Dropbox', intent: 'Background', priority: 'low' },
    { id: 'device-3', name: 'iPad', app: 'YouTube', intent: 'Buffered Consumption', priority: 'low' }
  ]
};

// ============================================================================
// METRICS PROFILES (will be mixed with real network data)
// ============================================================================

const METRICS_PROFILES = {
  normal: {
    latencyBase: 30,
    jitterBase: 3,
    throughputBase: 45,
    packetLossBase: 0.15
  },
  degraded: {
    latencyBase: 65,
    jitterBase: 12,
    throughputBase: 35,
    packetLossBase: 0.45
  },
  optimized: {
    latencyBase: 20,
    jitterBase: 2,
    throughputBase: 55,
    packetLossBase: 0.05
  }
};

// ============================================================================
// TELEMETRY SIMULATOR CLASS
// ============================================================================

export class TelemetrySimulator {
  constructor({ tickMs = 1000, useRealMetrics = true } = {}) {
    this.tickMs = tickMs;
    this.useRealMetrics = useRealMetrics;
    this.startTime = null;
    this.intervalId = null;
    this.tickCount = 0;
    this.listeners = new Set();
    this.lastRealMetrics = null;
  }

  /**
   * Get current scenario phase based on elapsed time
   */
  getPhase(elapsedSeconds) {
    const cycleTime = elapsedSeconds % CYCLE_DURATION;

    if (cycleTime < SCENARIO.NORMAL_PHASE.end) {
      return 'normal';
    } else if (cycleTime < SCENARIO.SWITCHING_TO_VIDEO.end) {
      return 'switching_to_video';
    } else if (cycleTime < SCENARIO.STABILIZED_ON_VIDEO.end) {
      return 'optimized';
    } else if (cycleTime < SCENARIO.SWITCHING_BACK.end) {
      return 'switching_back';
    } else {
      return 'normal_resumed';
    }
  }

  /**
   * Get event for current tick
   */
  getEvent(elapsedSeconds, prevPhase, currentPhase) {
    const cycleTime = elapsedSeconds % CYCLE_DURATION;

    // Meeting detected
    if (Math.floor(cycleTime) === SCENARIO.MEETING_DETECTED.at &&
        (prevPhase === 'normal' || prevPhase === 'normal_resumed')) {
      return 'MEETING_DETECTED';
    }

    // Switch initiated
    if (prevPhase === 'normal' && currentPhase === 'switching_to_video') {
      return 'SWITCH_INITIATED';
    }

    // Switch completed
    if (prevPhase === 'switching_to_video' && currentPhase === 'optimized') {
      return 'SWITCH_COMPLETED';
    }

    // Stabilized
    if (currentPhase === 'optimized' && Math.floor(cycleTime) === SCENARIO.SWITCHING_TO_VIDEO.end + 1) {
      return 'STABILIZED';
    }

    // Meeting ended
    if (Math.floor(cycleTime) === SCENARIO.MEETING_ENDED.at && currentPhase === 'switching_back') {
      return 'MEETING_ENDED';
    }

    // Switch back initiated
    if (prevPhase === 'optimized' && currentPhase === 'switching_back') {
      return 'SWITCH_BACK_INITIATED';
    }

    // Switch back completed
    if (prevPhase === 'switching_back' && currentPhase === 'normal_resumed') {
      return 'SWITCH_BACK_COMPLETED';
    }

    return null;
  }

  /**
   * Get switch marker for current state
   */
  getSwitchMarker(phase, event) {
    if (phase === 'switching_to_video' || event === 'SWITCH_INITIATED') {
      return {
        phase: 'switching',
        label: 'Switching to Video Slice',
        reason: 'High-priority meeting detected',
        timestamp: Date.now()
      };
    }

    if (phase === 'switching_back' || event === 'SWITCH_BACK_INITIATED') {
      return {
        phase: 'switching',
        label: 'Switching to Normal Slice',
        reason: 'Meeting ended',
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Generate metrics for current phase
   */
  async generateMetrics(phase) {
    let profile;

    switch (phase) {
      case 'switching_to_video':
        profile = METRICS_PROFILES.degraded;
        break;
      case 'optimized':
        profile = METRICS_PROFILES.optimized;
        break;
      case 'switching_back':
        profile = METRICS_PROFILES.normal;
        break;
      default:
        profile = METRICS_PROFILES.normal;
    }

    // Get real network metrics if enabled
    let realLatency = profile.latencyBase;
    if (this.useRealMetrics) {
      try {
        const realMetrics = await generateMetricsPoint();
        this.lastRealMetrics = realMetrics;
        // Blend real latency with scenario profile
        realLatency = (realMetrics.latencyMs + profile.latencyBase) / 2;
      } catch (e) {
        // Use profile defaults if real metrics fail
      }
    }

    // Add realistic variation
    const variation = {
      latency: (Math.random() - 0.5) * 6,
      jitter: (Math.random() - 0.5) * 2,
      throughput: (Math.random() - 0.5) * 8,
      packetLoss: Math.random() * 0.1
    };

    const latencyMs = Math.max(5, realLatency + variation.latency);
    const jitterMs = Math.max(0.5, profile.jitterBase + variation.jitter);
    const throughputMbps = Math.max(10, profile.throughputBase + variation.throughput);
    const packetLossPct = Math.max(0, profile.packetLossBase + variation.packetLoss);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(latencyMs, jitterMs, packetLossPct);

    return {
      latencyMs: Math.round(latencyMs * 100) / 100,
      jitterMs: Math.round(jitterMs * 100) / 100,
      throughputMbps: Math.round(throughputMbps * 100) / 100,
      packetLossPct: Math.round(packetLossPct * 100) / 100,
      qualityScore
    };
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(latencyMs, jitterMs, packetLossPct) {
    const latencyScore = Math.max(0, Math.min(100, 100 - (latencyMs - 20) * 0.5));
    const jitterScore = Math.max(0, Math.min(100, 100 - (jitterMs - 5) * 2));
    const packetLossScore = Math.max(0, Math.min(100, 100 - packetLossPct * 20));

    return Math.round(
      latencyScore * 0.4 +
      jitterScore * 0.3 +
      packetLossScore * 0.3
    );
  }

  /**
   * Generate a telemetry tick
   */
  async generateTick() {
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime) / 1000;

    // Determine phase and state
    const currentPhase = this.getPhase(elapsedSeconds);
    const prevPhase = this.getPhase(elapsedSeconds - this.tickMs / 1000);

    // Get event and marker
    const event = this.getEvent(elapsedSeconds, prevPhase, currentPhase);
    const switchMarker = this.getSwitchMarker(currentPhase, event);

    // Determine slice and decision status
    const isOnVideoSlice = currentPhase === 'optimized' || currentPhase === 'switching_to_video';
    const currentSlice = isOnVideoSlice ? 'video' : 'normal';
    const isSwitching = currentPhase === 'switching_to_video' || currentPhase === 'switching_back';
    const decisionStatus = isSwitching ? 'switching' : (currentPhase === 'optimized' ? 'stabilized' : 'idle');

    // Get devices based on state
    const isMeetingActive = currentPhase === 'optimized' ||
                           currentPhase === 'switching_to_video' ||
                           event === 'MEETING_DETECTED';
    const devices = isMeetingActive ? DEVICES.meeting : DEVICES.normal;

    // Generate metrics
    const metrics = await this.generateMetrics(currentPhase);

    // Build telemetry tick
    const tick = {
      state: {
        devices,
        currentSlice,
        decisionStatus
      },
      metrics,
      event,
      switchMarker,
      seriesPoint: {
        timestamp: now,
        latencyMs: metrics.latencyMs,
        jitterMs: metrics.jitterMs,
        quality: metrics.qualityScore,
        throughputMbps: metrics.throughputMbps,
        packetLossPct: metrics.packetLossPct
      }
    };

    this.tickCount++;
    return tick;
  }

  /**
   * Start the simulator
   */
  start(onTick) {
    if (this.intervalId) {
      this.stop();
    }

    this.startTime = Date.now();
    this.tickCount = 0;

    if (onTick) {
      this.listeners.add(onTick);
    }

    // Initial tick
    this.emitTick();

    // Start interval
    this.intervalId = setInterval(() => {
      this.emitTick();
    }, this.tickMs);

    console.log(`Telemetry simulator started (tick: ${this.tickMs}ms, realMetrics: ${this.useRealMetrics})`);
  }

  /**
   * Emit tick to all listeners
   */
  async emitTick() {
    try {
      const tick = await this.generateTick();
      for (const listener of this.listeners) {
        try {
          listener(tick);
        } catch (e) {
          console.error('Listener error:', e.message);
        }
      }
    } catch (e) {
      console.error('Tick generation error:', e.message);
    }
  }

  /**
   * Stop the simulator
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.listeners.clear();
    console.log('Telemetry simulator stopped');
  }

  /**
   * Add a listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Remove a listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Get current state without starting
   */
  async getCurrentState() {
    if (!this.startTime) {
      this.startTime = Date.now();
    }
    return this.generateTick();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let sharedSimulator = null;

/**
 * Get or create shared simulator instance
 */
export function getSharedSimulator(options = {}) {
  if (!sharedSimulator) {
    sharedSimulator = new TelemetrySimulator(options);
  }
  return sharedSimulator;
}

/**
 * Create a new simulator instance
 */
export function createTelemetrySimulator(options = {}) {
  return new TelemetrySimulator(options);
}
