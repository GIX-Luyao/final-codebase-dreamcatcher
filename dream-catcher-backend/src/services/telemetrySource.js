/**
 * Telemetry source selector.
 * Supports 'mock', 'tui', or 'auto' (default).
 * Auto mode serves TUI data when connected, mock when not.
 */

import { isTuiConnected } from './tuiStateStore.js';

const configuredSource = (process.env.TELEMETRY_SOURCE || 'auto').toLowerCase();

console.log(`[TelemetrySource] Configured source: '${configuredSource}' (env TELEMETRY_SOURCE=${process.env.TELEMETRY_SOURCE || '(not set)'})`);

let lastLoggedSource = null;

export function getEffectiveSource() {
  if (configuredSource === 'mock') return 'mock';
  if (configuredSource === 'tui') return 'tui';
  // 'auto' (default): use TUI when connected, mock otherwise
  return isTuiConnected() ? 'tui' : 'mock';
}

export function isEffectiveTui() {
  const source = getEffectiveSource();
  // Log when source changes
  if (source !== lastLoggedSource) {
    console.log(`[TelemetrySource] Effective source changed: '${lastLoggedSource}' → '${source}' (isTuiConnected=${isTuiConnected()})`);
    lastLoggedSource = source;
  }
  return source === 'tui';
}
