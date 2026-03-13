import React from 'react'
import './PriorityList.css'

function PriorityList() {
  const priorities = [
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
      examples: ['system updates', 'etc']
    }
  ]

  return (
    <div className="priority-list-section">
      <h2 className="section-title">How Tasks Are Prioritized</h2>
      <div className="priority-list">
        {priorities.map((item) => (
          <div key={item.priority} className="priority-list-item">
            <div className="priority-list-header">
              <span className="priority-list-number">Priority {item.priority}</span>
              <span className="priority-list-title">{item.title}</span>
            </div>
            <div className="priority-list-examples">
              {item.examples.map((example, index) => (
                <span key={index} className="priority-list-example">
                  {example}
                  {index < item.examples.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PriorityList
