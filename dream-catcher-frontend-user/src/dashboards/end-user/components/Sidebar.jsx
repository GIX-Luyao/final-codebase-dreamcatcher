import React from 'react'
import './Sidebar.css'
import tmobileSidebarLogo from '../../../assets/tmobile-sidebar-logo.png'

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img
          src={tmobileSidebarLogo}
          alt="T-Mobile"
          className="sidebar-logo-image"
          style={{ width: '75%', height: 'auto', display: 'block' }}
        />
      </div>
      
      <nav className="sidebar-nav">
        <a href="#" className="nav-item nav-active">
          <span className="nav-dot"></span>
          <span>Dashboard</span>
        </a>
        <a href="#" className="nav-item">
          <span>Settings</span>
        </a>
      </nav>
    </div>
  )
}

export default Sidebar
