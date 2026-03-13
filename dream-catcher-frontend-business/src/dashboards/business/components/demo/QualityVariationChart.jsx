import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import './QualityVariationChart.css';

/**
 * QualityVariationChart component
 * 
 * @param {Object} props
 * @param {Array} props.series - Array of { timestamp: number, quality: number }
 * @param {Array} props.markers - Array of { type: 'before'|'after', timestamp: number, quality: number }
 */
export default function QualityVariationChart({ series = [], markers = [] }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="quality-chart-tooltip">
          <div className="quality-chart-tooltip-label">{`${Number(label).toFixed(1)}s ago`}</div>
          <div className="quality-chart-tooltip-item">
            Quality: {Number(payload[0].value).toFixed(1)}
          </div>
        </div>
      );
    }
    return null;
  };

  if (series.length === 0) {
    return (
      <div className="quality-chart">
        <div className="quality-chart-header">
          <h2 className="quality-chart-header-title">Connection Quality</h2>
        </div>
        <div className="quality-chart-placeholder">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Find the newest timestamp to calculate "seconds ago"
  const maxSeriesTs = series.reduce((max, p) => (p.timestamp > max ? p.timestamp : max), 0);
  const maxMarkerTs = markers.reduce((max, m) => (m.timestamp > max ? m.timestamp : max), 0);
  const newestTimestamp = Math.max(maxSeriesTs, maxMarkerTs, Date.now());  
  const WINDOW_SECONDS = 30;
  
  const chartDataRaw = series.map(point => ({
    ...point,
    secondsAgo: Math.round((newestTimestamp - point.timestamp) / 1000),
  }));
  
  const chartMarkersRaw = markers.map(marker => ({
    ...marker,
    secondsAgo: Math.max(0, Math.round((newestTimestamp - marker.timestamp) / 1000)),
  }));


  // const dataMaxSecondsAgo = chartDataRaw.reduce((max, p) => Math.max(max, p.secondsAgo), 0);
  // const xMax = Math.min(WINDOW_SECONDS, dataMaxSecondsAgo);

  const chartData = chartDataRaw
   .filter(p => p.secondsAgo >= 0 && p.secondsAgo <= WINDOW_SECONDS)
   .sort((a, b) => a.secondsAgo - b.secondsAgo);

  const chartMarkers = chartMarkersRaw
    .filter(m => m.secondsAgo <= WINDOW_SECONDS)
    .sort((a, b) => a.secondsAgo - b.secondsAgo);

  return (
    <div className="quality-chart">
      <div className="quality-chart-header">
        <h2 className="quality-chart-header-title">Connection Quality</h2>
        <div className="quality-chart-legend">
          <span className="quality-chart-legend-item">
            <span className="quality-chart-legend-line quality-chart-legend-line-before" aria-hidden="true" />
            Before switching
          </span>
          <span className="quality-chart-legend-item">
            <span className="quality-chart-legend-line quality-chart-legend-line-after" aria-hidden="true" />
            After switching
          </span>
        </div>
      </div>

      <div className="quality-chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 24 }}>
            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 3"
              vertical={true}
              horizontal={true}
            />
            <XAxis
              dataKey="secondsAgo"
              type="number"
              domain={[0, WINDOW_SECONDS]}
              reversed
              tickFormatter={(v) => `${Math.round(v)}s`}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              label={{ 
                value: 'Seconds Ago', 
                position: 'insideBottom', 
                offset: -6,
                style: { fill: 'var(--color-text-secondary)', fontSize: 12 }
              }}
            />
            <YAxis 
              label={{ 
                value: 'Quality Score', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'var(--color-text-secondary)', fontSize: 12 }
              }}
              domain={[0,100]}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="quality"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {chartMarkers.map((marker, index) => {
              const isBefore = marker.type === 'before';
              return (
                <ReferenceLine
                  key={`${marker.type}-${marker.index ?? index}`}
                  x={Number(marker.secondsAgo)}
                  stroke={isBefore ? 'var(--color-text-muted)' : 'var(--color-primary)'}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
