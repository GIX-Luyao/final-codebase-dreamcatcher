export type IntentCategory =
  | 'Conversational Real-time'
  | 'Interactive Workflows'
  | 'Interactive Entertainment'
  | 'Buffered Consumption'
  | 'Background';

export type WanId = 'wan1' | 'wan2';

export type SlicePhase =
  | 'idle'
  | 'detecting'
  | 'switching'
  | 'active'
  | 'cooldown'
  | 'reverting';

export type ClassifiedBy = 'nDPI' | 'ML' | 'default';

export interface FlowEvent {
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  app: string;
  intent: IntentCategory;
  classifiedBy?: ClassifiedBy;
  nfstreamIntent?: IntentCategory;
  mlIntent?: IntentCategory;
  mlConfidence?: number;
  packets: number;
  bytes: number;
}

export interface FlowEntry extends FlowEvent {
  id: string;
  timestamp: number;
}

export interface SwitchEvent {
  action: 'switch_to_wan1' | 'switch_to_wan2';
  success: boolean;
  reason: string;
  trigger: string | null;
  durationMs: number;
}

export interface StatusEvent {
  activeWan: WanId;
  phase: SlicePhase;
  interface?: string;
  mappings?: number;
}

export interface MetricsSnapshot {
  latencyMs: number;
  jitterMs: number;
  throughputMbps: number;
  packetLossPct: number;
}

export type BridgeEvent =
  | { type: 'flow'; ts: number; data: FlowEvent }
  | { type: 'switch'; ts: number; data: SwitchEvent }
  | { type: 'status'; ts: number; data: StatusEvent }
  | { type: 'metrics'; ts: number; data: MetricsSnapshot };

export interface SliceState {
  activeWan: WanId;
  phase: SlicePhase;
  triggerApp: string | null;
  switchedAt: number | null;
  cooldownRemaining: number;
  events: SliceEventEntry[];
}

export interface SliceEventEntry {
  timestamp: number;
  type: 'switch' | 'detect' | 'revert' | 'cooldown' | 'manual';
  label: string;
  detail: string;
}
