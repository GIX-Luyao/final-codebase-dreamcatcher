/**
 * TUI Ingest Routes (HTTP)
 * Accepts BridgeEvents from dream-catcher-tui
 */

import { Router } from 'express';
import { createResponse, createErrorResponse } from '../models/index.js';
import { applyTuiEvent } from '../services/tuiStateStore.js';

const router = Router();

/**
 * POST /api/ingest/event
 * Body: BridgeEvent
 */
let ingestCount = 0;
router.post('/event', (req, res) => {
  const event = req.body;
  if (!event || !event.type || !event.data) {
    return res.status(400).json(createErrorResponse(
      'INVALID_PARAMETER',
      'Invalid BridgeEvent payload'
    ));
  }

  ingestCount++;
  if (ingestCount <= 5 || ingestCount % 50 === 0) {
    console.log(`[Ingest] Event #${ingestCount}: type=${event.type}, ts=${event.ts}`);
  }

  applyTuiEvent(event);
  res.json(createResponse({ ok: true }));
});

export default router;
