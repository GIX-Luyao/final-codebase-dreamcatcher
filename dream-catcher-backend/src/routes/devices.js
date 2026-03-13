/**
 * Device Management Routes
 */

import { Router } from 'express';
import { createResponse, createErrorResponse } from '../models/index.js';
import { getMockDevices, getMockDevice } from '../services/mockData.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { getTuiDevices, getTuiDevice } from '../services/tuiStateStore.js';

const router = Router();

/**
 * GET /api/devices
 * List all connected devices with their current activity
 */
router.get('/', (req, res) => {
  const devices = isEffectiveTui() ? getTuiDevices() : getMockDevices();
  res.json(createResponse(devices));
});

/**
 * GET /api/devices/:id
 * Get details for a specific device
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const device = isEffectiveTui() ? getTuiDevice(id) : getMockDevice(id);

  if (!device) {
    return res.status(404).json(createErrorResponse(
      'DEVICE_NOT_FOUND',
      'Device not found',
      { deviceId: id }
    ));
  }

  res.json(createResponse(device));
});

export default router;
