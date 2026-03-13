import React from 'react';
import { Box, Text } from 'ink';
import type { SliceEventEntry } from '../sources/types.js';
import { formatTime, padEnd } from '../utils/format.js';

interface EventPanelProps {
  events: SliceEventEntry[];
  width: number;
  height: number;
}

function eventIcon(type: SliceEventEntry['type']): { icon: string; color: string } {
  switch (type) {
    case 'switch': return { icon: '\u25B2', color: 'red' };     // ▲
    case 'revert': return { icon: '\u25BC', color: 'blue' };    // ▼
    case 'detect': return { icon: '\u25CF', color: 'yellow' };  // ●
    case 'cooldown': return { icon: '\u25CB', color: 'magenta' }; // ○
    default: return { icon: '\u2022', color: 'white' };          // •
  }
}

export function EventPanel({ events, width, height }: EventPanelProps) {
  const innerWidth = width - 2;
  // Each event takes 2 lines (label + detail). Account for border + title
  const maxEvents = Math.max(0, Math.floor((height - 3) / 2));
  const visibleEvents = events.slice(0, maxEvents);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="magenta"
      width={width}
      height={height}
    >
      <Text bold color="magenta">{padEnd(' Slice Events', innerWidth)}</Text>

      {visibleEvents.length === 0 ? (
        <Text dimColor> No events yet</Text>
      ) : (
        visibleEvents.map((event, i) => {
          const { icon, color } = eventIcon(event.type);
          const time = formatTime(event.timestamp);
          return (
            <Box key={i} flexDirection="column">
              <Text>
                <Text dimColor> {time} </Text>
                <Text color={color}>{icon} </Text>
                <Text bold>{event.label}</Text>
              </Text>
              <Text dimColor>{'          '}{event.detail.slice(0, innerWidth - 10)}</Text>
            </Box>
          );
        })
      )}
    </Box>
  );
}
