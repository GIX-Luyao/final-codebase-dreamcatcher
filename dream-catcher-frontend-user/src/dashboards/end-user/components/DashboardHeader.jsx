import React from 'react'
import './DashboardHeader.css'

function DashboardHeader() {
  return (
    <div className="dashboard-header-new">
      <div className="header-content">
        <h1 className="header-title">
          👋 Welcome back! Your router's quality is <span className="header-quality">EXCELLENT</span>
        </h1>
      </div>
    </div>
  )
}

export default DashboardHeader
