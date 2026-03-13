import React, { useState, useEffect } from 'react'
import { useTelemetry } from '../../../shared/context/TelemetryContext'
import './Metrics.css'

function Metrics({ smartMode = true }) {
  const { metrics, isRunning } = useTelemetry()
  // Standard mode: rating guide expanded by default. Smart mode: collapsed by default.
  const [criteriaExpanded, setCriteriaExpanded] = useState(() => !smartMode)

  // Sync expansion with mode: standard = expanded, smart = collapsed
  useEffect(() => {
    setCriteriaExpanded(!smartMode)
  }, [smartMode])

  const getLatencyStatus = (latencyMs) => {
    if (!latencyMs) return 'Unknown'
    if (latencyMs <= 30) return 'Good'
    if (latencyMs <= 50) return 'Fair'
    return 'Poor'
  }

  const getJitterStatus = (jitter) => {
    if (!jitter) return 'Unknown'
    if (jitter <= 5) return 'Good'
    if (jitter <= 10) return 'Fair'
    return 'Poor'
  }

  const getPacketLossStatus = (packetLossPct) => {
    if (!packetLossPct && packetLossPct !== 0) return 'Unknown'
    if (packetLossPct <= 0.5) return 'Good'
    if (packetLossPct <= 1) return 'Fair'
    return 'Poor'
  }

  // Loading state: stream not yet running or no first tick received
  if (!isRunning || !metrics) {
    return (
      <div className="metrics-section">
        <h2 className="section-title">Metrics</h2>
        <p className="metrics-intro">
          Real network performance measurements. Values update in real time.
        </p>
        <div className="metrics-grid">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="metric-card">
              <div className="metric-header">
                <span className="metric-label">Loading...</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-number">--</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const { throughputMbps, latencyMs, packetLossPct, jitterMs } = metrics

  const metricCards = [
    {
      label: 'Throughput',
      value: throughputMbps != null ? throughputMbps.toFixed(0) : '-',
      unit: 'Mbps',
    },
    {
      label: 'Latency',
      value: latencyMs != null ? latencyMs.toFixed(0) : '-',
      unit: 'ms',
      status: latencyMs != null ? getLatencyStatus(latencyMs) : 'Offline',
    },
    {
      label: 'Jitter',
      value: jitterMs != null ? parseFloat(jitterMs).toFixed(1) : '-',
      unit: 'ms',
      status: jitterMs != null ? getJitterStatus(parseFloat(jitterMs)) : 'Offline',
    },
    {
      label: 'Packet Loss',
      value: packetLossPct != null ? packetLossPct.toFixed(1) : '-',
      unit: '%',
      status: getPacketLossStatus(packetLossPct),
    },
  ]

  return (
    <div className="metrics-section">
      <div className="metrics-header-row">
        <h2 className="section-title">Metrics</h2>
        <span className="metrics-updated">Live</span>
      </div>
      <p className="metrics-intro">
        Real network performance measurements. Values update in real time.
      </p>
      <div className="metrics-grid">
        {metricCards.map((metric) => (
          <div key={metric.label} className="metric-card metric-card-updating">
            <div className="metric-header">
              <span className="metric-label">{metric.label}</span>
              {metric.status ? (
                <span className={`metric-status metric-status-${(metric.status || '').toLowerCase()}`}>{metric.status}</span>
              ) : null}
            </div>
            <div className="metric-value-row">
              <span className="metric-number metric-number-fade">{metric.value}</span>
              <span className="metric-unit">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="metrics-criteria">
        <button
          type="button"
          className="metrics-criteria-toggle"
          onClick={() => setCriteriaExpanded((e) => !e)}
          aria-expanded={criteriaExpanded}
        >
          <span className="metrics-criteria-title">Rating guide</span>
          <span className="metrics-criteria-chevron" aria-hidden>
            {criteriaExpanded ? '▼' : '▶'}
          </span>
        </button>
        {criteriaExpanded && (
          <div className="metrics-criteria-table-wrap">
            <table className="metrics-criteria-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="th-good">Good</th>
                  <th className="th-fair">Fair</th>
                  <th className="th-poor">Poor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Latency</td>
                  <td>≤30 ms</td>
                  <td>≤50 ms</td>
                  <td>&gt;50 ms</td>
                </tr>
                <tr>
                  <td>Jitter</td>
                  <td>≤5 ms</td>
                  <td>≤10 ms</td>
                  <td>&gt;10 ms</td>
                </tr>
                <tr>
                  <td>Packet Loss</td>
                  <td>≤0.5%</td>
                  <td>≤1%</td>
                  <td>&gt;1%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Metrics
