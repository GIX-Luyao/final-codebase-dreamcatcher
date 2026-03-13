/**
 * Network Benchmark Service
 * Uses real tools to measure network metrics: latency, throughput, packet loss
 */

import ping from 'ping';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Hosts to ping for latency/packet loss measurement
  pingHosts: [
    '8.8.8.8',        // Google DNS
    '1.1.1.1',        // Cloudflare DNS
    'google.com',
    'cloudflare.com'
  ],
  pingCount: 5,       // Number of pings per measurement
  pingTimeout: 2,     // Timeout in seconds

  // Speedtest configuration
  speedtestEnabled: false,  // Disable by default (takes ~30s)
  speedtestInterval: 300000 // 5 minutes between speedtests
};

// ============================================================================
// CACHED METRICS
// ============================================================================

let cachedMetrics = {
  latencyMs: 25,
  jitterMs: 3,
  throughputMbps: 100,
  packetLossPct: 0,
  qualityScore: 90,
  lastUpdated: null,
  source: 'initial'
};

let lastSpeedtest = null;
let isSpeedtestRunning = false;

// ============================================================================
// LATENCY & PACKET LOSS MEASUREMENT (using ping)
// ============================================================================

/**
 * Measure latency and packet loss to a specific host
 */
async function pingHost(host) {
  try {
    const result = await ping.promise.probe(host, {
      timeout: CONFIG.pingTimeout,
      extra: ['-c', String(CONFIG.pingCount)]
    });

    return {
      host,
      alive: result.alive,
      latencyMs: result.avg ? parseFloat(result.avg) : null,
      minLatencyMs: result.min ? parseFloat(result.min) : null,
      maxLatencyMs: result.max ? parseFloat(result.max) : null,
      packetLossPct: result.packetLoss ? parseFloat(result.packetLoss) : 0
    };
  } catch (error) {
    console.error(`Failed to ping ${host}:`, error.message);
    return {
      host,
      alive: false,
      latencyMs: null,
      packetLossPct: 100
    };
  }
}

/**
 * Measure latency and packet loss across multiple hosts
 */
async function measureLatencyAndPacketLoss() {
  const results = await Promise.all(
    CONFIG.pingHosts.map(host => pingHost(host))
  );

  const validResults = results.filter(r => r.alive && r.latencyMs !== null);

  if (validResults.length === 0) {
    return {
      latencyMs: null,
      jitterMs: null,
      packetLossPct: 100
    };
  }

  // Calculate average latency
  const avgLatency = validResults.reduce((sum, r) => sum + r.latencyMs, 0) / validResults.length;

  // Calculate jitter (variation in latency)
  const latencies = validResults.map(r => r.latencyMs);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const jitter = (maxLatency - minLatency) / 2;

  // Calculate average packet loss
  const avgPacketLoss = results.reduce((sum, r) => sum + (r.packetLossPct || 0), 0) / results.length;

  return {
    latencyMs: Math.round(avgLatency * 100) / 100,
    jitterMs: Math.round(jitter * 100) / 100,
    packetLossPct: Math.round(avgPacketLoss * 100) / 100,
    details: validResults
  };
}

// ============================================================================
// THROUGHPUT MEASUREMENT (using speedtest-net)
// ============================================================================

/**
 * Run speedtest to measure throughput
 * Note: This is expensive and takes ~30 seconds
 */
