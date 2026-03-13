import React, { useState, useEffect, useRef } from 'react';
import './DemoSection.css';

import WorkflowDiagram from './WorkflowDiagram';
import QualityVariationChart from './QualityVariationChart';
import TechnicalMetricsPanel from './TechnicalMetricsPanel';
import EventLog from './EventLog';

import { useTelemetry } from '../../../../shared/context/TelemetryContext';
/**
 * Translates technical telemetry events to stakeholder-friendly format
 * @param {string} event - Event type
 * @param {Object} state - Telemetry state
 * @param {Object} metrics - Current metrics
 * @param {Object} [baselineMetrics] - Baseline (before) metrics, e.g. when MEETING_DETECTED
 */
function translateEvent(event, state, metrics, baselineMetrics) {
  if (!event || !state) return null;

  const devices = state.devices || [];
  const device1 = devices.find(d => d.priority === 'high') || devices[0];

  const eventTranslations = {
    MEETING_DETECTED: {
      event: 'High-Priority Task Detected',
      details: device1 ? `Device ${device1.name} started ${device1.app} (${device1.intent})` : 'High-priority task detected',
      impact: 'Initiating network optimization',
      eventType: 'high-priority',
    },
    SWITCH_INITIATED: {
      event: 'Optimization In Progress',
      details: `Switching to ${state.currentSlice === 'video' ? 'Optimized' : 'FWA'} Slice`,
      impact: 'Network is being optimized for real-time tasks',
      eventType: 'optimization',
    },
    SWITCH_COMPLETED: (() => {
      if (!metrics) return { event: 'Optimization Complete', details: `Now on ${state.currentSlice === 'video' ? 'Optimized' : 'FWA'} Slice`, impact: 'Network optimized for current task', eventType: 'success' };
      if (baselineMetrics) {
        const lat = `Latency reduced from ${baselineMetrics.latencyMs}ms to ${metrics.latencyMs}ms`;
        const loss = `Packet loss reduced from ${baselineMetrics.packetLossPct.toFixed(2)}% to ${metrics.packetLossPct.toFixed(2)}%`;
        const jit = baselineMetrics.jitterMs != null && metrics.jitterMs != null
          ? `Jitter reduced from ${baselineMetrics.jitterMs}ms to ${metrics.jitterMs}ms`
          : null;
        const impact = [lat, jit, loss].filter(Boolean).join('; ');
        return { event: 'Optimization Complete', details: `Now on ${state.currentSlice === 'video' ? 'Optimized' : 'FWA'} Slice`, impact, eventType: 'success' };
      }
      return {
        event: 'Optimization Complete',
        details: `Now on ${state.currentSlice === 'video' ? 'Optimized' : 'FWA'} Slice`,
        impact: `Latency reduced to ${metrics.latencyMs}ms, Packet loss at ${metrics.packetLossPct.toFixed(2)}%`,
        eventType: 'success',
      };
    })(),
    STABILIZED: {
      event: 'Network Stabilized',
      details: 'Performance metrics stable',
      impact: 'High-priority task fully protected',
      eventType: 'success',
    },
    MEETING_ENDED: {
      event: 'Task Priority Changed',
      details: device1 ? `Device ${device1.name} returned to ${device1.intent}` : 'High-priority task ended',
      impact: 'High-priority task ended',
      eventType: 'normal',
    },
    SWITCH_BACK_INITIATED: {
      event: 'Returning to FWA',
      details: 'Switching back to FWA Slice',
      impact: 'Restoring standard network configuration',
      eventType: 'optimization',
    },
    SWITCH_BACK_COMPLETED: {
      event: 'FWA Slice Resumed',
      details: 'Now on FWA Slice',
      impact: 'Network returned to standard mode',
      eventType: 'normal',
    },
  };

  const translation = eventTranslations[event];
  if (!translation) return null;

  return {
    timestamp: Date.now(),
    event: translation.event,
    details: translation.details,
    impact: translation.impact,
    eventType: translation.eventType,
  };
}

/**
 * Gets current status message for the status bar
 * Only shows 4 key events for clarity
 */
function getStatusMessage(lastEvent, state) {
  if (!state) return 'Initializing...';

  // Only show these 4 key events
  const statusMessages = {
    MEETING_DETECTED: 'High-priority task detected',
    SWITCH_COMPLETED: 'Network switched to optimized slice',
    MEETING_ENDED: 'High-priority task ended',
    SWITCH_BACK_COMPLETED: 'Network switched to FWA slice',
  };

  if (lastEvent && statusMessages[lastEvent]) {
    return statusMessages[lastEvent];
  }

  // Default status based on current state (only show when no active event)
  if (state.currentSlice === 'video') {
    return 'Network optimized for real-time tasks';
  }

  return 'All devices operating normally';
}

