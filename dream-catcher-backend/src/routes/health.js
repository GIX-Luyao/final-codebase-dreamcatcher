/**
 * Health Check Routes
 */

import { Router } from 'express';
import { createResponse } from '../models/index.js';

const router = Router();

/**
 * GET /api/health
 * Server health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

export default router;
