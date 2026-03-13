import React from 'react';
import { Box, Text } from 'ink';

const LOGO_FULL = `  ____                              ____       _       _
 |  _ \\ _ __ ___  __ _ _ __ ___   / ___|__ _| |_ ___| |__   ___ _ __
 | | | | '__/ _ \\/ _\` | '_ \` _ \\ | |   / _\` | __/ __| '_ \\ / _ \\ '__|
 | |_| | | |  __/ (_| | | | | | || |__| (_| | || (__| | | |  __/ |
 |____/|_|  \\___|\\__,_|_| |_| |_| \\____|\\__,_|\\__\\___|_| |_|\\___|_|`;

const LOGO_COMPACT = ' DREAM CATCHER';

interface HeaderProps {
  mode: 'live' | 'demo';
  width: number;
}

export function Header({ mode, width }: HeaderProps) {
  const useCompact = width < 80;
  const modeBadge = mode === 'demo' ? '[DEMO]' : '[LIVE]';
  const modeColor = mode === 'demo' ? 'yellow' : 'green';
  const subtitle = 'Intent-Based Network Slice Controller';

  if (useCompact) {
    return (
      <Box height={1} width={width}>
        <Text bold color="cyan">{LOGO_COMPACT}</Text>
        <Text dimColor> {'\u2500'.repeat(Math.max(0, width - LOGO_COMPACT.length - modeBadge.length - subtitle.length - 6))}</Text>
        <Text dimColor> {subtitle} </Text>
        <Text bold color={modeColor}> {modeBadge}</Text>
      </Box>
    );
  }

  const logoLines = LOGO_FULL.split('\n');

  return (
    <Box flexDirection="column" width={width}>
      {logoLines.map((line, i) => (
        <Text key={i} color="cyan">{line}</Text>
      ))}
      <Box>
        <Text dimColor>  {subtitle}</Text>
        <Text> </Text>
        <Text bold color={modeColor}>{modeBadge}</Text>
      </Box>
    </Box>
  );
}
