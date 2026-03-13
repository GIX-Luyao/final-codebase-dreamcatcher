import React, { useState, useEffect, useRef } from 'react'
import './ActivityOverview.css'

// Network slice configurations (local data for demo)
// Updated values: 25→40 Mbps, 50→28ms, 0.4→0.2%
const DEMO_VERSION = 2
const SLICE_DATA = {
  normal: {
    slice: {
      name: 'Normal Slice',
      allocatedBandwidth: 25,
      latency: 50,
      packetLoss: 0.4,
      status: 'active'
    },
    activity: {
      isLive: false,
      activityType: 'Web Browsing',
      priority: 'Normal Priority',
      icon: 'browser'
    },
    performance: {
      weeklyReliability: 92,
      description: 'Standard network performance for general browsing.'
    }
  },
  video_conference: {
    slice: {
      name: 'Conversational Real-Time Slice',
      allocatedBandwidth: 40,
      latency: 28,
      packetLoss: 0.2,
      status: 'active'
    },
    activity: {
      isLive: true,
      activityType: 'Conversational Real-Time',
      priority: 'High Priority',
      icon: 'conversation'
    },
    performance: {
      weeklyReliability: 98,
      description: 'Of your high-stakes tasks were automatically protected from congestion this week.'
    }
  }
}

const NORMAL_METRICS = {
  bandwidth: SLICE_DATA.normal.slice.allocatedBandwidth,
  latency: SLICE_DATA.normal.slice.latency,
  packetLoss: SLICE_DATA.normal.slice.packetLoss,
  reliability: SLICE_DATA.normal.performance.weeklyReliability
}

const OPTIMIZED_METRICS = {
  bandwidth: SLICE_DATA.video_conference.slice.allocatedBandwidth,
  latency: SLICE_DATA.video_conference.slice.latency,
  packetLoss: SLICE_DATA.video_conference.slice.packetLoss,
  reliability: SLICE_DATA.video_conference.performance.weeklyReliability
}

// Demo phases
const DEMO_PHASES = {
  INITIAL: 'initial',           // Show normal slice
  DETECTING: 'detecting',       // Detecting video conference
  OPTIMIZING: 'optimizing',     // Switching to video slice
  OPTIMIZED: 'optimized'        // Show optimized state
}

