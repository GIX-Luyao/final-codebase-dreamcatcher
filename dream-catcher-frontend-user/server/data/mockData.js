import { SliceType, ActivityType, PriorityLevel, NetworkSlice, CurrentActivity, PerformanceMetrics } from '../models/networkSlice.js';

/**
 * Mock Data Service
 * Provides realistic fake data for different network slice scenarios
 */

// Network Slice Configurations
const sliceConfigurations = {
  [SliceType.NORMAL]: {
    name: 'Normal Slice',
    allocatedBandwidth: '25 Mbps',
    latency: '28ms',
    packetLoss: '0.2%',
    description: 'Standard network slice for general internet usage',
    icon: 'globe'
  },
  [SliceType.VIDEO_CONFERENCE]: {
    name: 'Video Conferencing Slice',
    allocatedBandwidth: '45 Mbps',
    latency: '12ms',
    packetLoss: '0%',
    description: 'Optimized for low-latency video communication',
    icon: 'video'
  },
  [SliceType.GAMING]: {
    name: 'Gaming Slice',
    allocatedBandwidth: '35 Mbps',
    latency: '8ms',
    packetLoss: '0%',
    description: 'Ultra-low latency for competitive gaming',
    icon: 'gamepad'
  },
  [SliceType.STREAMING]: {
    name: 'Streaming Slice',
    allocatedBandwidth: '50 Mbps',
    latency: '18ms',
    packetLoss: '0.1%',
    description: 'High bandwidth for smooth video streaming',
    icon: 'stream'
  },
  [SliceType.IOT]: {
    name: 'IoT Slice',
    allocatedBandwidth: '10 Mbps',
    latency: '35ms',
    packetLoss: '0.3%',
    description: 'Efficient connectivity for IoT devices',
    icon: 'iot'
  }
};

// Activity Mappings - which activity uses which slice
const activitySliceMap = {
  [ActivityType.VIDEO_CONFERENCE]: {
    sliceType: SliceType.VIDEO_CONFERENCE,
    priority: PriorityLevel.HIGH,
    icon: 'video'
  },
  [ActivityType.WEB_BROWSING]: {
    sliceType: SliceType.NORMAL,
    priority: PriorityLevel.NORMAL,
    icon: 'browser'
  },
  [ActivityType.FILE_DOWNLOAD]: {
    sliceType: SliceType.NORMAL,
    priority: PriorityLevel.MEDIUM,
    icon: 'download'
  },
  [ActivityType.GAMING]: {
    sliceType: SliceType.GAMING,
    priority: PriorityLevel.HIGH,
    icon: 'gamepad'
  },
  [ActivityType.STREAMING]: {
    sliceType: SliceType.STREAMING,
    priority: PriorityLevel.MEDIUM,
    icon: 'stream'
  },
  [ActivityType.IDLE]: {
    sliceType: SliceType.NORMAL,
    priority: PriorityLevel.LOW,
    icon: 'idle'
  }
};

/**
 * Get current network slice data based on activity type
 */
export function getNetworkSliceData(activityType = ActivityType.VIDEO_CONFERENCE) {
  const activityConfig = activitySliceMap[activityType];
  if (!activityConfig) {
    throw new Error(`Unknown activity type: ${activityType}`);
  }

  const sliceConfig = sliceConfigurations[activityConfig.sliceType];
  
  const slice = new NetworkSlice({
    id: `slice-${activityConfig.sliceType}`,
    name: sliceConfig.name,
    type: activityConfig.sliceType,
    status: 'active',
    allocatedBandwidth: sliceConfig.allocatedBandwidth,
    latency: sliceConfig.latency,
    packetLoss: sliceConfig.packetLoss,
    description: sliceConfig.description,
    icon: sliceConfig.icon
  });

  const activity = new CurrentActivity({
    isLive: activityType !== ActivityType.IDLE,
    activityType: activityType,
    priority: activityConfig.priority,
    icon: activityConfig.icon,
    sliceId: slice.id
  });

  // Performance metrics vary slightly based on activity
  const reliabilityMap = {
    [ActivityType.VIDEO_CONFERENCE]: { value: 98, description: 'Of your high-stakes tasks were automatically protected from congestion this week.' },
    [ActivityType.GAMING]: { value: 97, description: 'Of your gaming sessions maintained optimal latency this week.' },
    [ActivityType.STREAMING]: { value: 96, description: 'Of your streaming sessions had zero buffering this week.' },
    [ActivityType.WEB_BROWSING]: { value: 99, description: 'Of your browsing sessions loaded instantly this week.' },
    [ActivityType.FILE_DOWNLOAD]: { value: 95, description: 'Of your downloads completed at maximum speed this week.' },
    [ActivityType.IDLE]: { value: 100, description: 'Network is idle and ready for your next activity.' }
  };

  const metrics = reliabilityMap[activityType] || reliabilityMap[ActivityType.VIDEO_CONFERENCE];
  const performance = new PerformanceMetrics({
    weeklyReliability: `${metrics.value}%`,
    description: metrics.description
  });

  return {
    slice,
    activity,
    performance
  };
}

/**
 * Get all available slice types
 */
export function getAllSliceTypes() {
  return Object.values(SliceType);
}

/**
 * Get all available activity types
 */
export function getAllActivityTypes() {
  return Object.values(ActivityType);
}

/**
 * Simulate data changes over time (for future real-time updates)
 */
export function simulateDataUpdate(currentActivityType) {
  const baseData = getNetworkSliceData(currentActivityType);
  
  // Add slight variations to make it feel dynamic
  const variation = {
    latency: Math.floor(Math.random() * 3) - 1, // ±1ms variation
    packetLoss: (Math.random() * 0.1).toFixed(1) // 0-0.1% variation
  };

  // Apply variations (keep within realistic bounds)
  const currentLatency = parseInt(baseData.slice.latency);
  const newLatency = Math.max(5, currentLatency + variation.latency);
  baseData.slice.latency = `${newLatency}ms`;

  if (baseData.slice.packetLoss !== '0%') {
    const currentLoss = parseFloat(baseData.slice.packetLoss);
    baseData.slice.packetLoss = `${(currentLoss + parseFloat(variation.packetLoss)).toFixed(1)}%`;
  }

  return baseData;
}
