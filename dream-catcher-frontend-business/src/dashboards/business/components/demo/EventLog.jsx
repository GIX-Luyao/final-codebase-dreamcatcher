import React, { useState } from 'react';
import './EventLog.css';

/**
 * EventLog component
 *
 * Displays a real-time log of telemetry events in stakeholder-friendly format.
 * Inline view shows last 10 events; expand icon opens a modal with the full log.
 *
 * @param {Object} props
 * @param {Array} props.events - Array of { timestamp, event, details, impact, eventType }
 */
export default function EventLog({ events = [] }) {
  const [showFullLog, setShowFullLog] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Inline: last 10 events, newest first (reverse chronological)
  const displayEvents = events.slice().reverse().slice(0, 10);
  // Full log: all events, newest first
  const fullEvents = events.slice().reverse();

  const renderTableBody = (eventList) =>
    eventList.map((event, index) => (
      <tr key={`${event.timestamp}-${index}`}>
        <td className="event-time">{formatTime(event.timestamp)}</td>
        <td className={`event-type ${event.eventType || 'normal'}`}>{event.event}</td>
        <td className="event-details">{event.details}</td>
        <td className="event-impact">{event.impact}</td>
      </tr>
    ));

  return (
    <div className="event-log-card">
      <div className="event-log-header-wrapper">
        <h3 className="event-log-header">Event Log</h3>
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
              <tbody>
                {renderTableBody(displayEvents)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Event Log modal */}
      {showFullLog && (
        <div
          className="event-log-modal-overlay"
          onClick={() => setShowFullLog(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-log-modal-title"
        >
          <div className="event-log-modal" onClick={(e) => e.stopPropagation()}>
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
                <p className="event-log-empty">No events yet. Monitoring network activity...</p>
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
                    <tbody>
                      {renderTableBody(fullEvents)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