function ActivityOverview() {
  const [demoPhase, setDemoPhase] = useState(DEMO_PHASES.INITIAL)
  const [currentData, setCurrentData] = useState(SLICE_DATA.normal)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Animated values
  const [animatedBandwidth, setAnimatedBandwidth] = useState(NORMAL_METRICS.bandwidth)
  const [animatedLatency, setAnimatedLatency] = useState(NORMAL_METRICS.latency)
  const [animatedPacketLoss, setAnimatedPacketLoss] = useState(NORMAL_METRICS.packetLoss)
  const [animatedReliability, setAnimatedReliability] = useState(NORMAL_METRICS.reliability)
  
  const animationRef = useRef(null)
  const timeoutsRef = useRef([])

  // Start demo sequence on mount or when demo version changes
  useEffect(() => {
    // Reset to initial values
    setDemoPhase(DEMO_PHASES.INITIAL)
    setCurrentData(SLICE_DATA.normal)
    setIsTransitioning(false)
    setAnimatedBandwidth(NORMAL_METRICS.bandwidth)
    setAnimatedLatency(NORMAL_METRICS.latency)
    setAnimatedPacketLoss(NORMAL_METRICS.packetLoss)
    setAnimatedReliability(NORMAL_METRICS.reliability)

    startDemoSequence()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutsRef.current = []
    }
  }, [DEMO_VERSION])

  const startDemoSequence = () => {
    // Phase 1: Show normal slice for 2 seconds
    timeoutsRef.current.push(setTimeout(() => {
      setDemoPhase(DEMO_PHASES.DETECTING)
    }, 2000))

    // Phase 2: Detecting (show notification) for 1.5 seconds
    timeoutsRef.current.push(setTimeout(() => {
      setDemoPhase(DEMO_PHASES.OPTIMIZING)
      setIsTransitioning(true)
      animateTransition()
    }, 3500))

    // Phase 3: Optimized state
    timeoutsRef.current.push(setTimeout(() => {
      setDemoPhase(DEMO_PHASES.OPTIMIZED)
      setIsTransitioning(false)
      setCurrentData(SLICE_DATA.video_conference)
    }, 5500))
  }

  // Animate number transitions
  const animateTransition = () => {
    const startBandwidth = NORMAL_METRICS.bandwidth
    const endBandwidth = OPTIMIZED_METRICS.bandwidth
    const startLatency = NORMAL_METRICS.latency
    const endLatency = OPTIMIZED_METRICS.latency
    const startPacketLoss = NORMAL_METRICS.packetLoss
    const endPacketLoss = OPTIMIZED_METRICS.packetLoss
    const startReliability = NORMAL_METRICS.reliability
    const endReliability = OPTIMIZED_METRICS.reliability
    
    const duration = 2000 // 2 seconds
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3)

      setAnimatedBandwidth(Math.round(startBandwidth + (endBandwidth - startBandwidth) * eased))
      setAnimatedLatency(Math.round(startLatency + (endLatency - startLatency) * eased))
      setAnimatedPacketLoss(Number((startPacketLoss + (endPacketLoss - startPacketLoss) * eased).toFixed(1)))
      setAnimatedReliability(Math.round(startReliability + (endReliability - startReliability) * eased))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  // Restart demo
  const restartDemo = () => {
    setDemoPhase(DEMO_PHASES.INITIAL)
    setCurrentData(SLICE_DATA.normal)
    setAnimatedBandwidth(NORMAL_METRICS.bandwidth)
    setAnimatedLatency(NORMAL_METRICS.latency)
    setAnimatedPacketLoss(NORMAL_METRICS.packetLoss)
    setAnimatedReliability(NORMAL_METRICS.reliability)
    setIsTransitioning(false)
    
    setTimeout(() => {
      startDemoSequence()
    }, 500)
  }

  const { slice, activity, performance } = currentData
  const isOptimized = demoPhase === DEMO_PHASES.OPTIMIZED
  const showLive = isOptimized || demoPhase === DEMO_PHASES.OPTIMIZING
  const displayedBandwidth = isTransitioning
    ? animatedBandwidth
    : (isOptimized ? OPTIMIZED_METRICS.bandwidth : NORMAL_METRICS.bandwidth)
  const displayedLatency = isTransitioning
    ? animatedLatency
    : (isOptimized ? OPTIMIZED_METRICS.latency : NORMAL_METRICS.latency)
  const displayedPacketLoss = isTransitioning
    ? animatedPacketLoss
    : (isOptimized ? OPTIMIZED_METRICS.packetLoss : NORMAL_METRICS.packetLoss)
  const displayedReliability = isTransitioning
    ? animatedReliability
    : (isOptimized ? OPTIMIZED_METRICS.reliability : NORMAL_METRICS.reliability)

  return (
    <div className={`activity-overview ${isTransitioning ? 'transitioning' : ''} ${isOptimized ? 'optimized' : ''}`}>
      
      {/* Demo Status Banner */}
      <div className={`demo-banner ${demoPhase}`}>
        {demoPhase === DEMO_PHASES.INITIAL && (
          <>
            <span className="demo-icon">📡</span>
            <span>Normal network slice active</span>
          </>
        )}
        {demoPhase === DEMO_PHASES.DETECTING && (
          <>
            <span className="demo-icon detecting-icon">🔍</span>
            <span>Detecting conversational real-time activity...</span>
          </>
        )}
        {demoPhase === DEMO_PHASES.OPTIMIZING && (
          <>
            <span className="demo-icon optimizing-icon">⚡</span>
            <span>Optimizing network for conversational real-time...</span>
          </>
        )}
        {demoPhase === DEMO_PHASES.OPTIMIZED && (
          <>
            <span className="demo-icon">✅</span>
            <span>Network optimized for conversational real-time!</span>
            <button className="restart-demo-btn" onClick={restartDemo}>
              Replay Demo
            </button>
          </>
        )}
      </div>

      {/* Left Section - Current Activity */}
      <div className="activity-left">
        <h2 className="section-title">Current Activity</h2>
        
        <div className="activity-row">
          <div className={`status-indicator-live ${showLive ? 'visible' : 'hidden'}`}>
            <span className="pulse-dot"></span>
            <span className="status-text-live">Live</span>
          </div>

          <div className="activity-icons-container">
            {/* Web Browsing Icon */}
            <div className={`activity-icon-wrapper ${!isOptimized ? 'active' : 'inactive'}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            
            {/* Conversational Real-Time Icon */}
            <div className={`activity-icon-wrapper ${isOptimized ? 'active' : 'inactive'}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M8 10h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M16 10h.01"></path>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
              </svg>
            </div>
          </div>

          <div className="activity-info">
            <span className={`activity-type ${isTransitioning ? 'changing' : ''}`}>
              {isOptimized ? 'Conversational Real-Time' : (demoPhase === DEMO_PHASES.OPTIMIZING ? 'Conversational Real-Time' : 'Web Browsing')}
            </span>
            <span className={`activity-priority-badge ${isOptimized ? 'high-priority' : ''}`}>
              {isOptimized ? 'High Priority' : (demoPhase === DEMO_PHASES.OPTIMIZING ? 'High Priority' : 'Normal Priority')}
            </span>
          </div>
        </div>

        <div className={`activity-slice-card ${isTransitioning ? 'optimizing' : ''}`}>
          <div className="slice-header">
            <div className={`slice-icon ${isOptimized ? 'optimized' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <circle cx="12" cy="20" r="1"></circle>
              </svg>
            </div>
            <div className="slice-info">
              <span className="slice-label">Active Network Slice</span>
              <span className={`slice-value ${isTransitioning ? 'changing' : ''}`}>
                {isOptimized ? 'Conversational Real-Time Slice' : (demoPhase === DEMO_PHASES.OPTIMIZING ? 'Switching...' : 'Normal Slice')}
              </span>
            </div>
            <div className={`slice-status ${isOptimized ? 'optimized' : ''}`}>
              <span className="slice-status-dot"></span>
              {isTransitioning ? 'Optimizing' : 'Active'}
            </div>
          </div>

          <div className="activity-stats">
            <div className="stat-item">
              <span className={`stat-value ${displayedBandwidth > NORMAL_METRICS.bandwidth ? 'improved' : ''}`}>
                {displayedBandwidth} Mbps
                {displayedBandwidth > NORMAL_METRICS.bandwidth && <span className="improvement-indicator">↑</span>}
              </span>
              <span className="stat-label">Allocated</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className={`stat-value ${displayedLatency < NORMAL_METRICS.latency ? 'improved' : ''}`}>
                {displayedLatency}ms
                {displayedLatency < NORMAL_METRICS.latency && <span className="improvement-indicator">↓</span>}
              </span>
              <span className="stat-label">Latency</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className={`stat-value ${displayedPacketLoss < NORMAL_METRICS.packetLoss ? 'improved' : ''}`}>
                {displayedPacketLoss.toFixed(1)}%
                {displayedPacketLoss < NORMAL_METRICS.packetLoss && <span className="improvement-indicator">↓</span>}
              </span>
              <span className="stat-label">Packet Loss</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Performance (Pink Gradient) */}
      <div className={`activity-right ${isOptimized ? 'optimized' : ''}`}>
        <div className="metrics-background-icon">
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <circle cx="12" cy="20" r="1"></circle>
          </svg>
        </div>
        
        <div className="metrics-content">
          <div className="metrics-header">
            <svg className="shield-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
            <span className="metrics-label">Weekly Reliability</span>
          </div>
          
          <div className="metrics-value">
            <span className={`metrics-number ${displayedReliability > NORMAL_METRICS.reliability ? 'improved' : ''}`}>
              {displayedReliability}%
            </span>
          </div>
          
          <p className="metrics-description">
            {isOptimized 
              ? 'Of your high-stakes tasks were automatically protected from congestion this week.'
              : 'Standard network performance for general browsing.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default ActivityOverview
