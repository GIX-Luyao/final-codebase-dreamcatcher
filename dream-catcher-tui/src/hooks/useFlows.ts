import { useState, useCallback, useRef } from 'react';
import { RingBuffer } from '../utils/ring-buffer.js';
import type { FlowEntry, FlowEvent } from '../sources/types.js';

let flowIdCounter = 0;

export function useFlows(capacity: number = 200) {
  const bufferRef = useRef(new RingBuffer<FlowEntry>(capacity));
  const [flows, setFlows] = useState<FlowEntry[]>([]);
  const [flowsPerSecond, setFlowsPerSecond] = useState(0);
  const timestampsRef = useRef<number[]>([]);

  /** Push a single flow event. */
  const push = useCallback((event: FlowEvent) => {
    const entry: FlowEntry = {
      ...event,
      id: `flow-${++flowIdCounter}`,
      timestamp: Date.now(),
    };
    bufferRef.current.push(entry);
    setFlows(bufferRef.current.toArray());

    const now = Date.now();
    timestampsRef.current.push(now);
    timestampsRef.current = timestampsRef.current.filter(t => now - t < 5000);
    setFlowsPerSecond(timestampsRef.current.length / 5);
  }, []);

  /** Push a batch of flow events in one render. */
  const pushBatch = useCallback((events: FlowEvent[]) => {
    const now = Date.now();
    for (const event of events) {
      bufferRef.current.push({
        ...event,
        id: `flow-${++flowIdCounter}`,
        timestamp: now,
      });
      timestampsRef.current.push(now);
    }
    timestampsRef.current = timestampsRef.current.filter(t => now - t < 5000);
    setFlows(bufferRef.current.toArray());
    setFlowsPerSecond(timestampsRef.current.length / 5);
  }, []);

  const clear = useCallback(() => {
    bufferRef.current.clear();
    setFlows([]);
    timestampsRef.current = [];
    setFlowsPerSecond(0);
  }, []);

  return { flows, flowsPerSecond, push, pushBatch, clear };
}
