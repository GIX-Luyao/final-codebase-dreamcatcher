/**
 * Fixed-width formatting utilities for terminal column alignment.
 */

export function padEnd(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return str + ' '.repeat(width - str.length);
}

export function padStart(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return ' '.repeat(width - str.length) + str;
}

/**
 * Format an IP:port endpoint to a fixed width.
 * Truncates long IPv6 addresses with ellipsis if needed.
 */
export function formatEndpoint(ip: string, port: number, width: number = 22): string {
  const full = `${ip}:${port}`;
  if (full.length <= width) {
    return padEnd(full, width);
  }
  // Truncate IP portion for very long addresses
  const portStr = `:${port}`;
  const maxIp = width - portStr.length - 2; // 2 for ".."
  return ip.slice(0, maxIp) + '..' + portStr;
}

/**
 * Format bytes into human-readable string with fixed width.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return padStart(`${bytes} B`, 8);
  const kb = bytes / 1024;
  if (kb < 1024) return padStart(`${kb.toFixed(1)}KB`, 8);
  const mb = kb / 1024;
  return padStart(`${mb.toFixed(1)}MB`, 8);
}

/**
 * Format duration in seconds to human-readable string.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins < 60) return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins.toString().padStart(2, '0')}m`;
}

/**
 * Format a timestamp to HH:MM:SS.
 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Abbreviate intent category names for narrow displays.
 */
export function shortIntent(intent: string): string {
  switch (intent) {
    case 'Conversational Real-time': return 'Conv. RT';
    case 'Interactive Workflows': return 'Inter. Work';
    case 'Interactive Entertainment': return 'Inter. Ent';
    case 'Buffered Consumption': return 'Buffered';
    case 'Background': return 'Background';
    default: return intent.slice(0, 12);
  }
}
