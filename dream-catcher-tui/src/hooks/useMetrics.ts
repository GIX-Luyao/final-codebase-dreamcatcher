import { useState, useCallback, useRef } from 'react';
import type { MetricsSnapshot } from '../sources/types.js';

const DEFAULT_METRICS: MetricsSnapshot = {
  latencyMs: 0,
  jitterMs: 0,
  throughputMbps: 0,
  packetLossPct: 0,
};

export function useMetrics(windowSize: number = 60) {
  const [current, setCurrent] = useState<MetricsSnapshot>(DEFAULT_METRICS);
  const [history, setHistory] = useState<MetricsSnapshot[]>([]);
  const historyRef = useRef<MetricsSnapshot[]>([]);

  const push = useCallback((snapshot: MetricsSnapshot) => {
    setCurrent(snapshot);
    historyRef.current = [...historyRef.current, snapshot].slice(-windowSize);
    setHistory(historyRef.current);
  }, [windowSize]);

  return { current, history, push };
}
