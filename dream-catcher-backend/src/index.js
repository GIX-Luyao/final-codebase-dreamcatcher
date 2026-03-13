/**
 * Smart Router Backend API Server
 *
 * A complete API server following API_SPECIFICATION.md
 * Provides both REST endpoints and WebSocket telemetry streaming
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

// Import routes
import {
  healthRoutes,
  networkSliceRoutes,
  telemetryRoutes,
  devicesRoutes,
  metricsRoutes,
  eventsRoutes,
  routerRoutes,
  analyticsRoutes,
  ingestRoutes
} from './routes/index.js';

// Import WebSocket handler
import { initWebSocketServer, getConnectionCount } from './websocket/telemetryStream.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '127.0.0.1';

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================================================
// REGISTER ROUTES
// ============================================================================

// Health check
app.use('/api/health', healthRoutes);

// Network Slice endpoints
app.use('/api/network-slice', networkSliceRoutes);

// Telemetry polling endpoint
app.use('/api/telemetry', telemetryRoutes);

// Device management
app.use('/api/devices', devicesRoutes);

// Metrics & history
app.use('/api/metrics', metricsRoutes);

// Events log
app.use('/api/events', eventsRoutes);

// Router configuration
app.use('/api/router', routerRoutes);

// Business analytics
app.use('/api/analytics', analyticsRoutes);

// TUI ingest (optional)
app.use('/api/ingest', ingestRoutes);

// ============================================================================
// API DOCUMENTATION ENDPOINT
// ============================================================================

app.get('/api', (req, res) => {
  res.json({
    name: 'Smart Router API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: {
        'GET /api/health': 'Server health check'
      },
      networkSlice: {
        'GET /api/network-slice/current': 'Get current network slice data',
        'GET /api/network-slice/slices': 'List all slice types',
        'GET /api/network-slice/activities': 'List all activity types',
        'GET /api/network-slice/simulate': 'Get simulated data with variations'
      },
      telemetry: {
        'GET /api/telemetry': 'Polling endpoint for telemetry data',
        'WS /ws/telemetry': 'WebSocket real-time telemetry stream'
      },
      devices: {
        'GET /api/devices': 'List all connected devices',
        'GET /api/devices/:id': 'Get device details'
      },
      metrics: {
        'GET /api/metrics/current': 'Get current metrics (real network measurements)',
        'GET /api/metrics/history': 'Get historical metrics for charting'
      },
      events: {
        'GET /api/events': 'Get optimization event log'
      },
      router: {
        'GET /api/router/status': 'Get router status',
        'PUT /api/router/config': 'Update router configuration',
        'GET /api/router/priority-rules': 'Get priority rules'
      },
      analytics: {
        'GET /api/analytics/impact': 'Get business impact metrics'
      },
      ingest: {
        'POST /api/ingest/event': 'Ingest BridgeEvent from TUI'
      }
    },
    websocket: {
      url: `ws://localhost:${PORT}/ws/telemetry`,
      description: 'Real-time telemetry stream with mock scenario data'
    }
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint not found: ${req.method} ${req.path}`
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// Initialize WebSocket server
initWebSocketServer(server, '/ws/telemetry');

// Start server
server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                  Smart Router API Server                       ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  REST API:    http://${HOST}:${PORT}/api                         ║`);
  console.log(`║  WebSocket:   ws://${HOST}:${PORT}/ws/telemetry                  ║`);
  console.log(`║  API Docs:    http://${HOST}:${PORT}/api                         ║`);
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                                    ║');
  console.log('║    - GET  /api/health              Health check                ║');
  console.log('║    - GET  /api/network-slice/*     Network slice data          ║');
  console.log('║    - GET  /api/telemetry           Telemetry polling           ║');
  console.log('║    - GET  /api/devices             Device management           ║');
  console.log('║    - GET  /api/metrics/*           Real network metrics        ║');
  console.log('║    - GET  /api/events              Event log                   ║');
  console.log('║    - GET  /api/router/*            Router configuration        ║');
  console.log('║    - GET  /api/analytics/impact    Business analytics          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
