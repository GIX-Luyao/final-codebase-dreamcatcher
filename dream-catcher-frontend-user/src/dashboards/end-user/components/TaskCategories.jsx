import React from 'react'
import './TaskCategories.css'

function TaskCategories() {
  const categories = [
    {
      name: 'Work',
      icon: '💼',
      goal: 'Prioritize video calls',
      description: 'Ensures video conferencing and collaboration tools receive optimal bandwidth and low latency.',
      color: '#000000'
    },
    {
      name: 'Games',
      icon: '🎮',
      goal: 'Minimize lag and ping',
      description: 'Optimizes network for real-time gaming, reducing latency and packet loss for competitive play.',
      color: '#10b981'
    }
  ]

  return (
    <div className="task-categories">
      <h2 className="section-title">Task Categories</h2>
      <p className="section-subtitle">How the system decides what to optimize</p>
      <div className="categories-list">
        {categories.map((category, index) => (
          <div key={index} className="category-card">
            <div className="category-header">
              <div className="category-icon">
                <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
              </div>
              <div className="category-info">
                <h3 className="category-name">{category.name}</h3>
                <p className="category-goal">Goal: {category.goal}</p>
              </div>
            </div>
            <p className="category-description">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskCategories

