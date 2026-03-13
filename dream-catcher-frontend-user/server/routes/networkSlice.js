import express from 'express';
import { getNetworkSliceData, getAllActivityTypes, getAllSliceTypes, simulateDataUpdate } from '../data/mockData.js';
import { ActivityType } from '../models/networkSlice.js';

const router = express.Router();

/**
 * GET /api/network-slice/current
 * Get current network slice data
 * Query params:
 *   - activityType: (optional) Type of activity (default: VIDEO_CONFERENCE)
 */
router.get('/current', (req, res) => {
  try {
    const activityType = req.query.activityType || ActivityType.VIDEO_CONFERENCE;
    const data = getNetworkSliceData(activityType);
    
    res.json({
      success: true,
      data: {
        slice: {
          id: data.slice.id,
          name: data.slice.name,
          type: data.slice.type,
          status: data.slice.status,
          allocatedBandwidth: data.slice.allocatedBandwidth,
          latency: data.slice.latency,
          packetLoss: data.slice.packetLoss,
          description: data.slice.description,
          icon: data.slice.icon
        },
        activity: {
          isLive: data.activity.isLive,
          activityType: data.activity.activityType,
          priority: data.activity.priority,
          icon: data.activity.icon,
          sliceId: data.activity.sliceId
        },
        performance: {
          weeklyReliability: data.performance.weeklyReliability,
          description: data.performance.description
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/network-slice/activities
 * Get all available activity types
 */
router.get('/activities', (req, res) => {
  try {
    const activities = getAllActivityTypes();
    res.json({
      success: true,
      data: activities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/network-slice/slices
 * Get all available slice types
 */
router.get('/slices', (req, res) => {
  try {
    const slices = getAllSliceTypes();
    res.json({
      success: true,
      data: slices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/network-slice/simulate
 * Get simulated/updated network slice data with slight variations
 * Query params:
 *   - activityType: (optional) Type of activity (default: VIDEO_CONFERENCE)
 */
router.get('/simulate', (req, res) => {
  try {
    const activityType = req.query.activityType || ActivityType.VIDEO_CONFERENCE;
    const data = simulateDataUpdate(activityType);
    
    res.json({
      success: true,
      data: {
        slice: {
          id: data.slice.id,
          name: data.slice.name,
          type: data.slice.type,
          status: data.slice.status,
          allocatedBandwidth: data.slice.allocatedBandwidth,
          latency: data.slice.latency,
          packetLoss: data.slice.packetLoss,
          description: data.slice.description,
          icon: data.slice.icon
        },
        activity: {
          isLive: data.activity.isLive,
          activityType: data.activity.activityType,
          priority: data.activity.priority,
          icon: data.activity.icon,
          sliceId: data.activity.sliceId
        },
        performance: {
          weeklyReliability: data.performance.weeklyReliability,
          description: data.performance.description
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export { router as networkSliceRoutes };
