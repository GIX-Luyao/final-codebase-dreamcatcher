import React, { createContext, useContext } from 'react';
import { useTelemetryStream } from '../hooks/useTelemetryStream';
import { getSource } from '../utils/getSource';

// Create context
const TelemetryContext = createContext(null);

// Provider component - creates ONE subscription
export function TelemetryProvider({ children }) {
  const telemetry = useTelemetryStream({ source: getSource() });
  
  return (
    <TelemetryContext.Provider value={telemetry}>
      {children}
    </TelemetryContext.Provider>
  );
}

// Hook for components to consume telemetry
export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}