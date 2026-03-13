import React from 'react';
import { Box, Text } from 'ink';
import { formatDuration } from '../utils/format.js';

interface StatusBarProps {
  mode: 'live' | 'demo';
  uptimeSeconds: number;
  flowsPerSec: number;
  width: number;
  bridgeError?: string | null;
}

export function StatusBar({ mode, uptimeSeconds, flowsPerSec, width, bridgeError }: StatusBarProps) {
  const modeLabel = mode === 'demo' ? 'DEMO' : 'LIVE';
  const modeColor = mode === 'demo' ? 'yellow' : 'green';

  if (bridgeError) {
    return (
      <Box width={width} height={1}>
        <Text backgroundColor="red" color="white" wrap="truncate">
          {' ERROR: '}{bridgeError}{' '}
        </Text>
      </Box>
    );
  }

  return (
    <Box width={width} height={1}>
      <Text backgroundColor="gray" color="black" wrap="truncate">
        {' '}
        <Text color={modeColor} bold>{modeLabel}</Text>
        {'  Uptime: '}
        {formatDuration(uptimeSeconds)}
        {'  \u2502  '}
        {flowsPerSec.toFixed(1)} flows/sec
        {'  \u2502  '}
        q:quit  d:debug  1:WAN1  2:WAN2  t:toggle  a:auto
        {' '}
      </Text>
    </Box>
  );
}
