/**
 * Metrics & Analytics Routes
 */

import { Router } from 'express';
import { createResponse, createErrorResponse } from '../models/index.js';
import { getCurrentMetrics, getMetricsHistory } from '../services/networkBenchmark.js';
import { getCurrentState } from '../services/mockData.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { getCurrentMetrics as getTuiMetrics, getSeriesHistory } from '../services/tuiStateStore.js';

const router = Router();

/**
 * GET /api/metrics/current
 * Get current network performance metrics (uses real network measurements)
 */
router.get('/current', async (req, res) => {
  try {
    const useTui = isEffectiveTui();
    const metrics = useTui ? getTuiMetrics() : await getCurrentMetrics();
    const state = getCurrentState();

    res.json(createResponse({
      ...metrics,
      currentSlice: useTui ? metrics.currentSlice : state.currentSlice,
      sliceSwitchesToday: useTui ? metrics.sliceSwitchesToday : 12
    }));
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json(createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to get current metrics'
    ));
  }
});

/**
 * GET /api/metrics/history
 * Get historical metrics for charting
 */
router.get('/history', async (req, res) => {
  const { period = '1h', resolution = '1m' } = req.query;

  // Validate period
  const validPeriods = ['1h', '6h', '24h', '7d'];
  if (!validPeriods.includes(period)) {
    return res.status(400).json(createErrorResponse(
      'INVALID_PARAMETER',
      'Invalid period specified',
      {
        parameter: 'period',
        provided: period,
        allowed: validPeriods
      }
    ));
  }

  // Validate resolution
  const validResolutions = ['1s', '1m', '5m', '1h'];
  if (!validResolutions.includes(resolution)) {
    return res.status(400).json(createErrorResponse(
      'INVALID_PARAMETER',
      'Invalid resolution specified',
      {
        parameter: 'resolution',
        provided: resolution,
        allowed: validResolutions
      }
    ));
  }

  try {
    if (isEffectiveTui()) {
      const series = getSeriesHistory();
      res.json(createResponse({ period, resolution, points: series }));
    } else {
      const history = await getMetricsHistory({ period, resolution });
      res.json(createResponse(history));
    }
  } catch (error) {
    console.error('Metrics history error:', error);
    res.status(500).json(createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to get metrics history'
    ));
  }
});

export default router;
