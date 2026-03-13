import React from 'react'
import './CurrentActivity.css'

function CurrentActivity() {
  return (
    <div className="current-activity">
      <h2 className="section-title">Current Activity</h2>
      
      <div className="activity-status">
        <div className="status-indicator-live">
          <span className="pulse-dot"></span>
          <span className="status-text-live">Live</span>
        </div>
      </div>

      <div className="activity-main">
        <div className="activity-icon-wrapper">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 10l5 5-5 5"></path>
            <path d="M4 4v7a4 4 0 0 0 4 4h12"></path>
          </svg>
        </div>
        <div className="activity-info">
          <span className="activity-type">Video Conference</span>
          <span className="activity-priority-badge">High Priority</span>
        </div>
      </div>

      <p className="activity-description">
        Network is optimized for your online meeting with dedicated bandwidth allocation.
      </p>

      <div className="activity-slice-card">
        <div className="slice-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <circle cx="12" cy="20" r="1"></circle>
          </svg>
        </div>
        <div className="slice-info">
          <span className="slice-label">Active Network Slice</span>
          <span className="slice-value">Video Conferencing Slice</span>
        </div>
        <div className="slice-status">
          <span className="slice-status-dot"></span>
          Active
        </div>
      </div>

      <div className="activity-stats">
        <div className="stat-item">
          <span className="stat-value">45 Mbps</span>
          <span className="stat-label">Allocated</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">12ms</span>
          <span className="stat-label">Latency</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">0%</span>
          <span className="stat-label">Packet Loss</span>
        </div>
      </div>
    </div>
  )
}

export default CurrentActivity
