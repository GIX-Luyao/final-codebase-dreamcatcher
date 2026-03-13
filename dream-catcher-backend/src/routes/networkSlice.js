/**
 * Network Slice Routes
 */

import { Router } from 'express';
import { createResponse, createErrorResponse } from '../models/index.js';
import {
  NETWORK_SLICES,
  ACTIVITY_TYPES,
  getCurrentSliceData
} from '../services/mockData.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { getCurrentSliceData as getTuiSliceData } from '../services/tuiStateStore.js';

const router = Router();

/**
 * GET /api/network-slice/current
 * Get current network slice and activity information
 */
router.get('/current', (req, res) => {
  const { activityType } = req.query;

  // Validate activity type if provided
  if (activityType) {
    const validActivity = ACTIVITY_TYPES.find(a => a.type === activityType);
    if (!validActivity) {
      return res.status(400).json(createErrorResponse(
        'INVALID_PARAMETER',
        'Invalid activity type specified',
        {
          parameter: 'activityType',
          provided: activityType,
          allowed: ACTIVITY_TYPES.map(a => a.type)
        }
      ));
    }
  }

  const data = isEffectiveTui() ? getTuiSliceData() : getCurrentSliceData(activityType);
  res.json(createResponse(data));
});

/**
 * GET /api/network-slice/slices
 * List all available network slice types
 */
router.get('/slices', (req, res) => {
  res.json(createResponse(NETWORK_SLICES));
});

/**
 * GET /api/network-slice/activities
 * List all supported activity types
 */
router.get('/activities', (req, res) => {
  res.json(createResponse(ACTIVITY_TYPES));
});

/**
 * GET /api/network-slice/simulate
 * Get simulated network data with realistic variations
 */
router.get('/simulate', (req, res) => {
  const { activityType } = req.query;

  // Validate activity type if provided
  if (activityType) {
    const validActivity = ACTIVITY_TYPES.find(a => a.type === activityType);
    if (!validActivity) {
      return res.status(400).json(createErrorResponse(
        'INVALID_PARAMETER',
        'Invalid activity type specified',
        {
          parameter: 'activityType',
          provided: activityType,
          allowed: ACTIVITY_TYPES.map(a => a.type)
        }
      ));
    }
  }

  const data = isEffectiveTui() ? getTuiSliceData() : getCurrentSliceData(activityType);

  // Add realistic variations
  const slice = data.currentSlice;
  slice.latency = slice.latency + (Math.random() - 0.5) * 4;
  slice.bandwidth = slice.bandwidth + (Math.random() - 0.5) * 5;
  slice.packetLoss = Math.max(0, slice.packetLoss + (Math.random() - 0.5) * 0.1);

  res.json(createResponse(data));
});

export default router;
