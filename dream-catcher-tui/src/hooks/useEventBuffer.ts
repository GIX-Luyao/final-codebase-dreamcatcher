import { useEffect, useRef, useCallback } from 'react';
import type { BridgeEvent, FlowEvent, SwitchEvent, StatusEvent, MetricsSnapshot } from '../sources/types.js';

/**
 * Batches incoming BridgeEvents and flushes them to state hooks at a fixed
 * interval. This prevents per-event re-renders and eliminates flickering.
 *
 * Instead of: event → setState → render (repeated N times per tick)
 * We get:     event → buffer ... event → buffer → flush → setState → render (once per tick)
 */

interface EventBufferOptions {
  onFlows: (events: FlowEvent[]) => void;
  onSwitch: (event: SwitchEvent) => void;
  onStatus: (event: StatusEvent) => void;
  onMetrics: (event: MetricsSnapshot) => void;
  intervalMs?: number;
}

export function useEventBuffer({
  onFlows,
  onSwitch,
  onStatus,
  onMetrics,
  intervalMs = 100,
}: EventBufferOptions) {
  const flowBuf = useRef<FlowEvent[]>([]);
  const switchBuf = useRef<SwitchEvent[]>([]);
  const statusBuf = useRef<StatusEvent[]>([]);
  const metricsBuf = useRef<MetricsSnapshot[]>([]);
  const dirty = useRef(false);

  // Stable refs to avoid re-creating the flush/push callbacks
  const cbRef = useRef({ onFlows, onSwitch, onStatus, onMetrics });
  cbRef.current = { onFlows, onSwitch, onStatus, onMetrics };

  // Flush buffered events to state (single render per flush)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!dirty.current) return;
      dirty.current = false;

      const flows = flowBuf.current;
      const switches = switchBuf.current;
      const statuses = statusBuf.current;
      const metricsArr = metricsBuf.current;

      flowBuf.current = [];
      switchBuf.current = [];
      statusBuf.current = [];
      metricsBuf.current = [];

      // Batch all flows in one call
      if (flows.length > 0) {
        cbRef.current.onFlows(flows);
      }

      // Replay switch/status events in order (these are rare, usually 0-1 per tick)
      for (const s of switches) {
        cbRef.current.onSwitch(s);
      }
      for (const s of statuses) {
        cbRef.current.onStatus(s);
      }

      // Only apply the latest metrics snapshot
      if (metricsArr.length > 0) {
        cbRef.current.onMetrics(metricsArr[metricsArr.length - 1]!);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  // Push: just appends to buffer, no React state touched
  const push = useCallback((event: BridgeEvent) => {
    dirty.current = true;
    switch (event.type) {
      case 'flow':
        flowBuf.current.push(event.data);
        break;
      case 'switch':
        switchBuf.current.push(event.data);
        break;
      case 'status':
        statusBuf.current.push(event.data);
        break;
      case 'metrics':
        metricsBuf.current.push(event.data);
        break;
    }
  }, []);

  return push;
}
