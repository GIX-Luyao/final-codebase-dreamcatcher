/**
 * WebSocket Telemetry Stream Handler
 * Manages WebSocket connections for real-time telemetry
 * Dynamically switches between TUI and mock data per-tick.
 */

import { WebSocketServer } from 'ws';
import { getSharedSimulator } from '../services/telemetrySimulator.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { onTick, getCurrentTelemetryTick } from '../services/tuiStateStore.js';

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

let wss = null;
let simulator = null;
let tuiUnsubscribe = null;

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(server, path = '/ws/telemetry') {
  wss = new WebSocketServer({
    server,
    path
  });

  // Get shared simulator instance
  simulator = getSharedSimulator({ tickMs: 1000, useRealMetrics: true });

  // Always subscribe to TUI ticks — only broadcasts when TUI is the effective source
  let tuiTickCount = 0;
  tuiUnsubscribe = onTick((tick) => {
    if (isEffectiveTui()) {
      tuiTickCount++;
      if (tuiTickCount <= 3 || tuiTickCount % 50 === 0) {
        console.log(`[WS] Broadcasting TUI tick #${tuiTickCount}, event=${tick.event}, devices=${tick.state?.devices?.length}`);
      }
      broadcast({
        type: 'telemetry_tick',
        data: tick,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle connections
  wss.on('connection', handleConnection);

  console.log(`WebSocket server initialized at ${path}`);
  return wss;
}

/**
 * Handle new WebSocket connection
 */
function handleConnection(ws, req) {
  const clientId = generateClientId();
  console.log(`WebSocket client connected: ${clientId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    message: 'Connected to telemetry stream',
    timestamp: new Date().toISOString()
  }));

  // Create listener for mock simulator — only sends when mock is the effective source
  const listener = (tick) => {
    if (!isEffectiveTui() && ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'telemetry_tick',
          data: tick,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.error(`Failed to send to client ${clientId}:`, e.message);
      }
    }
  };

  // Always start simulator and add listener (cheap; only emits when mock is active)
  if (!simulator.intervalId) {
    simulator.start();
  }
  simulator.addListener(listener);

  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(ws, clientId, data);
    } catch (e) {
      console.error(`Invalid message from ${clientId}:`, e.message);
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${clientId}`);
    simulator.removeListener(listener);

    // Stop simulator if no clients
    if (wss.clients.size === 0) {
      simulator.stop();
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error.message);
  });
}

/**
 * Handle messages from client
 */
function handleClientMessage(ws, clientId, data) {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
      break;

    case 'get_state':
      // Dynamically check effective source
      if (isEffectiveTui()) {
        const tick = getCurrentTelemetryTick();
        ws.send(JSON.stringify({
          type: 'state_snapshot',
          data: tick,
          timestamp: new Date().toISOString()
        }));
      } else {
        simulator.getCurrentState().then(tick => {
          ws.send(JSON.stringify({
            type: 'state_snapshot',
            data: tick,
            timestamp: new Date().toISOString()
          }));
        });
      }
      break;

    default:
      console.log(`Unknown message type from ${clientId}:`, data.type);
  }
}

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Broadcast message to all connected clients
 */
export function broadcast(message) {
  if (!wss) return;

  const data = typeof message === 'string' ? message : JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
}

/**
 * Get connection count
 */
export function getConnectionCount() {
  return wss ? wss.clients.size : 0;
}

/**
 * Close all connections
 */
export function closeAll() {
  if (wss) {
    wss.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });
  }
  if (simulator) {
    simulator.stop();
  }
  if (tuiUnsubscribe) {
    tuiUnsubscribe();
    tuiUnsubscribe = null;
  }
}
