import React, { useState } from 'react'
import './SystemStatus.css'

function SystemStatus() {
  const [hoveredTooltip, setHoveredTooltip] = useState(null)

  const tooltips = {
    router: {
      title: 'What is Router Status?',
      content: 'Indicates whether your 5G router is operational and connected. When running, all network features are active.'
    },
    optimization: {
      title: 'What is Network Optimization?',
      content: 'Automatically manages network traffic to ensure best performance for high-priority tasks and protect important activities from congestion.'
    },
    mode: {
      title: 'What is Optimization Mode?',
      content: 'Determines how your router prioritizes traffic. Automatic uses AI to detect and prioritize tasks, while Custom lets you set your own rules.'
    }
  }

  return (
    <div className="system-status-inline">
      <span 
        className="status-inline-item status-with-tooltip"
        onMouseEnter={() => setHoveredTooltip('router')}
        onMouseLeave={() => setHoveredTooltip(null)}
      >
        <span className="status-indicator-inline status-active">
          <span className="status-pulse-inline"></span>
        </span>
        <span className="status-text">
          Router Status<span className="tooltip-icon">?</span>: <strong>Running</strong>
        </span>
        {hoveredTooltip === 'router' && (
          <div className="status-tooltip">
            <div className="tooltip-arrow"></div>
            <h3 className="tooltip-title">{tooltips.router.title}</h3>
            <p className="tooltip-content">{tooltips.router.content}</p>
          </div>
        )}
      </span>
      <span className="status-separator">•</span>
      <span 
        className="status-inline-item status-with-tooltip"
        onMouseEnter={() => setHoveredTooltip('optimization')}
        onMouseLeave={() => setHoveredTooltip(null)}
      >
        <span className="status-indicator-inline status-active">
          <span className="status-pulse-inline"></span>
        </span>
        <span className="status-text">
          Network Optimization<span className="tooltip-icon">?</span>: <strong>Active</strong>
        </span>
        {hoveredTooltip === 'optimization' && (
          <div className="status-tooltip">
            <div className="tooltip-arrow"></div>
            <h3 className="tooltip-title">{tooltips.optimization.title}</h3>
            <p className="tooltip-content">{tooltips.optimization.content}</p>
          </div>
        )}
      </span>
      <span className="status-separator">•</span>
      <span 
        className="status-inline-item status-with-tooltip"
        onMouseEnter={() => setHoveredTooltip('mode')}
        onMouseLeave={() => setHoveredTooltip(null)}
      >
        <span className="status-indicator-inline status-active">
          <span className="status-pulse-inline"></span>
        </span>
        <span className="status-text">
          Optimization Mode<span className="tooltip-icon">?</span>: <strong>Automatic</strong>
        </span>
        {hoveredTooltip === 'mode' && (
          <div className="status-tooltip">
            <div className="tooltip-arrow"></div>
            <h3 className="tooltip-title">{tooltips.mode.title}</h3>
            <p className="tooltip-content">{tooltips.mode.content}</p>
          </div>
        )}
      </span>
    </div>
  )
}

export default SystemStatus
