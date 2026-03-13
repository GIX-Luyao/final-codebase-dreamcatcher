import React, { useState, useEffect, useRef } from 'react'
import { useTelemetry } from '../../../shared/context/TelemetryContext'
import './EventLog.css'

function translateEvent(event, state, metrics, baselineMetrics) {
  if (!event || !state) return null

  const devices = state.devices || []
  const device1 = devices.find(d => d.priority === 'high') || devices[0]

  const eventTranslations = {
    MEETING_DETECTED: {
      event: 'High-Priority Task Detected',
      details: device1
        ? `Your device started ${device1.app} (${device1.intent})`
        : 'High-priority task detected',
      impact: 'Initiating network optimisation',
      eventType: 'high-priority',
    },
    SWITCH_INITIATED: {
      event: 'Optimisation In Progress',
      details: `Switching to ${state.currentSlice === 'video' ? 'Optimised' : 'Standard'} network`,
      impact: 'Network is being tuned for your task',
      eventType: 'optimization',
    },
    SWITCH_COMPLETED: (() => {
      if (!metrics) return { event: 'Optimisation Complete', details: 'Network ready', impact: 'Your connection is optimised', eventType: 'success' }
      if (baselineMetrics) {
        const lat = `Latency ${baselineMetrics.latencyMs}ms → ${metrics.latencyMs}ms`
        const loss = `Packet loss ${baselineMetrics.packetLossPct.toFixed(2)}% → ${metrics.packetLossPct.toFixed(2)}%`
        const jit = baselineMetrics.jitterMs != null && metrics.jitterMs != null
          ? `Jitter ${baselineMetrics.jitterMs}ms → ${metrics.jitterMs}ms`
          : null
        const impact = [lat, jit, loss].filter(Boolean).join('; ')
        return { event: 'Optimisation Complete', details: `Now on ${state.currentSlice === 'video' ? 'Optimised' : 'Standard'} network`, impact, eventType: 'success' }
      }
      return {
        event: 'Optimisation Complete',
        details: `Now on ${state.currentSlice === 'video' ? 'Optimised' : 'Standard'} network`,
        impact: `Latency ${metrics.latencyMs}ms, Packet loss ${metrics.packetLossPct.toFixed(2)}%`,
        eventType: 'success',
      }
    })(),
    STABILIZED: {
      event: 'Connection Stabilised',
      details: 'Performance metrics stable',
      impact: 'Your task is fully protected',
      eventType: 'success',
    },
    MEETING_ENDED: {
      event: 'Task Priority Changed',
      details: device1 ? `Your device returned to ${device1.intent}` : 'High-priority task ended',
      impact: 'High-priority task ended',
      eventType: 'normal',
    },
    SWITCH_BACK_INITIATED: {
      event: 'Returning to Standard Network',
      details: 'Switching back to standard configuration',
      impact: 'Restoring standard network settings',
      eventType: 'optimization',
    },
    SWITCH_BACK_COMPLETED: {
      event: 'Standard Network Resumed',
      details: 'Back on standard network',
      impact: 'Network returned to normal mode',
      eventType: 'normal',
    },
  }

  const translation = eventTranslations[event]
  if (!translation) return null

  return {
    timestamp: Date.now(),
    event: translation.event,
    details: translation.details,
    impact: translation.impact,
    eventType: translation.eventType,
  }
}

function EventLog() {
  const { lastEvent, state, metrics } = useTelemetry()
  const [eventLog, setEventLog] = useState([])
  const [showFullLog, setShowFullLog] = useState(false)
  const lastEventRef = useRef(null)
  const baselineMetricsRef = useRef(null)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (state && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setEventLog([{
        timestamp: Date.now(),
        event: 'Normal Operation',
        details: 'All devices running at standard priority',
        impact: 'Standard network configuration active',
        eventType: 'normal',
      }])
    }

    if (lastEvent && lastEvent !== lastEventRef.current) {
      if (lastEvent === 'MEETING_DETECTED' && metrics) {
        baselineMetricsRef.current = {
          latencyMs: metrics.latencyMs,
          jitterMs: metrics.jitterMs,
          packetLossPct: metrics.packetLossPct,
        }
      }
      if (lastEvent === 'SWITCH_BACK_COMPLETED') {
        baselineMetricsRef.current = null
      }
      lastEventRef.current = lastEvent
      const baseline = lastEvent === 'SWITCH_COMPLETED' ? baselineMetricsRef.current : null
      const logEntry = translateEvent(lastEvent, state, metrics, baseline)
      if (logEntry) {
        setEventLog(prev => [...prev, logEntry])
      }
    }
  }, [lastEvent, state, metrics])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    const s = date.getSeconds().toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const displayEvents = eventLog.slice().reverse().slice(0, 10)
  const fullEvents = eventLog.slice().reverse()

  const renderTableBody = (list) =>
    list.map((entry, index) => (
      <tr key={`${entry.timestamp}-${index}`}>
        <td className="event-time">{formatTime(entry.timestamp)}</td>
        <td className={`event-type ${entry.eventType || 'normal'}`}>{entry.event}</td>
        <td className="event-details">{entry.details}</td>
        <td className="event-impact">{entry.impact}</td>
      </tr>
    ))

  return (
    <div className="event-log-section">
      <div className="event-log-header-wrapper">
        <h2 className="section-title">Event Log</h2>
        <button
          type="button"
          className="event-log-expand-icon"
          onClick={() => setShowFullLog(true)}
          aria-label="View full event log"
          title="View full event log"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" />
            <path d="M10 14L21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </button>
      </div>

      {displayEvents.length === 0 ? (
        <p className="event-log-empty">No events yet. Monitoring network activity...</p>
      ) : (
        <div className="event-log-table-wrapper">
          <div className="event-log-table-scroll">
            <table className="event-log-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Details</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>{renderTableBody(displayEvents)}</tbody>
            </table>
          </div>
        </div>
      )}

      {showFullLog && (
        <div
          className="event-log-modal-overlay"
          onClick={() => setShowFullLog(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-log-modal-title"
        >
          <div className="event-log-modal" onClick={e => e.stopPropagation()}>
            <div className="event-log-modal-header">
              <h3 id="event-log-modal-title" className="event-log-modal-title">Full Event Log</h3>
              <button
                type="button"
                className="event-log-modal-close"
                onClick={() => setShowFullLog(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="event-log-modal-body">
              {fullEvents.length === 0 ? (
                <p className="event-log-empty">No events yet.</p>
              ) : (
                <div className="event-log-modal-table-wrapper">
                  <table className="event-log-table event-log-modal-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Details</th>
                        <th>Impact</th>
                      </tr>
                    </thead>
                    <tbody>{renderTableBody(fullEvents)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventLog
