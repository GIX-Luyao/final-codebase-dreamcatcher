import React from 'react'
import './Workflow.css'

function Workflow({ smartMode, onSmartModeChange }) {
  return (
    <div className="workflow-section">
      <div className="workflow-header">
        <h2 className="section-title">Workflow</h2>
        <div className="smart-mode-toggle">
          <span className="smart-mode-label">Smart Mode</span>
          <button
            className={`smart-mode-switch ${smartMode ? 'active' : ''}`}
            onClick={() => onSmartModeChange(!smartMode)}
            aria-label="Toggle Smart Mode"
          >
            <span className="smart-mode-dot"></span>
          </button>
        </div>
      </div>
      {smartMode ? (
        <>
          <p className="workflow-intro">
            Your router automatically detects active tasks, assigns priority, and applies the right network slice for the best experience.
          </p>
          <div className="workflow-flow">
            <div className="workflow-card">
              <div className="workflow-card-header">
                <div className="workflow-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <h3 className="workflow-card-title">Step1 Task Detected</h3>
              </div>
              <div className="workflow-card-divider"></div>
              <p className="workflow-card-description">Conversational Real-Time</p>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-card">
              <div className="workflow-card-header">
                <div className="workflow-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <h3 className="workflow-card-title">Step2 Priority Identified</h3>
              </div>
              <div className="workflow-card-divider"></div>
              <p className="workflow-card-description">High Priority</p>
            </div>
            
            <div className="workflow-arrow">→</div>
            
            <div className="workflow-card">
              <div className="workflow-card-header">
                <div className="workflow-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                  </svg>
                </div>
                <h3 className="workflow-card-title">Step3 Smart Mode</h3>
              </div>
              <div className="workflow-card-divider"></div>
              <p className="workflow-card-description">Intent Based Routing</p>
            </div>
          </div>
        </>
      ) : (
        <p className="workflow-standard-mode">
          Your router is running in standard mode.
        </p>
      )}
    </div>
  )
}

export default Workflow
