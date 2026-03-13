import type { FlowEvent, IntentCategory, MetricsSnapshot, ClassifiedBy } from './types.js';

const ALL_INTENTS: IntentCategory[] = [
  'Conversational Real-time',
  'Interactive Workflows',
  'Interactive Entertainment',
  'Buffered Consumption',
  'Background',
];

interface DemoDevice {
  ip: string;
  name: string;
}

export const DEMO_DEVICES: DemoDevice[] = [
  { ip: '192.168.1.100', name: 'MacBook Pro' },
  { ip: '192.168.1.102', name: 'iPhone 15' },
  { ip: '192.168.1.103', name: 'iPad Air' },
  { ip: '192.168.1.110', name: 'Apple TV' },
  { ip: '192.168.1.115', name: 'HomePod' },
];

interface FlowTemplate {
  app: string;
  intent: IntentCategory;
  dstIp: string;
  dstPort: number;
  bytesRange: [number, number];
  packetsRange: [number, number];
}

export const BACKGROUND_FLOWS: FlowTemplate[] = [
  { app: 'DNS', intent: 'Background', dstIp: '1.1.1.1', dstPort: 53, bytesRange: [128, 512], packetsRange: [2, 4] },
  { app: 'DNS', intent: 'Background', dstIp: '8.8.8.8', dstPort: 53, bytesRange: [128, 512], packetsRange: [2, 4] },
  { app: 'NTP', intent: 'Background', dstIp: '129.6.15.28', dstPort: 123, bytesRange: [64, 128], packetsRange: [1, 2] },
  { app: 'Dropbox', intent: 'Background', dstIp: '162.125.19.131', dstPort: 443, bytesRange: [1024, 8192], packetsRange: [4, 12] },
  { app: 'APPLE_PUSH', intent: 'Background', dstIp: '17.188.166.5', dstPort: 443, bytesRange: [256, 1024], packetsRange: [2, 6] },
  { app: 'APPLE_ICLOUD', intent: 'Background', dstIp: '17.248.133.80', dstPort: 443, bytesRange: [2048, 16384], packetsRange: [6, 20] },
  { app: 'MDNS', intent: 'Background', dstIp: '224.0.0.251', dstPort: 5353, bytesRange: [64, 256], packetsRange: [1, 3] },
  { app: 'SSDP', intent: 'Background', dstIp: '239.255.255.250', dstPort: 1900, bytesRange: [128, 512], packetsRange: [1, 2] },
];

export const BUFFERED_FLOWS: FlowTemplate[] = [
  { app: 'YouTube', intent: 'Buffered Consumption', dstIp: '142.250.80.14', dstPort: 443, bytesRange: [102400, 524288], packetsRange: [80, 400] },
  { app: 'Netflix', intent: 'Buffered Consumption', dstIp: '54.246.39.102', dstPort: 443, bytesRange: [204800, 1048576], packetsRange: [150, 700] },
  { app: 'SPOTIFY', intent: 'Buffered Consumption', dstIp: '35.186.224.25', dstPort: 443, bytesRange: [32768, 131072], packetsRange: [30, 100] },
  { app: 'TikTok', intent: 'Buffered Consumption', dstIp: '161.117.251.32', dstPort: 443, bytesRange: [65536, 262144], packetsRange: [50, 200] },
  { app: 'Instagram', intent: 'Buffered Consumption', dstIp: '157.240.1.174', dstPort: 443, bytesRange: [32768, 131072], packetsRange: [20, 80] },
];

export const INTERACTIVE_FLOWS: FlowTemplate[] = [
  { app: 'SLACK', intent: 'Interactive Workflows', dstIp: '34.237.40.146', dstPort: 443, bytesRange: [2048, 16384], packetsRange: [8, 30] },
  { app: 'GITHUB', intent: 'Interactive Workflows', dstIp: '140.82.121.4', dstPort: 443, bytesRange: [4096, 32768], packetsRange: [10, 40] },
  { app: 'MS_TEAMS', intent: 'Interactive Workflows', dstIp: '52.112.0.31', dstPort: 443, bytesRange: [2048, 8192], packetsRange: [6, 20] },
];

