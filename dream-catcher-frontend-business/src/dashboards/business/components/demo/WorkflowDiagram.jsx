import React, { useState } from 'react';
import routerImage from '../../../../assets/images/router.png';
import deviceIcon from '../../../../assets/images/devices-icon.svg';
import './WorkflowDiagram.css';

/**
 * Priority rules data (same as end-user dashboard)
 */
const priorityRules = [
  {
    priority: 1,
    title: 'Conversational Real-time',
    examples: ['calls', 'voice call', 'FaceTime']
  },
  {
    priority: 2,
    title: 'Interactive Workflows',
    examples: ['AI-assisted workflows', 'real-time editing', 'Figma collaboration', 'cloud coding']
  },
  {
    priority: 3,
    title: 'Interactive Entertainment',
    examples: ['gaming', 'live streaming', 'AR/VR']
  },
  {
    priority: 4,
    title: 'Buffered Consumption',
    examples: ['media streaming', 'browsing', 'social media']
  },
  {
    priority: 5,
    title: 'Background',
    examples: ['system updates', 'etc.']
  }
];

// Hexagon path (flat top), center (cx,cy), radius r
function hexagonPath(cx, cy, r) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

/**
 * Network graph: devices left, router center, slices right; animated flow on active edges (no arrows).
 */
