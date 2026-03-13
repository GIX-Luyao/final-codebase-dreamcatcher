import React, { useState } from 'react'
import './NetworkPriority.css'

function NetworkPriority() {
  const [mode, setMode] = useState('automatic')
  const [showRules, setShowRules] = useState(false)

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
      examples: ['system updates', 'IoT', 'household infrastructure']
    }
  ]

  const handleSeeRulesClick = (e) => {
    e.stopPropagation()
    setShowRules(true)
  }

  const handleCloseRules = () => {
    setShowRules(false)
  }

  return (
    <>
      <div className="network-priority">
        <h2 className="section-title">Network Priority Configuration</h2>
        <div className="priority-modes">
          <div 
            className={`mode-card ${mode === 'automatic' ? 'mode-active' : ''}`}
            onClick={() => setMode('automatic')}
          >
            <div className="mode-header">
              <div className="mode-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <div className="mode-title">
                <h3>Automatic</h3>
                <span className="mode-badge">Active</span>
              </div>
            </div>
            <p className="mode-description">
              The router automatically detects and prioritizes network traffic based on task type and importance. No manual configuration needed.
            </p>
            {mode === 'automatic' && (
              <div className="mode-status" onClick={handleSeeRulesClick}>
                <div className="status-dot"></div>
                <span className="see-rules-link">See Rules</span>
              </div>
            )}
          </div>

          <div 
            className={`mode-card ${mode === 'custom' ? 'mode-active' : ''}`}
            onClick={() => setMode('custom')}
          >
            <div className="mode-header">
              <div className="mode-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                </svg>
              </div>
              <div className="mode-title">
                <h3>Custom Rules</h3>
                <span className="mode-badge mode-badge-secondary">Inactive</span>
              </div>
            </div>
            <p className="mode-description">
              Define your own priority behaviors by task type. Set specific rules for how different activities should be handled.
            </p>
            {mode === 'custom' && (
              <div className="mode-status">
                <div className="status-dot"></div>
                <span>Configure Rules</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRules && (
        <div className="rules-modal-overlay" onClick={handleCloseRules}>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal-header">
              <h3 className="rules-modal-title">Priority Rules</h3>
              <button className="rules-modal-close" onClick={handleCloseRules}>×</button>
            </div>
            <div className="rules-list">
              {priorityRules.map((rule) => (
                <div key={rule.priority} className="rule-item">
                  <div className="rule-header">
                    <span className="rule-priority">Priority {rule.priority}</span>
                    <span className="rule-title">{rule.title}:</span>
                  </div>
                  <div className="rule-examples">
                    {rule.examples.map((example, index) => (
                      <span key={index} className="rule-example">
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
    </>
  )
}

export default NetworkPriority
