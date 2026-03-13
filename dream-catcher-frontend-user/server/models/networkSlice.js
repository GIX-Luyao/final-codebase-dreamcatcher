/**
 * Network Slice Data Models
 * Defines the structure for network slice information
 */

export const SliceType = {
  NORMAL: 'normal',
  VIDEO_CONFERENCE: 'video_conference',
  GAMING: 'gaming',
  STREAMING: 'streaming',
  IOT: 'iot'
};

export const ActivityType = {
  VIDEO_CONFERENCE: 'Video Conference',
  WEB_BROWSING: 'Web Browsing',
  FILE_DOWNLOAD: 'File Download',
  GAMING: 'Gaming',
  STREAMING: 'Streaming',
  IDLE: 'Idle'
};

export const PriorityLevel = {
  HIGH: 'High Priority',
  MEDIUM: 'Medium Priority',
  LOW: 'Low Priority',
  NORMAL: 'Normal Priority'
};

/**
 * Network Slice Configuration
 */
export class NetworkSlice {
  constructor({
    id,
    name,
    type,
    status = 'active',
    allocatedBandwidth,
    latency,
    packetLoss,
    description,
    icon
  }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.status = status;
    this.allocatedBandwidth = allocatedBandwidth;
    this.latency = latency;
    this.packetLoss = packetLoss;
    this.description = description;
    this.icon = icon;
  }
}

/**
 * Current Activity Information
 */
export class CurrentActivity {
  constructor({
    isLive = false,
    activityType,
    priority,
    icon,
    sliceId
  }) {
    this.isLive = isLive;
    this.activityType = activityType;
    this.priority = priority;
    this.icon = icon;
    this.sliceId = sliceId;
  }
}

/**
 * Performance Metrics
 */
export class PerformanceMetrics {
  constructor({
    weeklyReliability,
    description
  }) {
    this.weeklyReliability = weeklyReliability;
    this.description = description;
  }
}
