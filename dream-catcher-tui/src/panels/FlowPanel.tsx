import React from 'react';
import { Box, Text } from 'ink';
import type { FlowEntry } from '../sources/types.js';
import { FlowRow } from './FlowRow.js';
import { padEnd, padStart } from '../utils/format.js';

interface FlowPanelProps {
  flows: FlowEntry[];
  flowsPerSec: number;
  width: number;
  height: number;
}

export function FlowPanel({ flows, flowsPerSec, width, height }: FlowPanelProps) {
  const innerWidth = width - 2; // account for border

  // Adaptive header based on width
  let headerLine: string;
  if (innerWidth >= 100) {
    headerLine = ` ${padEnd('Source', 21)} ${padEnd('Destination', 21)} ${padEnd('Application', 16)} ${padEnd('nDPI', 11)} ${padEnd('ML', 11)} ${padStart('Pkts', 5)} ${padStart('Bytes', 8)}`;
  } else if (innerWidth >= 80) {
    headerLine = ` ${padEnd('Source', 19)} ${padEnd('Destination', 19)} ${padEnd('Application', 12)} ${padEnd('nDPI', 11)} ${padEnd('ML', 11)}`;
  } else {
    headerLine = ` ${padEnd('Source', 18)} ${padEnd('Destination', 18)} ${padEnd('App', 12)}`;
  }

  if (headerLine.length > innerWidth) {
    headerLine = headerLine.slice(0, innerWidth);
  }

  // Show most recent flows that fit in the available height
  // height minus: 1 border top + 1 title + 1 header + 1 separator + 1 footer + 1 border bottom = 6
  const maxRows = Math.max(0, height - 6);
  const visibleFlows = flows.slice(-maxRows);

  const footer = ` ${flows.length} flows | ${flowsPerSec.toFixed(1)}/sec`;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      width={width}
      height={height}
    >
      <Text bold color="cyan" wrap="truncate">{padEnd(' Network Traffic', innerWidth)}</Text>
      <Text dimColor wrap="truncate">{headerLine}</Text>
      <Text dimColor wrap="truncate">{'\u2500'.repeat(innerWidth)}</Text>

      {visibleFlows.length === 0 ? (
        <Text dimColor> Waiting for traffic...</Text>
      ) : (
        visibleFlows.map(flow => (
          <FlowRow key={flow.id} flow={flow} width={innerWidth} />
        ))
      )}

      {/* Spacer to push footer down */}
      <Box flexGrow={1} />

      <Text dimColor wrap="truncate">{'\u2500'.repeat(Math.max(0, innerWidth - footer.length))}{footer}</Text>
    </Box>
  );
}
