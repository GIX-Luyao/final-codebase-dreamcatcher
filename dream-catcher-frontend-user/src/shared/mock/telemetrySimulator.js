/**
 * Deterministic Router Telemetry Simulator
 * 
 * Runs on a timer; on each tick, generates one telemetry update; output: stream of TelemetryTick objects over time
 * 
 * Simulates router telemetry data with a scripted scenario:
 * - Normal browsing (10s)
 * - Meeting detected → switch initiated
 * - Switch completed (after 3s)
 * - Stabilized (15s)
 * - Meeting ends → switch back
 */

// Scenario events
const EVENT_MEETING_DETECTED = 'MEETING_DETECTED';
const EVENT_SWITCH_INITIATED = 'SWITCH_INITIATED';
const EVENT_SWITCH_COMPLETED = 'SWITCH_COMPLETED';
const EVENT_STABILIZED = 'STABILIZED';
const EVENT_MEETING_ENDED = 'MEETING_ENDED';
const EVENT_SWITCH_BACK_INITIATED = 'SWITCH_BACK_INITIATED';
const EVENT_SWITCH_BACK_COMPLETED = 'SWITCH_BACK_COMPLETED';

// System states
const STATE_NORMAL = 'NORMAL';
const STATE_MEETING_DETECTED = 'MEETING_DETECTED';
const STATE_SWITCHING = 'SWITCHING';
const STATE_ON_VIDEO_SLICE = 'ON_VIDEO_SLICE';
const STATE_SWITCHING_BACK = 'SWITCHING_BACK';

/**
 * Creates a deterministic telemetry simulator
 * @param {Object} options
 * @param {number} options.tickMs - Milliseconds between ticks (default: 1000)
 * @returns {Object} { start(onTick), stop() }
 */
