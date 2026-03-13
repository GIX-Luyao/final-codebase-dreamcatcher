/**
 * Events & Logs Routes
 */

import { Router } from 'express';
import { createResponse, createErrorResponse } from '../models/index.js';
import { getEvents } from '../services/mockData.js';
import { isEffectiveTui } from '../services/telemetrySource.js';
import { getEvents as getTuiEvents } from '../services/tuiStateStore.js';

const router = Router();

/**
 * GET /api/events
 * Get optimization event log
 */
router.get('/', (req, res) => {
  const {
    limit = '50',
    offset = '0',
    type = null
  } = req.query;

  // Parse and validate limit
  const limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 200) {
    return res.status(400).json(createErrorResponse(
      'INVALID_PARAMETER',
      'Invalid limit specified',
      {
        parameter: 'limit',
        provided: limit,
        allowed: '1-200'
      }
    ));
  }

  // Parse and validate offset
  const offsetNum = parseInt(offset, 10);
  if (isNaN(offsetNum) || offsetNum < 0) {
    return res.status(400).json(createErrorResponse(
      'INVALID_PARAMETER',
      'Invalid offset specified',
      {
        parameter: 'offset',
        provided: offset,
        allowed: '0 or positive integer'
      }
    ));
  }

  // Validate type
  const validTypes = ['SLICE_SWITCH', 'DEVICE_CONNECTED', 'DEVICE_DISCONNECTED',
                      'OPTIMIZATION_TRIGGERED', 'CONFIG_CHANGED', 'ALERT', 'all'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json(createErrorResponse(
      'INVALID_PARAMETER',
      'Invalid event type specified',
      {
        parameter: 'type',
        provided: type,
        allowed: validTypes
      }
    ));
  }

  const result = (isEffectiveTui() ? getTuiEvents : getEvents)({
    limit: limitNum,
    offset: offsetNum,
    type
  });

  res.json(createResponse(result));
});

export default router;
