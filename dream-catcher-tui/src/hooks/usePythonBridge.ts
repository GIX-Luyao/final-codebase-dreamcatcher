import { useEffect, useRef, useCallback } from 'react';
import { PythonBridge } from '../sources/python-bridge.js';
import type { BridgeEvent } from '../sources/types.js';

interface PythonBridgeOptions {
  interface: string;
  pythonPath?: string;
  throughputMode?: 'passive' | 'active';
  onEvent: (event: BridgeEvent) => void;
  onLog?: (message: string) => void;
  onClose?: (code: number | null) => void;
  enabled?: boolean;
}

export function usePythonBridge(options: PythonBridgeOptions) {
  const bridgeRef = useRef<PythonBridge | null>(null);
  const onEventRef = useRef(options.onEvent);
  const onLogRef = useRef(options.onLog);
  const onCloseRef = useRef(options.onClose);

  onEventRef.current = options.onEvent;
  onLogRef.current = options.onLog;
  onCloseRef.current = options.onClose;

  useEffect(() => {
    if (!options.enabled) return;

    const bridge = new PythonBridge();
    bridgeRef.current = bridge;

    bridge.setEventHandler((event) => onEventRef.current(event));
    bridge.setLogHandler((msg) => onLogRef.current?.(msg));
    bridge.setCloseHandler((code) => onCloseRef.current?.(code));

    bridge.start({
      interface: options.interface,
      pythonPath: options.pythonPath,
      throughputMode: options.throughputMode,
    });

    return () => {
      bridge.stop();
      bridgeRef.current = null;
    };
  }, [options.interface, options.pythonPath, options.throughputMode, options.enabled]);

  const sendCommand = useCallback((cmd: Record<string, unknown>): boolean => {
    return bridgeRef.current?.sendCommand(cmd) ?? false;
  }, []);

  return { sendCommand };
}