async function measureThroughput() {
  if (!CONFIG.speedtestEnabled) {
    return {
      downloadMbps: cachedMetrics.throughputMbps,
      uploadMbps: cachedMetrics.throughputMbps * 0.3,
      source: 'cached'
    };
  }

  // Prevent concurrent speedtests
  if (isSpeedtestRunning) {
    return {
      downloadMbps: cachedMetrics.throughputMbps,
      uploadMbps: cachedMetrics.throughputMbps * 0.3,
      source: 'cached-concurrent'
    };
  }

  // Check if we ran speedtest recently
  if (lastSpeedtest && Date.now() - lastSpeedtest < CONFIG.speedtestInterval) {
    return {
      downloadMbps: cachedMetrics.throughputMbps,
      uploadMbps: cachedMetrics.throughputMbps * 0.3,
      source: 'cached-recent'
    };
  }

  try {
    isSpeedtestRunning = true;
    console.log('Running speedtest...');

    // Dynamic import to avoid startup delay
    const speedTest = await import('speedtest-net');
    const result = await speedTest.default({ acceptLicense: true, acceptGdpr: true });

    lastSpeedtest = Date.now();

    return {
      downloadMbps: Math.round((result.download.bandwidth / 125000) * 100) / 100,
      uploadMbps: Math.round((result.upload.bandwidth / 125000) * 100) / 100,
      ping: result.ping.latency,
      server: result.server.name,
      source: 'live'
    };
  } catch (error) {
    console.error('Speedtest failed:', error.message);
    return {
      downloadMbps: cachedMetrics.throughputMbps,
      uploadMbps: cachedMetrics.throughputMbps * 0.3,
      source: 'fallback'
    };
  } finally {
    isSpeedtestRunning = false;
  }
}

// ============================================================================
// QUALITY SCORE CALCULATION
// ============================================================================

/**
 * Calculate quality score (0-100) based on metrics
 */
