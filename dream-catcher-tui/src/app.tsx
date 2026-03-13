import React, { useState, useEffect, useCallback } from 'react';
import { Box, useApp, useInput } from 'ink';
import { FullScreen, useTerminalSize } from './components/FullScreen.js';
import { Header } from './components/Header.js';
import { StatusBar } from './components/StatusBar.js';
import { FlowPanel } from './panels/FlowPanel.js';
import { SliceStatus } from './panels/SliceStatus.js';
import { MetricsPanel } from './panels/MetricsPanel.js';
import { EventPanel } from './panels/EventPanel.js';
import { useFlows } from './hooks/useFlows.js';
import { useSliceState } from './hooks/useSliceState.js';
import { useMetrics } from './hooks/useMetrics.js';
import { useEventBuffer } from './hooks/useEventBuffer.js';
import { useDemoEngine } from './hooks/useDemoEngine.js';
import { usePythonBridge } from './hooks/usePythonBridge.js';
import { useBackendExporter } from './hooks/useBackendExporter.js';
import { useDebugLog } from './hooks/useDebugLog.js';
import { DebugPanel } from './panels/DebugPanel.js';

export interface AppProps {
  mode: 'live' | 'demo';
  interface?: string;
  pythonPath?: string;
  demoSpeed?: number;
  ingestUrl?: string;
  throughputMode?: 'passive' | 'active';
}

