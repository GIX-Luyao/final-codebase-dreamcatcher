import React from 'react'
import './OptimizationLog.css'

function OptimizationLog() {
  const optimizations = [
    {
      id: 1,
      message: 'Prioritizing your Zoom call',
      time: 'Just now',
      type: 'real-time',
      icon: '⚡'
    },
    {
      id: 2,
      message: 'Adjusted background downloads for smooth streaming',
      time: '5 minutes ago',
      type: 'historical',
      icon: '📥'
    },
    {
      id: 3,
      message: 'Optimized network slice for video conference',
      time: '12 minutes ago',
      type: 'historical',
      icon: '🎥'
    },
    {
      id: 4,
      message: 'Reduced latency for gaming session',
      time: '1 hour ago',
      type: 'historical',
      icon: '🎮'
    }
  ]

  return (
    <div className="optimization-log">
      <h2 className="section-title">System Transparency</h2>
      <p className="section-subtitle">Recent network optimizations</p>
      <div className="log-container">
        {optimizations.map((optimization) => (
          <div 
            key={optimization.id} 
            className={`log-item ${optimization.type === 'real-time' ? 'log-item-active' : ''}`}
          >
            <div className="log-icon">{optimization.icon}</div>
            <div className="log-content">
              <p className="log-message">{optimization.message}</p>
              <span className="log-time">{optimization.time}</span>
            </div>
            {optimization.type === 'real-time' && (
              <div className="log-badge">Live</div>
            )}
          </div>
        ))}
      </div>
      <div className="log-footer">
        <p className="log-footer-text">
          The system is actively making intelligent decisions to protect your important activities.
        </p>
      </div>
    </div>
  )
}

export default OptimizationLog
