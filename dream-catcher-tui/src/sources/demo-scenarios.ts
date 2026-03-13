import type { BridgeEvent } from './types.js';
import {
  generateBackgroundFlow,
  generateMixedFlow,
  generateRealtimeFlow,
  generateMetrics,
} from './demo-data.js';

export interface DemoScenario {
  name: string;
  durationMs: number;
  /** Generate events for this scenario. Called once per cycle. */
  schedule: (emit: (delayMs: number, event: BridgeEvent) => void) => void;
}

/**
 * Main demo scenario: Zoom call detection and WAN switch cycle.
 *
 * Timeline (~45 seconds):
 *   0-10s:  Normal mixed traffic on WAN1 (idle)
 *   10s:    Zoom flow appears → detect → switch to WAN2
 *   10-30s: Zoom flows continue alongside normal traffic (active on WAN2)
 *   30s:    Zoom ends → cooldown begins
 *   30-40s: Cooldown period (no more realtime flows)
 *   40s:    Cooldown expires → revert to WAN1
 *   40-45s: Brief idle on WAN1 before cycle repeats
 */
export const ZOOM_CALL_SCENARIO: DemoScenario = {
  name: 'Zoom Call Detection & WAN Switch',
  durationMs: 45_000,
  schedule(emit) {
    const ts = () => Date.now();

    // --- Phase 1: Normal traffic (0-10s) ---
    emit(0, { type: 'status', ts: ts(), data: { activeWan: 'wan1', phase: 'idle' } });

    // Background + mixed flows every ~800ms
    for (let t = 500; t < 10_000; t += 800 + Math.random() * 400) {
      emit(t, { type: 'flow', ts: ts(), data: generateMixedFlow() });
    }

    // Metrics on WAN1 every 2s
    for (let t = 1000; t < 10_000; t += 2000) {
      emit(t, { type: 'metrics', ts: ts(), data: generateMetrics(false) });
    }

    // --- Phase 2: Zoom detected (10s) ---
    emit(10_000, { type: 'flow', ts: ts(), data: generateRealtimeFlow() });
    emit(10_200, { type: 'status', ts: ts(), data: { activeWan: 'wan1', phase: 'switching' } });
    emit(11_500, {
      type: 'switch', ts: ts(),
      data: {
        action: 'switch_to_wan2',
        success: true,
        reason: 'Conversational Real-time detected',
        trigger: 'Zoom',
        durationMs: 1300,
      },
    });
    emit(11_600, { type: 'status', ts: ts(), data: { activeWan: 'wan2', phase: 'active' } });

    // --- Phase 3: Active on WAN2 (12-30s) ---
    // Zoom flows every ~1.5s + normal traffic
    for (let t = 12_000; t < 30_000; t += 1500 + Math.random() * 500) {
      emit(t, { type: 'flow', ts: ts(), data: generateRealtimeFlow() });
    }
    for (let t = 12_500; t < 30_000; t += 1000 + Math.random() * 500) {
      emit(t, { type: 'flow', ts: ts(), data: generateMixedFlow() });
    }

    // Better metrics on WAN2
    for (let t = 12_000; t < 30_000; t += 2000) {
      emit(t, { type: 'metrics', ts: ts(), data: generateMetrics(true) });
    }

    // --- Phase 4: Zoom ends, cooldown (30-40s) ---
    emit(30_000, { type: 'status', ts: ts(), data: { activeWan: 'wan2', phase: 'cooldown' } });

    // Only background/mixed traffic, no more realtime
    for (let t = 30_000; t < 40_000; t += 1000 + Math.random() * 500) {
      emit(t, { type: 'flow', ts: ts(), data: generateMixedFlow() });
    }

    // Metrics degrade slightly during cooldown
    for (let t = 30_000; t < 40_000; t += 2000) {
      emit(t, { type: 'metrics', ts: ts(), data: generateMetrics(true) });
    }

    // --- Phase 5: Revert to WAN1 (40s) ---
    emit(40_000, { type: 'status', ts: ts(), data: { activeWan: 'wan2', phase: 'reverting' } });
    emit(41_200, {
      type: 'switch', ts: ts(),
      data: {
        action: 'switch_to_wan1',
        success: true,
        reason: 'No Conversational Real-time for 30s',
        trigger: null,
        durationMs: 1200,
      },
    });
    emit(41_300, { type: 'status', ts: ts(), data: { activeWan: 'wan1', phase: 'idle' } });

    // Brief idle traffic
    for (let t = 41_500; t < 45_000; t += 1000 + Math.random() * 500) {
      emit(t, { type: 'flow', ts: ts(), data: generateBackgroundFlow() });
    }
    for (let t = 41_500; t < 45_000; t += 2000) {
      emit(t, { type: 'metrics', ts: ts(), data: generateMetrics(false) });
    }
  },
};
