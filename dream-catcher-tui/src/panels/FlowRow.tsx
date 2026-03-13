import React from 'react';
import { Text } from 'ink';
import type { FlowEntry } from '../sources/types.js';
import { INTENT_COLORS, INTENT_SHORT } from '../sources/intent-colors.js';
import { formatEndpoint, formatBytes, padEnd, padStart } from '../utils/format.js';

interface FlowRowProps {
  flow: FlowEntry;
  width: number;
}

export function FlowRow({ flow, width }: FlowRowProps) {
  const color = INTENT_COLORS[flow.intent] || 'white';
  const nfstreamLabel = INTENT_SHORT[flow.nfstreamIntent ?? flow.intent] || flow.nfstreamIntent || '-';
  const mlLabel = flow.mlIntent ? (INTENT_SHORT[flow.mlIntent] || flow.mlIntent) : '-';
  const mlColor = flow.mlIntent ? (INTENT_COLORS[flow.mlIntent] || 'white') : 'gray';

  // Adaptive column widths based on available width
  let mainLine: string;
  let mlCol = '';
  if (width >= 100) {
    // Wide: all columns + both intents
    const src = formatEndpoint(flow.srcIp, flow.srcPort, 21);
    const dst = formatEndpoint(flow.dstIp, flow.dstPort, 21);
    const app = padEnd(flow.app, 16);
    const nfstream = padEnd(nfstreamLabel, 11);
    const pkts = padStart(String(flow.packets), 5);
    const bytes = formatBytes(flow.bytes);
    mainLine = ` ${src} ${dst} ${app} ${nfstream}`;
    mlCol = padEnd(mlLabel, 11);
    const suffix = ` ${pkts} ${bytes}`;
    // Truncate mainLine + mlCol + suffix to fit
    const full = mainLine + ' ' + mlCol + suffix;
    if (full.length > width) {
      mainLine = mainLine.slice(0, width - mlCol.length - suffix.length - 1);
    }
    return (
      <Text wrap="truncate">
        <Text color={color}>{mainLine} </Text>
        <Text color={mlColor}>{mlCol}</Text>
        <Text color={color}>{suffix}</Text>
      </Text>
    );
  } else if (width >= 80) {
    // Medium: both intents, no pkts/bytes
    const src = formatEndpoint(flow.srcIp, flow.srcPort, 19);
    const dst = formatEndpoint(flow.dstIp, flow.dstPort, 19);
    const app = padEnd(flow.app, 12);
    const nfstream = padEnd(nfstreamLabel, 11);
    mlCol = padEnd(mlLabel, 11);
    mainLine = ` ${src} ${dst} ${app} ${nfstream}`;
    const full = mainLine + ' ' + mlCol;
    if (full.length > width) {
      mainLine = mainLine.slice(0, width - mlCol.length - 1);
    }
    return (
      <Text wrap="truncate">
        <Text color={color}>{mainLine} </Text>
        <Text color={mlColor}>{mlCol}</Text>
      </Text>
    );
  } else {
    // Narrow: compact, single primary intent
    const src = formatEndpoint(flow.srcIp, flow.srcPort, 18);
    const dst = formatEndpoint(flow.dstIp, flow.dstPort, 18);
    const app = padEnd(flow.app, 12);
    mainLine = ` ${src} ${dst} ${app}`;
    if (mainLine.length > width) {
      mainLine = mainLine.slice(0, width);
    }
    return <Text color={color} wrap="truncate">{mainLine}</Text>;
  }
}
