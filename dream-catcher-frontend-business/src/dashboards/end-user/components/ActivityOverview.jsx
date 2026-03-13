import React from 'react'
import './ActivityOverview.css'

function ActivityOverview() {
  return (
    <div className="activity-overview">
      {/* Left Section - Current Activity */}
      <div className="activity-left">
        <h2 className="section-title">Current Activity</h2>
        
        <div className="activity-row">
          <div className="status-indicator-live">
            <span className="pulse-dot"></span>
            <span className="status-text-live">Live</span>
          </div>

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

        <div className="activity-slice-card">
          <div className="slice-header">
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
      </div>

      {/* Right Section - Performance (Pink Gradient) */}
      <div className="activity-right">
        <div className="metrics-background-icon">
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <circle cx="12" cy="20" r="1"></circle>
          </svg>
        </div>
        
        <div className="metrics-content">
          <div className="metrics-header">
            <svg className="shield-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
            <span className="metrics-label">Weekly Reliability</span>
          </div>
          
          <div className="metrics-value">
            <span className="metrics-number">98%</span>
          </div>
          
          <p className="metrics-description">
            Of your high-stakes tasks were automatically protected from congestion this week.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ActivityOverview
