/**
 * Router Configuration Routes
 */

import { Router } from 'express';
import { createResponse, createErrorResponse } from '../models/index.js';
import {
  getRouterStatus,
  updateRouterConfig,
  getPriorityRules
} from '../services/mockData.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { getTuiDevices, getCurrentMetrics, getTuiConnectionInfo } from '../services/tuiStateStore.js';

const router = Router();

/**
 * GET /api/router/status
 * Get router status and configuration
 */
router.get('/status', (req, res) => {
  if (isEffectiveTui()) {
    const devices = getTuiDevices();
    const metrics = getCurrentMetrics();
    const connInfo = getTuiConnectionInfo();

    res.json(createResponse({
      status: 'online',
      optimizationEnabled: true,
      optimizationMode: 'automatic',
      firmwareVersion: '2.1.0',
      uptime: connInfo.lastEventAt ? Math.floor((Date.now() - connInfo.lastEventAt) / 1000) : 0,
      connectedDevices: devices.length,
      currentSlice: metrics.currentSlice,
      lastSliceSwitch: new Date().toISOString(),
      tuiConnected: connInfo.connected,
      tuiEventCount: connInfo.eventCount
    }));
  } else {
    const status = getRouterStatus();
    res.json(createResponse(status));
  }
});

/**
 * PUT /api/router/config
 * Update router configuration
 */
router.put('/config', (req, res) => {
  const { optimizationMode, priorityRules } = req.body;

  // Validate optimization mode if provided
  if (optimizationMode) {
    const validModes = ['automatic', 'manual'];
    if (!validModes.includes(optimizationMode)) {
      return res.status(400).json(createErrorResponse(
        'INVALID_PARAMETER',
        'Invalid optimization mode',
        {
          parameter: 'optimizationMode',
          provided: optimizationMode,
          allowed: validModes
        }
      ));
    }
  }

  // Validate priority rules if provided
  if (priorityRules) {
    if (!Array.isArray(priorityRules)) {
      return res.status(400).json(createErrorResponse(
        'INVALID_PARAMETER',
        'priorityRules must be an array',
        { parameter: 'priorityRules' }
      ));
    }

    for (const rule of priorityRules) {
      if (!rule.priority || !rule.intent) {
        return res.status(400).json(createErrorResponse(
          'INVALID_PARAMETER',
          'Each priority rule must have priority and intent',
          { parameter: 'priorityRules' }
        ));
      }
    }
  }

  try {
    updateRouterConfig({ optimizationMode, priorityRules });
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json(createErrorResponse(
      'INTERNAL_ERROR',
      'Failed to update configuration'
    ));
  }
});

/**
 * GET /api/router/priority-rules
 * Get current priority rules configuration
 */
router.get('/priority-rules', (req, res) => {
  const rules = getPriorityRules();
  res.json(createResponse(rules));
});

export default router;
