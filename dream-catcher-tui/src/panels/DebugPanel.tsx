import React from 'react';
import { Box, Text } from 'ink';
import type { DebugEntry } from '../hooks/useDebugLog.js';
import { formatTime, padEnd } from '../utils/format.js';

interface DebugPanelProps {
  entries: DebugEntry[];
  width: number;
  height: number;
}

export function DebugPanel({ entries, width, height }: DebugPanelProps) {
  const innerWidth = width - 2;
  // Account for border (2 lines) + title (1 line)
  const maxLines = Math.max(0, height - 3);
  const visible = entries.slice(-maxLines);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="red"
      width={width}
      height={height}
    >
      <Text bold color="red">{padEnd(' Debug Log', innerWidth)}</Text>

      {visible.length === 0 ? (
        <Text dimColor> No log entries yet. Bridge stderr and console output will appear here.</Text>
      ) : (
        visible.map((entry, i) => {
          const time = formatTime(entry.timestamp);
          const maxMsg = innerWidth - 12; // [HH:MM:SS] + space
          const msg = entry.message.length > maxMsg
            ? entry.message.slice(0, maxMsg - 1) + '\u2026'
            : entry.message;
          return (
            <Text key={i} wrap="truncate">
              <Text dimColor> [{time}] </Text>
              <Text>{msg}</Text>
            </Text>
          );
        })
      )}
    </Box>
  );
}