function calculateQualityScore(latencyMs, jitterMs, packetLossPct) {
  // Weights for each metric
  const weights = {
    latency: 0.4,
    jitter: 0.3,
    packetLoss: 0.3
  };

  // Latency score (0-100): <20ms = 100, >200ms = 0
  const latencyScore = Math.max(0, Math.min(100, 100 - (latencyMs - 20) * 0.5));

  // Jitter score (0-100): <5ms = 100, >50ms = 0
  const jitterScore = Math.max(0, Math.min(100, 100 - (jitterMs - 5) * 2));

  // Packet loss score (0-100): 0% = 100, >5% = 0
  const packetLossScore = Math.max(0, Math.min(100, 100 - packetLossPct * 20));

  const score = (
    latencyScore * weights.latency +
    jitterScore * weights.jitter +
    packetLossScore * weights.packetLoss
  );

  return Math.round(score);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get current network metrics (uses real measurements)
 */
export async function getCurrentMetrics() {
  try {
    // Measure latency and packet loss
    const pingResults = await measureLatencyAndPacketLoss();

    // Check if network is reachable (at least one host responded)
    const isReachable = pingResults.latencyMs !== null;

    if (isReachable) {
      // Update cached metrics with real data
      cachedMetrics.latencyMs = pingResults.latencyMs;
      cachedMetrics.jitterMs = pingResults.jitterMs || cachedMetrics.jitterMs;
      cachedMetrics.packetLossPct = pingResults.packetLossPct;
      cachedMetrics.qualityScore = calculateQualityScore(
        pingResults.latencyMs,
        pingResults.jitterMs || 0,
        pingResults.packetLossPct
      );
      cachedMetrics.lastUpdated = new Date().toISOString();
      cachedMetrics.source = 'live-ping';

      return {
        isReachable: true,
        latencyMs: cachedMetrics.latencyMs,
        jitterMs: cachedMetrics.jitterMs,
        throughputMbps: cachedMetrics.throughputMbps,
        packetLossPct: cachedMetrics.packetLossPct,
        qualityScore: cachedMetrics.qualityScore,
        activeDevices: 5,  // From mock data
        currentSlice: 'normal',
        sliceSwitchesToday: 12
      };
    } else {
      // Network is unreachable - return null values
      return {
        isReachable: false,
        latencyMs: null,
        jitterMs: null,
        throughputMbps: null,
        packetLossPct: 100,  // 100% packet loss is accurate when unreachable
        qualityScore: null,
        activeDevices: 5,
        currentSlice: 'normal',
        sliceSwitchesToday: 12
      };
    }
  } catch (error) {
    console.error('Failed to get current metrics:', error.message);
    // Return null values on error
    return {
      isReachable: false,
      latencyMs: null,
      jitterMs: null,
      throughputMbps: null,
      packetLossPct: 100,
      qualityScore: null,
      activeDevices: 5,
      currentSlice: 'normal',
      sliceSwitchesToday: 12
    };
  }
}

/**
 * Get metrics with throughput (slower, runs speedtest if enabled)
 */
export async function getFullMetrics() {
  const current = await getCurrentMetrics();
  const throughput = await measureThroughput();

  if (throughput.source === 'live') {
    cachedMetrics.throughputMbps = throughput.downloadMbps;
  }

  return {
    ...current,
    throughputMbps: throughput.downloadMbps,
    uploadMbps: throughput.uploadMbps,
    throughputSource: throughput.source
  };
}

/**
 * Generate a metrics history point with real base + small variation
 */
export async function generateMetricsPoint() {
  // Get real metrics as baseline
  const real = await getCurrentMetrics();

  // Add small realistic variation
  const variation = {
    latency: (Math.random() - 0.5) * 4,
    jitter: (Math.random() - 0.5) * 2,
    throughput: (Math.random() - 0.5) * 10,
    packetLoss: Math.random() * 0.1
  };

  const latencyMs = Math.max(5, real.latencyMs + variation.latency);
  const jitterMs = Math.max(0.5, real.jitterMs + variation.jitter);
  const throughputMbps = Math.max(10, real.throughputMbps + variation.throughput);
  const packetLossPct = Math.max(0, Math.min(5, real.packetLossPct + variation.packetLoss));

  return {
    timestamp: Date.now(),
    latencyMs: Math.round(latencyMs * 100) / 100,
    jitterMs: Math.round(jitterMs * 100) / 100,
    throughputMbps: Math.round(throughputMbps * 100) / 100,
    packetLossPct: Math.round(packetLossPct * 100) / 100,
    quality: calculateQualityScore(latencyMs, jitterMs, packetLossPct)
  };
}

/**
 * Generate historical metrics data
 */
export async function getMetricsHistory({ period = '1h', resolution = '1m' } = {}) {
  // Get current real metrics as baseline
  const baseline = await getCurrentMetrics();

  // Calculate number of points based on period and resolution
  const periodMs = {
    '1h': 3600000,
    '6h': 21600000,
    '24h': 86400000,
    '7d': 604800000
  }[period] || 3600000;

  const resolutionMs = {
    '1s': 1000,
    '1m': 60000,
    '5m': 300000,
    '1h': 3600000
  }[resolution] || 60000;

  const numPoints = Math.min(200, Math.floor(periodMs / resolutionMs));
  const now = Date.now();
  const points = [];
  const markers = [];

  // Generate points with realistic variation
  for (let i = numPoints - 1; i >= 0; i--) {
    const timestamp = now - i * resolutionMs;

    // Simulate some events at random intervals
    const hasEvent = Math.random() < 0.02;
    let sliceType = 'normal';

    // Add variation based on time of day simulation
    const variation = Math.sin(i / 20) * 5 + (Math.random() - 0.5) * 8;

    const latencyMs = Math.max(5, baseline.latencyMs + variation);
    const jitterMs = Math.max(0.5, baseline.jitterMs + (Math.random() - 0.5) * 3);
    const throughputMbps = Math.max(10, baseline.throughputMbps + (Math.random() - 0.5) * 20);
    const packetLossPct = Math.max(0, baseline.packetLossPct + Math.random() * 0.2);

    points.push({
      timestamp,
      latencyMs: Math.round(latencyMs * 100) / 100,
      jitterMs: Math.round(jitterMs * 100) / 100,
      throughputMbps: Math.round(throughputMbps * 100) / 100,
      packetLossPct: Math.round(packetLossPct * 100) / 100,
      qualityScore: calculateQualityScore(latencyMs, jitterMs, packetLossPct)
    });

    if (hasEvent && markers.length < 5) {
      markers.push({
        timestamp,
        type: 'slice_switch',
        from: sliceType === 'normal' ? 'normal' : 'video',
        to: sliceType === 'normal' ? 'video' : 'normal',
        reason: sliceType === 'normal' ? 'Meeting detected' : 'Meeting ended'
      });
    }
  }

  return {
    period,
    resolution,
    points,
    markers
  };
}

/**
 * Enable or disable speedtest
 */
export function setSpeedtestEnabled(enabled) {
  CONFIG.speedtestEnabled = enabled;
}

/**
 * Update cached throughput (for external updates)
 */
export function setCachedThroughput(mbps) {
  cachedMetrics.throughputMbps = mbps;
}
