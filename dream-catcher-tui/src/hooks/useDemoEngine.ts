import { useEffect, useRef } from 'react';
import type { BridgeEvent } from '../sources/types.js';
import { ZOOM_CALL_SCENARIO } from '../sources/demo-scenarios.js';

interface DemoEngineOptions {
  onEvent: (event: BridgeEvent) => void;
  speed?: number;
  enabled?: boolean;
}

export function useDemoEngine({ onEvent, speed = 1.0, enabled = true }: DemoEngineOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const scenario = ZOOM_CALL_SCENARIO;
    let timeouts: ReturnType<typeof setTimeout>[] = [];
    let stopped = false;

    function runCycle() {
      if (stopped) return;

      // Clear any leftover timeouts
      timeouts.forEach(clearTimeout);
      timeouts = [];

      scenario.schedule((delayMs, event) => {
        if (stopped) return;
        const timeout = setTimeout(() => {
          if (!stopped) {
            // Update timestamp to current time
            onEventRef.current({ ...event, ts: Date.now() });
          }
        }, delayMs / speed);
        timeouts.push(timeout);
      });

      // Schedule the next cycle
      const cycleTimeout = setTimeout(() => {
        if (!stopped) runCycle();
      }, scenario.durationMs / speed);
      timeouts.push(cycleTimeout);
    }

    runCycle();

    return () => {
      stopped = true;
      timeouts.forEach(clearTimeout);
    };
  }, [speed, enabled]);
}
