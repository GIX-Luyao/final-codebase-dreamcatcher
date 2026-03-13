import React from 'react'
import tMobileLogo from '../../../assets/images/t-mobile-logo.png'
import './Sidebar.css'

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={tMobileLogo} alt="T-Mobile" className="sidebar-logo-img" />
      </div>
      
      <nav className="sidebar-nav">
        <a href="#" className="nav-item nav-active">
          <span className="nav-dot"></span>
          <span>Overview</span>
        </a>
        <a href="#" className="nav-item">
          <span>Settings</span>
        </a>
      </nav>
    </div>
  )
}

export default Sidebar