export default function DemoSection({ variant } = {}) {
  // const { state, series, markers, metrics, lastEvent } = useTelemetryStream();
  // const { state, series, markers, metrics, lastEvent } = useTelemetryStream({ source: getSource() });
  const { state, series, markers, metrics, lastEvent } = useTelemetry();

  const [eventLog, setEventLog] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [statusChanged, setStatusChanged] = useState(false);
  const lastEventRef = useRef(null);
  const lastStatusEventRef = useRef(null);
  const lastStatusMessageRef = useRef('Initializing...');
  const statusUpdateTimeRef = useRef(0);
  const statusUpdateTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const baselineMetricsRef = useRef(null);

  // Minimum time to hold a status message before allowing change (5 seconds)
  // Note: Key events can override this to stay in sync with actual events
  const STATUS_HOLD_MS = 5000;

  // Accumulate events from telemetry stream
  useEffect(() => {
    if (state && !hasInitializedRef.current) {
      // Add initial "Normal Operation" event when stream starts
      hasInitializedRef.current = true;
      const initialEntry = {
        timestamp: Date.now(),
        event: 'Normal Operation',
        details: 'All devices low priority',
        impact: 'Standard network configuration',
        eventType: 'normal',
      };
      setEventLog([initialEntry]);
    }

    if (lastEvent && lastEvent !== lastEventRef.current) {
      // Capture baseline when high-priority task detected (pre-optimization metrics)
      // SWITCH_INITIATED is not emitted by simulator (same tick as MEETING_DETECTED)
      if (lastEvent === 'MEETING_DETECTED' && metrics) {
        baselineMetricsRef.current = {
          latencyMs: metrics.latencyMs,
          jitterMs: metrics.jitterMs,
          packetLossPct: metrics.packetLossPct,
        };
      }
      // Clear baseline when switching back to normal (Option A: hide deltas)
      if (lastEvent === 'SWITCH_BACK_COMPLETED') {
        baselineMetricsRef.current = null;
      }
      lastEventRef.current = lastEvent;
      const baseline = lastEvent === 'SWITCH_COMPLETED' ? baselineMetricsRef.current : null;
      const logEntry = translateEvent(lastEvent, state, metrics, baseline);
      if (logEntry) {
        setEventLog((prev) => [...prev, logEntry]);
      }
    }
  }, [lastEvent, state, metrics]);

  // Update status message when events occur (with hold time and delay)
  // Only updates on the 4 key events: MEETING_DETECTED, SWITCH_COMPLETED, MEETING_ENDED, SWITCH_BACK_COMPLETED
  useEffect(() => {
    if (!state) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - statusUpdateTimeRef.current;
    const newMessage = getStatusMessage(lastEvent, state);
    const isNewEvent = lastEvent && lastEvent !== lastStatusEventRef.current;
    const isStatusChange = newMessage !== lastStatusMessageRef.current;
    const isInitialLoad = statusUpdateTimeRef.current === 0;

    // Only process the 4 key events
    const keyEvents = ['MEETING_DETECTED', 'SWITCH_COMPLETED', 'MEETING_ENDED', 'SWITCH_BACK_COMPLETED'];
    const isKeyEvent = lastEvent && keyEvents.includes(lastEvent);
    const wasKeyEvent = lastStatusEventRef.current && keyEvents.includes(lastStatusEventRef.current);
    const transitioningFromEvent = wasKeyEvent && !lastEvent;

    // Clear any pending timeout
    if (statusUpdateTimeoutRef.current) {
      clearTimeout(statusUpdateTimeoutRef.current);
      statusUpdateTimeoutRef.current = null;
    }

    // Update logic:
    // 1. Initial load: update immediately
    // 2. New key event: update immediately (override hold time to stay in sync)
    // 3. Transitioning from event to no event: only update if hold time has passed
    const isNewKeyEvent = isNewEvent && isKeyEvent;
    const canUpdateDefault = isInitialLoad || timeSinceLastUpdate >= STATUS_HOLD_MS;
    const shouldUpdate = isInitialLoad || isNewKeyEvent || (transitioningFromEvent && isStatusChange && canUpdateDefault);

    if (isNewKeyEvent) {
      lastStatusEventRef.current = lastEvent;
    } else if (transitioningFromEvent) {
      // Clear the last event ref when transitioning to no event
      lastStatusEventRef.current = null;
    }

    if (shouldUpdate) {
      // Key events update immediately (no delay) to stay in sync
      // Default status updates respect hold time
      if (isNewKeyEvent || isInitialLoad) {
        // Update immediately for key events
        lastStatusMessageRef.current = newMessage;
        setStatusMessage(newMessage);
        statusUpdateTimeRef.current = Date.now();
        
        // Trigger change animation (skip on initial load)
        if (!isInitialLoad) {
          setStatusChanged(true);
          setTimeout(() => setStatusChanged(false), 800);
        }
      } else if (transitioningFromEvent && canUpdateDefault) {
        // Update default status after hold time
        lastStatusMessageRef.current = newMessage;
        setStatusMessage(newMessage);
        statusUpdateTimeRef.current = Date.now();
        
        // Trigger change animation
        setStatusChanged(true);
        setTimeout(() => setStatusChanged(false), 800);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, [lastEvent, state]);

  return (
    <section className="demo-section">
      <div className={`demo-status-bar ${statusChanged ? 'status-changed' : ''}`}>
        <span className="demo-status-label">Status:</span> {statusMessage}
      </div>

      <div className="demo-content-grid">
        {/* Left Column: Work Flow + Quality Chart */}
        <div className="demo-left-column">
          <div className="demo-workflow-card">
            <WorkflowDiagram state={state} variant={variant} />
          </div>

          <div className="demo-quality-card">
            <QualityVariationChart series={series} markers={markers} />
          </div>
        </div>

        {/* Right Column: Technical Data */}
        <div className="demo-right-column">
          <div className="demo-metrics-card">
            <TechnicalMetricsPanel
              metrics={metrics}
              baseline={state?.currentSlice === 'video' ? baselineMetricsRef.current : null}
            />
          </div>
        </div>
      </div>

      {/* Event Log - Full width below demo content */}
      <EventLog events={eventLog} />
    </section>
  );
}
