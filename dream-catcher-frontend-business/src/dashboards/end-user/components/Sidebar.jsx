import React from 'react'
import './Sidebar.css'

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📡</div>
        <span className="logo-text">Smart Router</span>
      </div>
      
      <nav className="sidebar-nav">
        <a href="#" className="nav-item nav-active">
          <span className="nav-dot"></span>
          <span>Dashboard</span>
        </a>
        <a href="#" className="nav-item">
          <span>Network Status</span>
        </a>
        <a href="#" className="nav-item">
          <span>Performance</span>
        </a>
        <a href="#" className="nav-item">
          <span>Settings</span>
        </a>
        <a href="#" className="nav-item">
          <span>Activity Log</span>
        </a>
        <a href="#" className="nav-item">
          <span>Analytics</span>
        </a>
      </nav>

      <div className="sidebar-motivation">
        <div className="motivation-box">
          <p>Stay Connected! Your network is optimized for peak performance.</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