function WorkflowNetworkGraph({ devices = [], currentSlice = 'normal' }) {
  const width = 600;
  const height = 130;
  const deviceCardW = 50;
  const deviceCardH = 26;
  const routerHexR = 30;
  const sliceCardW = 62;
  const sliceCardH = 36;

  const deviceCount = Math.max(1, devices.length);
  const deviceX = 80;
  const routerX = width / 2;
  const routerY = height / 2;
  const sliceX = width - 80;

  const deviceYs = Array.from(
    { length: deviceCount },
    (_, i) => (height * (i + 1)) / (deviceCount + 1)
  );

  const slicePositions = [
    { id: 'optimized', x: sliceX, y: height * 0.35, label: 'Optimized' },
    { id: 'fwa', x: sliceX, y: height * 0.65, label: 'FWA' },
  ];

  const deviceRight = (x, y) => [x + deviceCardW / 2, y];
  const routerLeft = () => [routerX - routerHexR, routerY];
  const routerRight = () => [routerX + routerHexR, routerY];
  const sliceLeft = (s) => [s.x - sliceCardW / 2, s.y];

  const pathD = (x1, y1, x2, y2) => `M ${x1} ${y1} L ${x2} ${y2}`;

  return (
    <div className="workflow-network-graph">
      <div className="workflow-network-live" aria-hidden="true">
        <span className="workflow-network-live-dot" />
        <span className="workflow-network-live-text">LIVE</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="workflow-network-svg"
        aria-label="Real-time network view: devices, router, and slices"
      >
        <defs>
          <pattern id="workflow-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.4" />
          </pattern>
          <linearGradient id="workflow-edge-gradient" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#E20074" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#E20074" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF4DA6" stopOpacity="1" />
          </linearGradient>
          <filter id="workflow-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#workflow-grid)" aria-hidden="true" />

        {/* Inactive edges */}
        {deviceYs.map((y, i) => {
          const device = devices[i];
          const active = device?.priority === 'high';
          if (active) return null;
          const [x1, y1] = deviceRight(deviceX, y);
          const [x2, y2] = routerLeft();
          return (
            <path key={`edge-device-${i}`} d={pathD(x1, y1, x2, y2)} className="workflow-edge-baseline" fill="none" strokeWidth="1" />
          );
        })}
        {slicePositions.map((slice) => {
          const active =
            (slice.id === 'optimized' && currentSlice === 'video') ||
            (slice.id === 'fwa' && currentSlice === 'normal');
          if (active) return null;
          const [x1, y1] = routerRight();
          const [x2, y2] = sliceLeft(slice);
          return (
            <path key={`edge-slice-${slice.id}`} d={pathD(x1, y1, x2, y2)} className="workflow-edge-baseline" fill="none" strokeWidth="1" />
          );
        })}

        {/* Active edges: track + animated flow (no arrows) */}
        {deviceYs.map((y, i) => {
          const device = devices[i];
          const active = device?.priority === 'high';
          if (!active) return null;
          const [x1, y1] = deviceRight(deviceX, y);
          const [x2, y2] = routerLeft();
          const d = pathD(x1, y1, x2, y2);
          return (
            <g key={`edge-device-active-${i}`}>
              <path d={d} className="workflow-edge-track" fill="none" strokeWidth="2.5" />
              <path d={d} className="workflow-edge-flow" fill="none" strokeWidth="1.5" strokeDasharray="8 6" strokeLinecap="round" />
            </g>
          );
        })}
        {slicePositions.map((slice) => {
          const active =
            (slice.id === 'optimized' && currentSlice === 'video') ||
            (slice.id === 'fwa' && currentSlice === 'normal');
          if (!active) return null;
          const [x1, y1] = routerRight();
          const [x2, y2] = sliceLeft(slice);
          const d = pathD(x1, y1, x2, y2);
          return (
            <g key={`edge-slice-active-${slice.id}`}>
              <path d={d} className="workflow-edge-track" fill="none" strokeWidth="2.5" />
              <path d={d} className="workflow-edge-flow" fill="none" strokeWidth="1.5" strokeDasharray="8 6" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Nodes: devices (left – cards) */}
        {deviceYs.map((y, i) => {
          const device = devices[i];
          const isHigh = device?.priority === 'high';
          const bx = deviceX - deviceCardW / 2;
          const by = y - deviceCardH / 2;
          return (
            <g key={`node-device-${i}`} className="workflow-node">
              {isHigh && (
                <rect x={bx - 3} y={by - 3} width={deviceCardW + 6} height={deviceCardH + 6} rx="5" fill="none" stroke="rgba(226, 0, 116, 0.3)" strokeWidth="1" className="workflow-node-pulse-ring" />
              )}
              <rect x={bx} y={by} width={deviceCardW} height={deviceCardH} rx="4" className={`workflow-node-card workflow-node-device ${isHigh ? 'active' : ''}`} />
              <text x={deviceX} y={y - 3} textAnchor="middle" className="workflow-node-card-title workflow-node-device-title">
                {device?.name || `Device ${i + 1}`}
              </text>
              <text x={deviceX} y={y + 6} textAnchor="middle" className="workflow-node-card-sub">
                {device?.app || 'idle'}
              </text>
            </g>
          );
        })}

        {/* Node: router (hexagon) */}
        <g className="workflow-node">
          <path d={hexagonPath(routerX, routerY, routerHexR + 3)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" className="workflow-node-pulse-ring router-pulse" />
          <path d={hexagonPath(routerX, routerY, routerHexR)} className="workflow-node-hex workflow-node-router" />
          <text x={routerX} y={routerY - 1} textAnchor="middle" className="workflow-node-card-title">Router</text>
          <text x={routerX} y={routerY + 7} textAnchor="middle" className="workflow-node-card-sub">CORE</text>
        </g>

        {/* Nodes: slices (right – cards) */}
        {slicePositions.map((slice) => {
          const isActive =
            (slice.id === 'optimized' && currentSlice === 'video') ||
            (slice.id === 'fwa' && currentSlice === 'normal');
          const sx = slice.x - sliceCardW / 2;
          const sy = slice.y - sliceCardH / 2;
          return (
            <g key={`node-slice-${slice.id}`} className="workflow-node">
              {isActive && (
                <rect x={sx - 3} y={sy - 3} width={sliceCardW + 6} height={sliceCardH + 6} rx="5" fill="none" stroke="rgba(226, 0, 116, 0.3)" strokeWidth="1" className="workflow-node-pulse-ring" />
              )}
              <rect x={sx} y={sy} width={sliceCardW} height={sliceCardH} rx="4" className={`workflow-node-card workflow-node-slice ${isActive ? 'active' : ''}`} />
              <rect x={sx + 1} y={sy + 1} width={sliceCardW - 2} height="1.5" rx="1" className={`workflow-node-slice-accent ${isActive ? 'active' : ''}`} />
              <text x={slice.x} y={slice.y + 3} textAnchor="middle" className="workflow-node-card-title">
                {slice.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * WorkflowDiagram component
 * 
 * @param {Object} props
 * @param {Object|null} props.state - { devices: Array, currentSlice: 'normal'|'video', decisionStatus: 'idle'|'switching'|'stabilized' }
 *   - devices: Array of { id: string, name: string, app: string, intent: string, priority: 'high'|'medium'|'low' }
 *   - currentSlice: 'normal' | 'video'
 * @param {string} [props.variant] - Layout variant; Flow | Network toggle only shown when variant === 'd'
 */
const DEFAULT_VISIBLE_DEVICES = 2;
const VIEW_MODES = { flow: 'flow', network: 'network' };

export default function WorkflowDiagram({ state, variant }) {
  const [showRules, setShowRules] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODES.flow);

  const showNetworkView = variant === 'd';

  const handleSeeRulesClick = (e) => {
    e.stopPropagation();
    setShowRules(true);
  };

  const handleCloseRules = () => {
    setShowRules(false);
  };

  const handleToggleMoreDevices = (e) => {
    e.stopPropagation();
    setShowAllDevices((prev) => !prev);
  };

  if (!state) {
    return (
      <div className="workflow-diagram">
        <h2 className="workflow-section-title">Workflow</h2>
        <div className="workflow-placeholder">
          <p>Waiting for router state...</p>
        </div>
      </div>
    );
  }

  // Extract devices and currentSlice from telemetry state
  // All device data comes from telemetry - no hardcoded values
  const { devices = [], currentSlice = 'normal' } = state;

  // Sort devices by priority (high > medium > low); keep all for "more" count
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedDevices = [...devices].sort(
    (a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
  );

  const visibleCount = showAllDevices ? sortedDevices.length : DEFAULT_VISIBLE_DEVICES;
  const devicesToShow = sortedDevices.slice(0, visibleCount);
  const moreCount = sortedDevices.length - DEFAULT_VISIBLE_DEVICES;
  const hasMore = moreCount > 0;

  const isNetworkMode = showNetworkView && viewMode === VIEW_MODES.network;

  return (
    <div className="workflow-diagram">
      <div className="workflow-header">
        <h2 className="workflow-section-title">Workflow</h2>
        {showNetworkView && (
          <div className="workflow-view-toggle" role="tablist" aria-label="Workflow view">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === VIEW_MODES.flow}
              className={`workflow-view-toggle-btn ${viewMode === VIEW_MODES.flow ? 'active' : ''}`}
              onClick={() => setViewMode(VIEW_MODES.flow)}
            >
              Flow
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === VIEW_MODES.network}
              className={`workflow-view-toggle-btn ${viewMode === VIEW_MODES.network ? 'active' : ''}`}
              onClick={() => setViewMode(VIEW_MODES.network)}
            >
              Network
            </button>
          </div>
        )}
      </div>

      {isNetworkMode ? (
        <WorkflowNetworkGraph devices={sortedDevices} currentSlice={currentSlice} />
      ) : (
      <>
      <div className="workflow-columns">
        {/* Column 1: Devices & Intents */}
        <div className="workflow-column workflow-column-devices">
          <div className="workflow-column-title-wrapper">
            <div className="workflow-column-title">Devices & Intents</div>
            <button
              className="workflow-rules-info-icon"
              onClick={handleSeeRulesClick}
              aria-label="See priority rules"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
          <div className="workflow-devices-card">
            {sortedDevices.length === 0 ? (
              <div className="workflow-empty">No devices</div>
            ) : (
              devicesToShow.map((device, index) => {
                const isHighPriority = device.priority === 'high';
                return (
                  <div key={device.id} className={`workflow-device-row ${isHighPriority ? 'high-priority' : ''} ${index < devicesToShow.length - 1 ? 'has-divider' : ''}`}>
                    <div className="workflow-device-badge">
                      <img src={deviceIcon} alt="Device" className="workflow-device-icon" />
                    </div>
                    <div className="workflow-device-info">
                      <div className="workflow-device-app">
                        <span className="workflow-device-label">Active App:</span>
                        <span className="workflow-device-value">{device.app}</span>
                      </div>
                      <div className="workflow-device-intent">
                        <span className="workflow-device-label">Intent:</span>
                        <span className="workflow-device-value">
                          {device.intent}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {hasMore && (
            <button
              type="button"
              className="workflow-more-devices"
              onClick={handleToggleMoreDevices}
              aria-expanded={showAllDevices}
            >
              {showAllDevices ? 'Collapse' : `+${moreCount} Active Device${moreCount !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {/* Arrow between Devices and Router */}
        <div className="workflow-arrow">
          <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 10 L30 10 M30 10 L25 5 M30 10 L25 15" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Column 2: Router */}
        <div className="workflow-column workflow-column-router">
          <div className="workflow-column-title">Router</div>
          <div className="workflow-router-content">
            <img src={routerImage} alt="Router" className="workflow-router-image" />
          </div>
        </div>

        {/* Arrow between Router and Slice */}
        <div className="workflow-arrow">
          <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 10 L30 10 M30 10 L25 5 M30 10 L25 15" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Column 3: Slice Status */}
        <div className="workflow-column workflow-column-slice">
          <div className="workflow-column-title">Slice Status</div>
          <div className="workflow-slices-status">
            <div className={`workflow-slice-row ${currentSlice === 'video' ? 'is-active' : 'is-inactive'}`}>
              <span className="workflow-slice-indicator" aria-hidden="true" />
              <span className="workflow-slice-label">Optimized Slice</span>
            </div>
            <div className={`workflow-slice-row ${currentSlice === 'normal' ? 'is-active' : 'is-inactive'}`}>
              <span className="workflow-slice-indicator" aria-hidden="true" />
              <span className="workflow-slice-label">FWA Slice</span>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="workflow-rules-modal-overlay" onClick={handleCloseRules}>
          <div className="workflow-rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="workflow-rules-modal-header">
              <h3 className="workflow-rules-modal-title">Priority Rules</h3>
              <button className="workflow-rules-modal-close" onClick={handleCloseRules}>×</button>
            </div>
            <div className="workflow-rules-list">
              {priorityRules.map((rule) => (
                <div key={rule.priority} className="workflow-rule-item">
                  <div className="workflow-rule-header">
                    <span className="workflow-rule-priority">Priority {rule.priority}</span>
                    <span className="workflow-rule-title">{rule.title}:</span>
                  </div>
                  <div className="workflow-rule-examples">
                    {rule.examples.map((example, index) => (
                      <span key={index} className="workflow-rule-example">
                        {example}
                        {index < rule.examples.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
