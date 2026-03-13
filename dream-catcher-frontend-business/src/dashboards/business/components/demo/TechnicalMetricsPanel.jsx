import React from 'react';
import './TechnicalMetricsPanel.css';

/**
 * TechnicalMetricsPanel component
 * 
 * @param {Object} props
 * @param {Object|null} props.metrics - { latencyMs, jitterMs, packetLossPct, qualityScore, throughputMbps? }
 * @param {Object|null} props.baseline - Pre-optimization baseline metrics { latencyMs, jitterMs, packetLossPct }
 */
export default function TechnicalMetricsPanel({ metrics, baseline }) {
  if (!metrics) {
    return (
      <div className="technical-metrics-panel">
        <h2 className="technical-metrics-panel-title">Technical Data</h2>
        <div className="metrics-placeholder">
          <p>Waiting for telemetry...</p>
        </div>
      </div>
    );
  }

  // Calculate delta percentage from baseline
  // Formula: ((baseline - current) / baseline) * 100
  // For lower-is-better metrics, positive delta = improvement
  const calculateDelta = (current, baselineValue) => {
    if (!baseline || !Number.isFinite(baselineValue) || baselineValue === 0) return null;
    if (!Number.isFinite(current)) return null;
    return ((baselineValue - current) / baselineValue) * 100;
  };

  const latencyDelta = calculateDelta(metrics.latencyMs, baseline?.latencyMs);
  const jitterDelta = calculateDelta(metrics.jitterMs, baseline?.jitterMs);
  const packetLossDelta = calculateDelta(metrics.packetLossPct, baseline?.packetLossPct);

  const displayDelta = (delta) => {
    if (!Number.isFinite(delta)) return null;
    // Delta is already positive for improvements (baseline - current for lower-is-better)
    const className = delta > 0 ? 'positive' : 'negative';
    const sign = delta > 0 ? '↓' : '↑';
    
    return {
      text: `${sign}${Math.abs(delta).toFixed(1)}%`,
      className
    };
  };

  const latencyDeltaDisplay = displayDelta(latencyDelta);
  const jitterDeltaDisplay = displayDelta(jitterDelta);
  const packetLossDeltaDisplay = displayDelta(packetLossDelta);

  return (
    <div className="technical-metrics-panel">
      <h2 className="technical-metrics-panel-title">Technical Data</h2>
      {baseline && (
        <p className="metrics-baseline-label">vs. before optimization</p>
      )}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Latency</div>
          <div className="metric-value">
            {Math.round(metrics.latencyMs)} <span className="metric-unit">ms</span>
          </div>
          {latencyDeltaDisplay ? (
            <div className={`metric-delta ${latencyDeltaDisplay.className}`}>
              {latencyDeltaDisplay.text}
            </div>
          ) : (
            <div className="metric-delta metric-delta-empty">—</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-label">Jitter</div>
          <div className="metric-value">
            {Math.round(metrics.jitterMs)} <span className="metric-unit">ms</span>
          </div>
          {jitterDeltaDisplay ? (
            <div className={`metric-delta ${jitterDeltaDisplay.className}`}>
              {jitterDeltaDisplay.text}
            </div>
          ) : (
            <div className="metric-delta metric-delta-empty">—</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-label">Packet Loss</div>
          <div className="metric-value">
            {metrics.packetLossPct.toFixed(2)} <span className="metric-unit">%</span>
          </div>
          {packetLossDeltaDisplay ? (
            <div className={`metric-delta ${packetLossDeltaDisplay.className}`}>
              {packetLossDeltaDisplay.text}
            </div>
          ) : (
            <div className="metric-delta metric-delta-empty">—</div>
          )}
        </div>
      </div>
    </div>
  );
}