export const ENTERTAINMENT_FLOWS: FlowTemplate[] = [
  { app: 'STEAM', intent: 'Interactive Entertainment', dstIp: '155.133.246.69', dstPort: 27015, bytesRange: [1024, 8192], packetsRange: [30, 120] },
  { app: 'Twitch', intent: 'Interactive Entertainment', dstIp: '52.223.241.100', dstPort: 443, bytesRange: [102400, 524288], packetsRange: [80, 300] },
];

export const REALTIME_FLOWS: FlowTemplate[] = [
  { app: 'Zoom', intent: 'Conversational Real-time', dstIp: '66.220.156.68', dstPort: 443, bytesRange: [4096, 32768], packetsRange: [15, 60] },
  { app: 'Zoom', intent: 'Conversational Real-time', dstIp: '66.220.156.68', dstPort: 8801, bytesRange: [8192, 65536], packetsRange: [20, 80] },
  { app: 'GOOGLE_MEET', intent: 'Conversational Real-time', dstIp: '142.250.80.46', dstPort: 443, bytesRange: [4096, 32768], packetsRange: [15, 60] },
  { app: 'FaceTime', intent: 'Conversational Real-time', dstIp: '17.252.128.50', dstPort: 443, bytesRange: [8192, 65536], packetsRange: [20, 80] },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPort(): number {
  return randInt(49152, 65535);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFlow(template: FlowTemplate): FlowEvent {
  const device = pickRandom(DEMO_DEVICES);

  // Simulate ML classification:
  //   70% → ML agrees with nDPI (high confidence)
  //   15% → ML disagrees (picks a different intent)
  //   15% → no ML classification
  const mlRoll = Math.random();
  let mlIntent: IntentCategory | undefined;
  let mlConfidence: number | undefined;
  let classifiedBy: ClassifiedBy | undefined;

  if (mlRoll < 0.70) {
    mlIntent = template.intent;
    mlConfidence = 0.75 + Math.random() * 0.24; // 0.75–0.99
    classifiedBy = 'ML';
  } else if (mlRoll < 0.85) {
    const others = ALL_INTENTS.filter(i => i !== template.intent);
    mlIntent = pickRandom(others);
    mlConfidence = 0.50 + Math.random() * 0.30; // 0.50–0.80 (lower when wrong)
    classifiedBy = 'nDPI'; // nDPI wins when ML disagrees
  }
  // else: no ML data, classifiedBy stays undefined

  return {
    srcIp: device.ip,
    srcPort: randPort(),
    dstIp: template.dstIp,
    dstPort: template.dstPort,
    app: template.app,
    intent: template.intent,
    nfstreamIntent: template.intent,
    ...(mlIntent !== undefined && { mlIntent, mlConfidence }),
    ...(classifiedBy !== undefined && { classifiedBy }),
    packets: randInt(...template.packetsRange),
    bytes: randInt(...template.bytesRange),
  };
}

export function generateBackgroundFlow(): FlowEvent {
  return generateFlow(pickRandom(BACKGROUND_FLOWS));
}

export function generateMixedFlow(): FlowEvent {
  const roll = Math.random();
  if (roll < 0.4) return generateFlow(pickRandom(BACKGROUND_FLOWS));
  if (roll < 0.7) return generateFlow(pickRandom(BUFFERED_FLOWS));
  if (roll < 0.85) return generateFlow(pickRandom(INTERACTIVE_FLOWS));
  return generateFlow(pickRandom(ENTERTAINMENT_FLOWS));
}

export function generateRealtimeFlow(): FlowEvent {
  return generateFlow(pickRandom(REALTIME_FLOWS));
}

/**
 * Generate simulated metrics that vary based on which WAN is active.
 */
export function generateMetrics(onWan2: boolean): MetricsSnapshot {
  if (onWan2) {
    return {
      latencyMs: 12 + Math.random() * 8,
      jitterMs: 0.5 + Math.random() * 2,
      throughputMbps: 80 + Math.random() * 40,
      packetLossPct: Math.random() * 0.05,
    };
  }
  return {
    latencyMs: 25 + Math.random() * 15,
    jitterMs: 2 + Math.random() * 5,
    throughputMbps: 40 + Math.random() * 30,
    packetLossPct: 0.1 + Math.random() * 0.3,
  };
}
