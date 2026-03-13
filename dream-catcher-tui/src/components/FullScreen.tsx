import React, { useEffect, useState } from 'react';
import { Box, useStdout } from 'ink';

interface FullScreenProps {
  children: React.ReactNode;
}

export function useTerminalSize() {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    width: stdout?.columns ?? 120,
    height: stdout?.rows ?? 40,
  });

  useEffect(() => {
    if (!stdout) return;

    const onResize = () => {
      setSize({ width: stdout.columns, height: stdout.rows });
    };

    stdout.on('resize', onResize);
    return () => { stdout.off('resize', onResize); };
  }, [stdout]);

  return size;
}

export function FullScreen({ children }: FullScreenProps) {
  const { stdout } = useStdout();
  const { width, height } = useTerminalSize();

  // Enter alternate screen buffer on mount, restore on unmount
  useEffect(() => {
    if (!stdout) return;
    stdout.write('\x1b[?1049h'); // Enter alternate screen
    stdout.write('\x1b[?25l');   // Hide cursor

    return () => {
      stdout.write('\x1b[?25h'); // Show cursor
      stdout.write('\x1b[?1049l'); // Leave alternate screen
    };
  }, [stdout]);

  return (
    <Box width={width} height={height} flexDirection="column">
      {children}
    </Box>
  );
}