export function createTelemetrySimulator({ tickMs = 1000 } = {}) {
  let intervalId = null;
  let tick = 0;
  let currentState = STATE_NORMAL;
  let currentEvent = null;
  
  
  // Scenario timeline (in ticks)
  const TICKS_NORMAL = 10; // 10s normal browsing
  const TICKS_SWITCH_DURATION = 3; // 3s to complete switch
  const TICKS_STABILIZED = 25; // 25s stabilized on video slice (slower task change)
  const TICK_MEETING_DETECTED = TICKS_NORMAL;
  const TICK_SWITCH_INITIATED = TICK_MEETING_DETECTED;
  const TICK_SWITCH_COMPLETED = TICK_SWITCH_INITIATED + TICKS_SWITCH_DURATION;
  const TICK_STABILIZED = TICK_SWITCH_COMPLETED;
  const TICK_MEETING_ENDED = TICK_STABILIZED + TICKS_STABILIZED;
  const TICK_SWITCH_BACK_INITIATED = TICK_MEETING_ENDED + 1;
  const TICK_SWITCH_BACK_COMPLETED = TICK_SWITCH_BACK_INITIATED + TICKS_SWITCH_DURATION;
  const TICK_CYCLE_END = TICK_SWITCH_BACK_COMPLETED + 5; // 5s normal after switch back, then loop


  // Base metrics for different states
  const METRICS_NORMAL = {
    latency: 30, // ms
    jitter: 3, // ms
    throughput: 45, // Mbps
    packetLoss: 0.15, // percent
  };

  const METRICS_MEETING_ON_NORMAL = {
    latency: 48, // ms - degraded (subtle drop)
    jitter: 7, // ms - degraded
    throughput: 40, // Mbps - reduced
    packetLoss: 0.28, // percent
  };

  const METRICS_ON_VIDEO_SLICE = {
    latency: 20, // ms - optimized
    jitter: 2, // ms - optimized
    throughput: 55, // Mbps - higher
    packetLoss: 0.05, // percent
  };

  /**
   * Adds realistic noise to metrics
   * @param {number} value - Base value
   * @param {number} variance - Max variance percentage (e.g., 0.1 for 10%)
   * @returns {number}
   */
  function addNoise(value, variance = 0.08) {
    const random = (Math.sin(tick * 0.5) + Math.cos(tick * 0.3)) * 0.5; // Deterministic pseudo-random
    return value + (value * variance * random);
  }

  /**
   * Smoothly transitions between two metric values
   * @param {number} from - Start value
   * @param {number} to - End value
   * @param {number} progress - Progress 0-1
   * @returns {number}
   */
  
  function lerp(from, to, progress) {
    return from + (to - from) * progress;
  }
  
  function clamp01(x) {
    return Math.max(0, Math.min(1, x));
  }

  function normalize(value, good, bad) {
    // 1 when value <= good, 0 when value >= bad
    return clamp01((bad - value) / (bad - good));
  }

  function computeQuality({ latencyMs, jitterMs, packetLossPct }) {
    const sLatency = normalize(latencyMs, 20, 120);
    const sJitter  = normalize(jitterMs, 2, 30);
    const sLoss    = normalize(packetLossPct, 0, 2);

    // Weighting: latency matters most; jitter next; loss still significant
    const score01 = 0.45 * sLatency + 0.30 * sJitter + 0.25 * sLoss;

    // Optional shaping so drops feel more noticeable
    return Math.round(100 * Math.pow(score01, 1.2));
  }

  /**
   * Gets metrics for current tick based on state
   * @returns {Object} { latencyMs, jitterMs, qualityScore, throughputMbps, packetLossPct }
   */
  function getMetrics() {
    let baseMetrics;
    let transitionProgress = 0;

    if (tick < TICK_MEETING_DETECTED) {
      // Normal browsing
      baseMetrics = METRICS_NORMAL;
    } else if (tick < TICK_SWITCH_COMPLETED) {
      // Meeting detected, switch in progress
      baseMetrics = METRICS_MEETING_ON_NORMAL;
    } else if (tick < TICK_MEETING_ENDED) {
      // On video slice, stabilized
      baseMetrics = METRICS_ON_VIDEO_SLICE;
    } else if (tick < TICK_SWITCH_BACK_COMPLETED) {
      // Switching back
      transitionProgress = (tick - TICK_SWITCH_BACK_INITIATED) / TICKS_SWITCH_DURATION;
      baseMetrics = {
        latency: lerp(METRICS_ON_VIDEO_SLICE.latency, METRICS_NORMAL.latency, transitionProgress),
        jitter: lerp(METRICS_ON_VIDEO_SLICE.jitter, METRICS_NORMAL.jitter, transitionProgress),
        throughput: lerp(METRICS_ON_VIDEO_SLICE.throughput, METRICS_NORMAL.throughput, transitionProgress),
        packetLoss: lerp(METRICS_ON_VIDEO_SLICE.packetLoss, METRICS_NORMAL.packetLoss, transitionProgress),
      };
    } else {
      // Back to normal
      baseMetrics = METRICS_NORMAL;
    }

    const latencyMs = Math.round(addNoise(baseMetrics.latency, 0.06));
    const jitterMs = Math.max(0, Math.round(addNoise(baseMetrics.jitter, 0.1)));
    const throughputMbps = Math.max(0, Math.round(addNoise(baseMetrics.throughput, 0.08) * 10) / 10);
    const packetLossPct = Math.max(
        0,
        Math.round(addNoise(baseMetrics.packetLoss, 0.2) * 1000) / 1000
      );
    const qualityScore = computeQuality({
      latencyMs,
      jitterMs,
      packetLossPct,
    });

    return {
      latencyMs,
      jitterMs,
      throughputMbps,
      packetLossPct,
      qualityScore,
    };
  }

  /**
   * Gets current system state
   * @returns {string}
   */
  function getState() {
    if (tick < TICK_MEETING_DETECTED) {
      return STATE_NORMAL;
    } else if (tick < TICK_SWITCH_COMPLETED) {
      return STATE_SWITCHING;
    } else if (tick < TICK_MEETING_ENDED) {
      return STATE_ON_VIDEO_SLICE;
    } else if (tick < TICK_SWITCH_BACK_COMPLETED) {
      return STATE_SWITCHING_BACK;
    } else {
      return STATE_NORMAL;
    }
  }

  /**
   * Gets event for current tick (if any)
   * @returns {string|null}
   */
  function getEvent() {
    if (tick === TICK_MEETING_DETECTED) {
      return EVENT_MEETING_DETECTED;
    } else if (tick === TICK_SWITCH_INITIATED) {
      return EVENT_SWITCH_INITIATED;
    } else if (tick === TICK_SWITCH_COMPLETED) {
      return EVENT_SWITCH_COMPLETED;
    } else if (tick === TICK_STABILIZED) {
      return EVENT_STABILIZED;
    } else if (tick === TICK_MEETING_ENDED) {
      return EVENT_MEETING_ENDED;
    } else if (tick === TICK_SWITCH_BACK_INITIATED) {
      return EVENT_SWITCH_BACK_INITIATED;
    } else if (tick === TICK_SWITCH_BACK_COMPLETED) {
      return EVENT_SWITCH_BACK_COMPLETED;
    }
    return null;
  }

  /**
   * Starts the simulator
   * @param {Function} onTick - Callback function receiving { state, metrics, event, seriesPoint }
   */
  function start(onTick) {
    if (intervalId) {
      stop();
    }

    // Reset state
    tick = 0;
    currentState = STATE_NORMAL;
    currentEvent = null;

    intervalId = setInterval(() => {
      currentState = getState();
      currentEvent = getEvent();
      
      let switchMarker = null;

      if (currentEvent === EVENT_MEETING_DETECTED) {
        switchMarker = {
          phase: 'before',
          label: 'Before switching',
          reason: 'High-priority task detected',
          timestamp: Date.now(),
        };
      }

      if (currentEvent === EVENT_SWITCH_COMPLETED) {
        switchMarker = {
          phase: 'after',
          label: 'After switching',
          reason: 'Video slice stabilized',
          timestamp: Date.now(),
        };
      }

      if (currentEvent === EVENT_MEETING_ENDED) {
        switchMarker = {
          phase: 'before',
          label: 'Before switching',
          reason: 'Priority dropped',
          timestamp: Date.now(),
        };
      }

      if (currentEvent === EVENT_SWITCH_BACK_COMPLETED) {
        switchMarker = {
          phase: 'after',
          label: 'After switching',
          reason: 'Normal slice stabilized',
          timestamp: Date.now(),
        };
      }
      if (switchMarker) console.log('MARK', switchMarker.phase, switchMarker.reason, tick);



      const metrics = getMetrics();
      
      const isMeeting = tick >= TICK_MEETING_DETECTED && tick < TICK_MEETING_ENDED;
      const isSwitching =
        (tick >= TICK_SWITCH_INITIATED && tick < TICK_SWITCH_COMPLETED) ||
        (tick >= TICK_SWITCH_BACK_INITIATED && tick < TICK_SWITCH_BACK_COMPLETED);

      // Device data based on scenario timeline
      const devices = [];
      
      // Device 1: Changes based on meeting state
      if (tick < TICK_MEETING_DETECTED || tick >= TICK_MEETING_ENDED) {
        // Normal state: Buffered Consumption
        devices.push({
          id: 'device1',
          name: '1',
          app: 'SAFARI',
          intent: 'Buffered Consumption',
          priority: 'low',
        });
      } else {
        // Meeting state: Conversational Real-time
        devices.push({
          id: 'device1',
          name: '1',
          app: 'ZOOM',
          intent: 'Conversational Real-time',
          priority: 'high',
        });
      }
      
      // Device 2: Always low priority background task
      devices.push({
        id: 'device2',
        name: '2',
        app: 'DROPBOX',
        intent: 'Background',
        priority: 'low',
      });
      
      // Device 3: Always low priority buffered consumption
      devices.push({
        id: 'device3',
        name: '3',
        app: 'YOUTUBE',
        intent: 'Buffered Consumption',
        priority: 'low',
      });

      // Determine current slice based on device intents
      // Video Conferencing Slice is active if ANY device has:
      // - 'Conversational Real-time'
      // - 'Interactive Workflows'
      // - 'Interactive Entertainment'
      // Otherwise, Normal Slice is active
      const videoSliceIntents = ['Conversational Real-time', 'Interactive Workflows', 'Interactive Entertainment'];
      const hasVideoSliceIntent = devices.some(device => videoSliceIntents.includes(device.intent));
      const currentSlice = hasVideoSliceIntent ? 'video' : 'normal';

      const routerState = {
        devices,
        currentSlice,
        decisionStatus: isSwitching ? 'switching' : isMeeting ? 'stabilized' : 'idle',
      };

      const seriesPoint = {
        timestamp: Date.now(),
        latencyMs: metrics.latencyMs,
        jitterMs: metrics.jitterMs,
        quality: metrics.qualityScore,
        throughputMbps: metrics.throughputMbps,
        packetLossPct: metrics.packetLossPct,
      };

      onTick({
        state: routerState,
        metrics,
        event: currentEvent,
        switchMarker,
        seriesPoint,
      });

      tick++;
      
      // Loop the simulation when cycle completes
      if (tick >= TICK_CYCLE_END) {
        tick = 0;
        currentState = STATE_NORMAL;
        currentEvent = null;
      }
    }, tickMs);
  }

  /**
   * Stops the simulator
   */
  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    start,
    stop,
  };
}
