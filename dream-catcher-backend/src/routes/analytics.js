/**
 * Business Analytics Routes
 */

import { Router } from 'express';
import { createResponse, createErrorResponse } from '../models/index.js';
import { getAnalyticsImpact } from '../services/mockData.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { getTuiDevices, getEvents as getTuiEvents, getCurrentMetrics } from '../services/tuiStateStore.js';

const router = Router();

/**
 * GET /api/analytics/impact
 * Get business impact metrics
 */
router.get('/impact', (req, res) => {
  const { period = '7d' } = req.query;

  // Validate period
  const validPeriods = ['24h', '7d', '30d'];
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

  if (isEffectiveTui()) {
    const devices = getTuiDevices();
    const events = getTuiEvents({ limit: 200 });
    const metrics = getCurrentMetrics();
    const switchCount = events.events.filter(e => e.type === 'SLICE_SWITCH').length;

    res.json(createResponse({
      period,
      usersImpacted: devices.length,
      qoeImprovement: metrics.qualityScore || 0,
      avgLatencyReduction: metrics.latencyMs > 0 ? Math.round(metrics.latencyMs * 0.4) : 0,
      sliceSwitches: switchCount,
      uptimePercent: 99.9,
      peakConcurrentDevices: devices.length,
      bandwidthSaved: Math.round(metrics.throughputMbps * 0.1 * 100) / 100
    }));
  } else {
    const impact = getAnalyticsImpact(period);
    res.json(createResponse(impact));
  }
});

export default router;
