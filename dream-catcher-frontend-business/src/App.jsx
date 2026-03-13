import React from 'react'
import EndUserApp from './dashboards/end-user/App'
import BusinessApp from './dashboards/business/App'

function App() {
  const dashboardType = 'business' // temporary manual switch

  return dashboardType === 'end-user'
    ? <EndUserApp />
    : <BusinessApp />
}

export default App