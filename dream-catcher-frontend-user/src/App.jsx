import React, { useState } from 'react'
import PrivacyLanding from './components/PrivacyLanding'
import EndUserApp from './dashboards/end-user/App'
import './App.css'
// import BusinessApp from './dashboards/business/App'  // 未来启用

function App() {
  const [showPrivacy, setShowPrivacy] = useState(true)
  const [showDashboard, setShowDashboard] = useState(false)

  const handlePrivacyContinue = () => {
    setShowPrivacy(false)
    // Delay dashboard appearance slightly for smooth transition
    setTimeout(() => {
      setShowDashboard(true)
    }, 100)
  }

  if (showPrivacy) {
    return <PrivacyLanding onContinue={handlePrivacyContinue} />
  }

  // 目前只显示 End User Dashboard
  // 未来可以通过路由切换两个 dashboard
  return (
    <div className={`dashboard-container ${showDashboard ? 'visible' : ''}`}>
      <EndUserApp />
    </div>
  )
  
  // 未来可以这样切换：
  // const dashboardType = 'end-user' // 或 'business'
  // return dashboardType === 'end-user' ? <EndUserApp /> : <BusinessApp />
}

export default App
