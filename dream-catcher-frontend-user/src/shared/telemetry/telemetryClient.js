/**
 * Source Adapter
 * 
 * Supports multiple telemetry sources:
 * - 'mock': Deterministic simulator (no backend needed)
 * - 'backend': WebSocket connection to backend API
 * - 'polling': REST API polling fallback
 */
import { createTelemetrySimulator } from '../mock/telemetrySimulator';

// Configuration - dynamically use the same hostname the page was loaded from
const BACKEND_PORT = 3002;
const WS_URL = `ws://${window.location.hostname}:${BACKEND_PORT}/ws/telemetry`;
const API_URL = `http://${window.location.hostname}:${BACKEND_PORT}/api`;

/**
 * @typedef {Object} TelemetryTick
 * @property {Object} state
 * @property {Object} metrics
 * @property {string|null} event
 * @property {Object} seriesPoint
 */

/**
 * Subscribe to telemetry updates.
 *
 * @param {(tick: TelemetryTick) => void} onTick
 * @param {Object} [options]
 * @param {number} [options.tickMs=1000]
 * @param {'mock'|'backend'|'polling'} [options.source='mock']
 * @returns {() => void} unsubscribe
 */
export function subscribeTelemetry(onTick, { tickMs = 1000, source = 'mock' } = {}) {
  
  // ============ MOCK SOURCE ============
  if (source === 'mock') {
    const sim = createTelemetrySimulator({ tickMs });
    sim.start(onTick);
    return () => sim.stop();
  }
  
  // ============ WEBSOCKET SOURCE ============
  if (source === 'backend') {
    let ws = null;
    let shouldReconnect = true;
    
    const connect = () => {
      console.log('[TelemetryClient] Connecting to WebSocket...');
      ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('[TelemetryClient] WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // ADD THIS LINE:
          console.log('[WebSocket Message]', message.type, message.data?.event || '', message.data?.metrics?.qualityScore || '');
          
          // Handle welcome message
          if (message.type === 'welcome') {
            console.log('[TelemetryClient] Welcome received, clientId:', message.clientId);
            return;
          }
          
          // Handle telemetry tick - extract the data payload
          if (message.type === 'telemetry_tick') {
            // ADD: Override timestamp with current time
            const tick = message.data;
            if (tick.seriesPoint) {
              tick.seriesPoint.timestamp = Date.now();
            }
            
            onTick(tick);
            return;
          }
          
          // Unknown message type - try to use it directly
          console.log('[TelemetryClient] Unknown message type:', message.type);
        } catch (err) {
          console.error('[TelemetryClient] Failed to parse message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[TelemetryClient] WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('[TelemetryClient] WebSocket closed');
        // Attempt reconnect after 3 seconds
        if (shouldReconnect) {
          console.log('[TelemetryClient] Reconnecting in 3s...');
          setTimeout(connect, 3000);
        }
      };
    };
    
    connect();
    
    return () => {
      shouldReconnect = false;
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }
  
  // ============ POLLING SOURCE ============
  if (source === 'polling') {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/telemetry`);
        const data = await response.json();
        onTick(data);
      } catch (err) {
        console.error('[TelemetryClient] Polling error:', err);
      }
    }, tickMs);
    return () => clearInterval(interval);
  }
  
  // Fallback - unknown source
  console.warn(`[TelemetryClient] Unknown source: ${source}, falling back to mock`);
  return subscribeTelemetry(onTick, { tickMs, source: 'mock' });
}









// /**
//  * Source Adapter
//  * 
//  * 
//  */
// import { createTelemetrySimulator } from '../mock/telemetrySimulator';

// /**
//  * @typedef {Object} TelemetryTick
//  * @property {Object} state
//  * @property {Object} metrics
//  * @property {string|null} event
//  * @property {Object} seriesPoint
//  */

// /**
//  * Subscribe to telemetry updates.
//  * For now: uses deterministic simulator.
//  * Later: replace this with polling/WebSocket/SSE without touching UI components.
//  *
//  * @param {(tick: TelemetryTick) => void} onTick
//  * @param {Object} [options]
//  * @param {number} [options.tickMs=1000]
//  * @returns {() => void} unsubscribe
//  */
// // export function subscribeTelemetry(onTick, { tickMs = 1000 } = {}) {
// //   const sim = createTelemetrySimulator({ tickMs });
// //   sim.start(onTick);

// //   return function unsubscribe() {
// //     sim.stop();
// //   };
// // }

// export function subscribeTelemetry(onTick, { tickMs = 1000, source = 'mock' } = {}) {
//   if (source === 'mock') {
//     const sim = createTelemetrySimulator({ tickMs });
//     sim.start(onTick);
//     return () => sim.stop();
//   }
  
//   if (source === 'backend') {
//     // WebSocket or SSE connection
//     const ws = new WebSocket('wss://your-router/telemetry');
//     ws.onmessage = (event) => onTick(JSON.parse(event.data));
//     return () => ws.close();
//   }
  
//   if (source === 'polling') {
//     const interval = setInterval(async () => {
//       const data = await fetch('/api/telemetry').then(r => r.json());
//       onTick(data);
//     }, tickMs);
//     return () => clearInterval(interval);
//   }
// }