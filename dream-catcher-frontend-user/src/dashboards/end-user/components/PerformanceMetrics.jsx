import React from 'react'
import './PerformanceMetrics.css'

function PerformanceMetrics() {
  return (
    <div className="performance-metrics">
      <div className="metrics-card-gradient">
        <div className="metrics-background-icon">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
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

export default PerformanceMetrics
