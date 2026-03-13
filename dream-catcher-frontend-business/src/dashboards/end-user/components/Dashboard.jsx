import React from 'react'
import Sidebar from './Sidebar'
import SystemStatus from './SystemStatus'
import ActivityOverview from './ActivityOverview'
import NetworkPriority from './NetworkPriority'
import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Welcome back! 👋</h1>
          <p className="dashboard-subtitle">Your network is optimized and running smoothly</p>
          <SystemStatus />
        </header>

        <div className="dashboard-content">
          <ActivityOverview />
          
          <div className="dashboard-section">
            <NetworkPriority />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
