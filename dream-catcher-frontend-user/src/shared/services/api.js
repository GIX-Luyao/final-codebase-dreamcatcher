/**
 * API Service
 * Handles all backend API communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch current network slice data
 * @param {string} activityType - Type of activity (optional)
 * @returns {Promise} Network slice data
 */
export async function fetchNetworkSliceData(activityType = null) {
  try {
    const url = activityType 
      ? `${API_BASE_URL}/network-slice/current?activityType=${encodeURIComponent(activityType)}`
      : `${API_BASE_URL}/network-slice/current`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch network slice data');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching network slice data:', error);
    throw error;
  }
}

/**
 * Fetch all available activity types
 * @returns {Promise} Array of activity types
 */
export async function fetchActivityTypes() {
  try {
    const response = await fetch(`${API_BASE_URL}/network-slice/activities`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch activity types');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching activity types:', error);
    throw error;
  }
}

/**
 * Fetch simulated/updated network slice data with variations
 * @param {string} activityType - Type of activity (optional)
 * @returns {Promise} Network slice data with variations
 */
export async function fetchSimulatedData(activityType = null) {
  try {
    const url = activityType 
      ? `${API_BASE_URL}/network-slice/simulate?activityType=${encodeURIComponent(activityType)}`
      : `${API_BASE_URL}/network-slice/simulate`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch simulated data');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching simulated data:', error);
    throw error;
  }
}

/**
 * Check if backend server is healthy
 * @returns {Promise<boolean>} True if server is healthy
 */
export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend server is not available:', error);
    return false;
  }
}

/**
 * Fetch current real-time metrics
 * @returns {Promise<Object>} Metrics data including latencyMs, throughputMbps, packetLossPct, qualityScore, etc.
 */
export async function fetchMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/current`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch metrics');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }
}

/**
 * Fetch events/activity log
 * @param {Object} options - Optional query parameters
 * @param {number} options.limit - Maximum number of events to return
 * @param {string} options.status - Filter by status (e.g., 'Active', 'Completed')
 * @param {string} options.priority - Filter by priority (e.g., 'High', 'Normal')
 * @returns {Promise<Array>} Array of event objects
 */
export async function fetchEvents(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);
    if (options.priority) params.append('priority', options.priority);
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/events?${queryString}`
      : `${API_BASE_URL}/events`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch events');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Fetch telemetry data
 * @param {Object} options - Optional query parameters
 * @param {string} options.timeRange - Time range for telemetry data (e.g., '1h', '24h', '7d')
 * @returns {Promise<Object>} Telemetry data including jitter, signal strength, etc.
 */
export async function fetchTelemetry(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.timeRange) params.append('timeRange', options.timeRange);
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/telemetry?${queryString}`
      : `${API_BASE_URL}/telemetry`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch telemetry');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    throw error;
  }
}

/**
 * Fetch connected devices
 * @param {Object} options - Optional query parameters
 * @param {string} options.status - Filter by device status (e.g., 'connected', 'disconnected')
 * @returns {Promise<Array>} Array of device objects
 */
export async function fetchDevices(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/devices?${queryString}`
      : `${API_BASE_URL}/devices`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch devices');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
}

/**
 * Fetch router data
 * @param {string} path - Optional path suffix (e.g., 'status', 'config', 'info')
 * @returns {Promise<Object>} Router data
 */
export async function fetchRouterData(path = '') {
  try {
    const url = path 
      ? `${API_BASE_URL}/router/${path}`
      : `${API_BASE_URL}/router`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch router data');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching router data:', error);
    throw error;
  }
}

/**
 * Fetch analytics impact data
 * @param {Object} options - Optional query parameters
 * @param {string} options.timeRange - Time range for analytics (e.g., '24h', '7d', '30d')
 * @param {string} options.metric - Specific metric to analyze
 * @returns {Promise<Object>} Analytics impact data
 */
export async function fetchAnalyticsImpact(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.timeRange) params.append('timeRange', options.timeRange);
    if (options.metric) params.append('metric', options.metric);
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/analytics/impact?${queryString}`
      : `${API_BASE_URL}/analytics/impact`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch analytics impact');
    }
    
    return result.data;
  } catch (error) {
    console.error('Error fetching analytics impact:', error);
    throw error;
  }
}
