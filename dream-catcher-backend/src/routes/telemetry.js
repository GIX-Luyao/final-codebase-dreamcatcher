/**
 * Telemetry Routes (HTTP polling endpoint)
 */

import { Router } from 'express';
import { createResponse } from '../models/index.js';
import { getSharedSimulator } from '../services/telemetrySimulator.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { getCurrentTelemetryTick } from '../services/tuiStateStore.js';

const router = Router();

// Get or create shared simulator
const simulator = getSharedSimulator({ tickMs: 1000, useRealMetrics: true });

/**
 * GET /api/telemetry
 * Polling endpoint for telemetry data
 */
router.get('/', async (req, res) => {
  try {
    const tick = isEffectiveTui() ? getCurrentTelemetryTick() : await simulator.getCurrentState();
    res.json(createResponse(tick));
  } catch (error) {
    console.error('Telemetry error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get telemetry data'
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
