import React from 'react'
import Dashboard from './components/Dashboard'
import { TelemetryProvider } from '../../shared/context/TelemetryContext'
import '../../shared/styles/index.css'

function EndUserApp() {
  return (
    <TelemetryProvider>
      <Dashboard />
    </TelemetryProvider>
  )
}

export default EndUserApp