export function App({ mode, interface: iface = 'ens19', pythonPath, demoSpeed = 1.0, ingestUrl, throughputMode }: AppProps) {
  const { exit } = useApp();
  const { width, height } = useTerminalSize();
  const [startTime] = useState(Date.now());
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const debugLog = useDebugLog();

  const [autoEnabled, setAutoEnabled] = useState(true);

  const flows = useFlows(200);
  const slice = useSliceState();
  const metrics = useMetrics(60);

  // Uptime ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Buffer incoming events and flush to state at ~10 FPS (100ms intervals).
  // This batches multiple events into a single React render, eliminating flicker.
  const handleEvent = useEventBuffer({
    onFlows: flows.pushBatch,
    onSwitch: slice.handleSwitch,
    onStatus: slice.handleStatus,
    onMetrics: metrics.push,
    intervalMs: 100,
  });

  const exportEvent = useBackendExporter({
    ingestUrl,
    enabled: Boolean(ingestUrl),
    includeFlows: true,
    flowSampleMs: Number(process.env.BACKEND_INGEST_FLOW_SAMPLE_MS || 500),
  });

  const handleIncomingEvent = useCallback((event: import('./sources/types.js').BridgeEvent) => {
    exportEvent(event);
    handleEvent(event);
  }, [exportEvent, handleEvent]);

  // Surface bridge errors (last stderr line) and exit code in the status bar
  const handleBridgeLog = useCallback((msg: string) => {
    // Show the most recent meaningful error line
    const trimmed = msg.trim();
    if (trimmed.length > 0) {
      setBridgeError(trimmed);
      debugLog.log(`Bridge stderr: ${trimmed}`);
    }
  }, [debugLog.log]);

  const handleBridgeClose = useCallback((code: number | null) => {
    if (code !== null && code !== 0) {
      setBridgeError(prev =>
        prev ? `${prev} (exit code ${code})` : `Bridge exited with code ${code}`
      );
    }
  }, []);

  // Both hooks are always called (React rules), but only one is enabled
  useDemoEngine({ onEvent: handleIncomingEvent, speed: demoSpeed, enabled: mode === 'demo' });
  const { sendCommand } = usePythonBridge({
    interface: iface,
    pythonPath,
    throughputMode,
    onEvent: handleIncomingEvent,
    onLog: handleBridgeLog,
    onClose: handleBridgeClose,
    enabled: mode === 'live',
  });

  // Clear bridge error once flows start arriving
  useEffect(() => {
    if (flows.flows.length > 0 && bridgeError) {
      setBridgeError(null);
    }
  }, [flows.flows.length, bridgeError]);

  // Manual WAN force — works in both live and demo mode.
  // In live mode: sends a command to the Python bridge (which does the pfSense API call
  //   and echoes back switch/status events that drive slice state).
  // In demo mode: synthesises the events directly so the UI reflects the override.
  const manualForce = useCallback((wan: import('./sources/types.js').WanId) => {
    const isToWan2 = wan === 'wan2';
    const cmd = isToWan2 ? 'force_wan2' : 'force_wan1';

    if (mode === 'live') {
      sendCommand({ cmd });
    } else {
      // Synthesise bridge events for demo mode
      const now = Date.now();
      handleIncomingEvent({
        type: 'switch', ts: now,
        data: {
          action: isToWan2 ? 'switch_to_wan2' : 'switch_to_wan1',
          success: true,
          reason: 'Manual override',
          trigger: 'Manual',
          durationMs: 0,
        },
      });
      handleIncomingEvent({
        type: 'status', ts: now,
        data: { activeWan: wan, phase: isToWan2 ? 'active' : 'idle' },
      });
    }
  }, [mode, sendCommand, handleIncomingEvent]);

  const manualToggle = useCallback(() => {
    const target = slice.state.activeWan === 'wan1' ? 'wan2' : 'wan1';
    // Guard: don't toggle while a switch is already in flight
    if (slice.state.phase === 'switching' || slice.state.phase === 'reverting') return;
    manualForce(target);
  }, [slice.state.activeWan, slice.state.phase, manualForce]);

  const toggleAuto = useCallback(() => {
    const next = !autoEnabled;
    setAutoEnabled(next);
    if (mode === 'live') {
      sendCommand({ cmd: 'set_auto', enabled: next });
    }
  }, [autoEnabled, mode, sendCommand]);

  // Keyboard shortcuts - only active when stdin is a TTY
  const isTTY = process.stdin.isTTY ?? false;
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
    if (input === 'd') {
      setShowDebug(prev => !prev);
    }
    if (input === '1') {
      manualForce('wan1');
    }
    if (input === '2') {
      manualForce('wan2');
    }
    if (input === 't') {
      manualToggle();
    }
    if (input === 'a') {
      toggleAuto();
    }
  }, { isActive: isTTY });

  // Layout calculations
  const headerHeight = width < 80 ? 1 : 7; // compact vs full logo
  const statusBarHeight = 1;
  const totalMainHeight = Math.max(10, height - headerHeight - statusBarHeight);

  // When debug panel is visible, split the main area 60/40
  const debugPanelHeight = showDebug ? Math.max(5, Math.floor(totalMainHeight * 0.4)) : 0;
  const mainHeight = totalMainHeight - debugPanelHeight;

  // Right panel split: slice status, metrics, events
  const rightWidth = Math.max(30, Math.floor(width * 0.38));
  const leftWidth = width - rightWidth;

  const sliceStatusHeight = 7;
  const metricsPanelHeight = 7;
  const eventPanelHeight = Math.max(5, mainHeight - sliceStatusHeight - metricsPanelHeight);

  return (
    <FullScreen>
      {/* Header */}
      <Box height={headerHeight}>
        <Header mode={mode} width={width} />
      </Box>

      {/* Main content area */}
      <Box height={mainHeight} flexDirection="row">
        {/* Left panel: Flow table */}
        <FlowPanel
          flows={flows.flows}
          flowsPerSec={flows.flowsPerSecond}
          width={leftWidth}
          height={mainHeight}
        />

        {/* Right panel stack */}
        <Box flexDirection="column" width={rightWidth}>
          <SliceStatus
            state={slice.state}
            autoEnabled={autoEnabled}
            width={rightWidth}
          />
          <MetricsPanel
            current={metrics.current}
            history={metrics.history}
            width={rightWidth}
          />
          <EventPanel
            events={slice.state.events}
            width={rightWidth}
            height={eventPanelHeight}
          />
        </Box>
      </Box>

      {/* Debug panel (toggled with 'd' key) */}
      {showDebug && (
        <DebugPanel
          entries={debugLog.entries}
          width={width}
          height={debugPanelHeight}
        />
      )}

      {/* Status bar */}
      <StatusBar
        mode={mode}
        uptimeSeconds={uptimeSeconds}
        flowsPerSec={flows.flowsPerSecond}
        width={width}
        bridgeError={bridgeError}
      />
    </FullScreen>
  );
}
