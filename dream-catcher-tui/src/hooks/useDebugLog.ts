import { useState, useCallback, useEffect, useRef } from 'react';

export interface DebugEntry {
  timestamp: number;
  message: string;
}

const MAX_ENTRIES = 100;

export function useDebugLog() {
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const origConsoleLog = useRef<typeof console.log | null>(null);
  const origConsoleError = useRef<typeof console.error | null>(null);

  const log = useCallback((msg: string) => {
    setEntries(prev => {
      const next = [...prev, { timestamp: Date.now(), message: msg }];
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    });
  }, []);

  // Monkey-patch console.log and console.error to capture output
  useEffect(() => {
    origConsoleLog.current = console.log;
    origConsoleError.current = console.error;

    console.log = (...args: unknown[]) => {
      const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      log(msg);
    };

    console.error = (...args: unknown[]) => {
      const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      log(`[ERROR] ${msg}`);
    };

    return () => {
      if (origConsoleLog.current) console.log = origConsoleLog.current;
      if (origConsoleError.current) console.error = origConsoleError.current;
    };
  }, [log]);

  return { entries, log };
}
