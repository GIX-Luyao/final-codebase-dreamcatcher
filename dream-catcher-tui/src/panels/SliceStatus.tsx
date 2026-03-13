import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { SliceState } from '../sources/types.js';
import { formatDuration, padEnd } from '../utils/format.js';

interface SliceStatusProps {
  state: SliceState;
  autoEnabled: boolean;
  width: number;
}

export function SliceStatus({ state, autoEnabled, width }: SliceStatusProps) {
  const [pulse, setPulse] = useState(true);
  const innerWidth = width - 2;

  // Pulse indicator when on WAN2 (low-latency active)
  useEffect(() => {
    if (state.activeWan === 'wan2') {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
    }
    setPulse(true);
  }, [state.activeWan]);

  const isWan2 = state.activeWan === 'wan2';
  const wanLabel = isWan2 ? 'WAN2 (Low-Latency)' : 'WAN1 (Default FWA)';
  const wanColor = isWan2 ? 'green' : 'blue';
  const indicator = isWan2 ? (pulse ? ' [*]' : ' [ ]') : '';

  const phaseLabel = state.phase.toUpperCase();
  const phaseColor =
    state.phase === 'active' ? 'green' :
    state.phase === 'switching' || state.phase === 'reverting' ? 'yellow' :
    state.phase === 'cooldown' ? 'magenta' : 'white';

  const isManual = state.triggerApp === 'Manual';
  const triggerLine = state.triggerApp
    ? `Trigger: ${state.triggerApp}`
    : 'No active trigger';

  const cooldownLine = state.cooldownRemaining > 0
    ? `Cooldown: ${state.cooldownRemaining}s`
    : state.phase === 'active' && state.switchedAt
      ? `On slice: ${formatDuration((Date.now() - state.switchedAt) / 1000)}`
      : '';

  const autoLabel = autoEnabled ? 'ON' : 'OFF [manual lock]';
  const autoColor = autoEnabled ? 'green' : 'yellow';

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={wanColor}
      width={width}
    >
      <Text bold color={wanColor} wrap="truncate">{padEnd(' Slice Status', innerWidth)}</Text>
      <Text wrap="truncate">
        {'  Active: '}
        <Text bold color={wanColor}>{wanLabel}</Text>
        <Text color={isWan2 ? 'green' : 'gray'}>{indicator}</Text>
      </Text>
      <Text wrap="truncate">
        {'  Phase:  '}
        <Text bold color={phaseColor}>{phaseLabel}</Text>
      </Text>
      <Text dimColor={!isManual} color={isManual ? 'cyan' : undefined} wrap="truncate">
        {'  '}{triggerLine}
      </Text>
      <Text wrap="truncate">
        {'  Auto:   '}
        <Text bold color={autoColor}>{autoLabel}</Text>
      </Text>
      {cooldownLine ? <Text dimColor wrap="truncate">{'  '}{cooldownLine}</Text> : null}
    </Box>
  );
}
