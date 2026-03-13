import React, { useState } from 'react'
import Sidebar from './Sidebar'
import DashboardHeader from './DashboardHeader'
import Workflow from './Workflow'
import Metrics from './Metrics'
import PriorityList from './PriorityList'
import EventLog from './EventLog'
import './Dashboard.css'

function Dashboard() {
  const [smartMode, setSmartMode] = useState(true)

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard">
        <DashboardHeader />

        <div className="dashboard-content">
          <div className="dashboard-left-column">
            <Workflow smartMode={smartMode} onSmartModeChange={setSmartMode} />
            <Metrics smartMode={smartMode} />
          </div>
          
          <div className="dashboard-right-column">
            <PriorityList />
          </div>
        </div>

        <div className="dashboard-bottom-section">
          <EventLog />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
