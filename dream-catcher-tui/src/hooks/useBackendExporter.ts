import { useCallback, useRef } from 'react';
import type { BridgeEvent } from '../sources/types.js';

interface BackendExporterOptions {
  ingestUrl?: string;
  enabled?: boolean;
  includeFlows?: boolean;
  flowSampleMs?: number;
}

export function useBackendExporter({
  ingestUrl,
  enabled = true,
  includeFlows = false,
  flowSampleMs = 500,
}: BackendExporterOptions) {
  const lastFlowSentAt = useRef(0);
  const warnedNoFetch = useRef(false);

  return useCallback((event: BridgeEvent) => {
    if (!enabled || !ingestUrl) return;

    if (event.type === 'flow' && !includeFlows) return;
    if (event.type === 'flow' && includeFlows) {
      const now = Date.now();
      if (now - lastFlowSentAt.current < flowSampleMs) return;
      lastFlowSentAt.current = now;
    }

    if (typeof fetch !== 'function') {
      if (!warnedNoFetch.current) {
        warnedNoFetch.current = true;
        console.error('Backend exporter disabled: fetch is not available in this Node runtime.');
      }
      return;
    }

    fetch(ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch((err) => {
      // Soft-fail; avoid crashing the TUI on network errors
      console.error(`Backend ingest failed: ${err.message}`);
    });
  }, [enabled, ingestUrl, includeFlows, flowSampleMs]);
}
