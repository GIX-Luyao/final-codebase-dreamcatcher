import React from 'react';
import { Box, Text } from 'ink';
import type { MetricsSnapshot } from '../sources/types.js';
import { sparkline } from '../utils/sparkline.js';
import { padEnd, padStart } from '../utils/format.js';

interface MetricsPanelProps {
  current: MetricsSnapshot;
  history: MetricsSnapshot[];
  width: number;
}

function metricRow(label: string, value: string, values: number[], unit: string): React.ReactElement {
  const paddedLabel = padEnd(label, 12);
  const paddedValue = padStart(value, 7);
  const spark = sparkline(values, 12);
  return (
    <Text>
      {'  '}<Text dimColor>{paddedLabel}</Text>
      <Text bold>{paddedValue}</Text>
      <Text dimColor> {unit} </Text>
      <Text color="yellow">{spark}</Text>
    </Text>
  );
}

export function MetricsPanel({ current, history, width }: MetricsPanelProps) {
  const innerWidth = width - 2;

  const safe: MetricsSnapshot = {
    latencyMs: current?.latencyMs ?? 0,
    jitterMs: current?.jitterMs ?? 0,
    throughputMbps: current?.throughputMbps ?? 0,
    packetLossPct: current?.packetLossPct ?? 0,
  };

  const latencies = history.map(h => h.latencyMs ?? 0);
  const jitters = history.map(h => h.jitterMs ?? 0);
  const throughputs = history.map(h => h.throughputMbps ?? 0);
  const losses = history.map(h => h.packetLossPct ?? 0);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="yellow"
      width={width}
    >
      <Text bold color="yellow">{padEnd(' Network Metrics', innerWidth)}</Text>
      {metricRow('Latency', safe.latencyMs.toFixed(1), latencies, 'ms')}
      {metricRow('Jitter', safe.jitterMs.toFixed(1), jitters, 'ms')}
      {metricRow('Throughput', safe.throughputMbps.toFixed(0), throughputs, 'Mbps')}
      {metricRow('Pkt Loss', safe.packetLossPct.toFixed(2), losses, '%')}
    </Box>
  );
}
