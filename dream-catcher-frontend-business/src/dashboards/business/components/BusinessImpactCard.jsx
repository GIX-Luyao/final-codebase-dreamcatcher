// import React, { useState, useEffect, useRef } from 'react';
// import './BusinessImpactCard.css';
// import { useTelemetry } from '../../../shared/context/TelemetryContext';


// /**
//  * Calculates quality score from metrics
//  */
// function calculateQualityScore(latencyMs, jitterMs, packetLossPct) {
//   const normalize = (value, good, bad) => {
//     const clamped = Math.max(0, Math.min(1, (bad - value) / (bad - good)));
//     return clamped;
//   };

//   const sLatency = normalize(latencyMs, 20, 120);
//   const sJitter = normalize(jitterMs, 2, 30);
//   const sLoss = normalize(packetLossPct, 0, 2);

//   const score01 = 0.45 * sLatency + 0.30 * sJitter + 0.25 * sLoss;
//   return Math.round(100 * Math.pow(score01, 1.2));
// }

// /**
//  * Formats time ago string
//  */
// function getTimeAgo(timestamp) {
//   if (!timestamp) return 'Just now';
  
//   const minutes = Math.floor((Date.now() - timestamp) / 60000);
//   if (minutes < 1) return 'Just now';
//   if (minutes === 1) return '1 minute ago';
//   return `${minutes} minutes ago`;
// }

// export default function BusinessImpactCard() {
//   //const { state, metrics, lastEvent } = useTelemetryStream();
//   // const { state, metrics, lastEvent } = useTelemetryStream({ source: getSource() });
//   const { state, metrics, lastEvent } = useTelemetry();

//   const [impactData, setImpactData] = useState(null);
//   const lastEventRef = useRef(null);
  
//   // Track metrics at different stages of the cycle
//   const baselineMetricsRef = useRef(null); // Captured when MEETING_DETECTED
//   const optimizedMetricsRef = useRef(null); // Captured when SWITCH_COMPLETED
//   const protectedSessionsRef = useRef(1); // Captured when SWITCH_COMPLETED

//   // Track baseline metrics when meeting is detected (degraded state)
//   useEffect(() => {
//     if (!metrics || !lastEvent) return;

//     if (lastEvent === 'MEETING_DETECTED') {
//       // Capture baseline metrics in degraded state
//       baselineMetricsRef.current = {
//         latencyMs: metrics.latencyMs,
//         jitterMs: metrics.jitterMs,
//         packetLossPct: metrics.packetLossPct,
//       };
//     }
//   }, [lastEvent, metrics]);

//   // Track optimized metrics and protected sessions when switch completes
//   useEffect(() => {
//     if (!state || !metrics || !lastEvent) return;

//     if (lastEvent === 'SWITCH_COMPLETED') {
//       // Capture optimized metrics
//       optimizedMetricsRef.current = {
//         latencyMs: metrics.latencyMs,
//         jitterMs: metrics.jitterMs,
//         packetLossPct: metrics.packetLossPct,
//       };

//       // Capture protected sessions count
//       const highPriorityDevices = (state.devices || []).filter(d => d.priority === 'high');
//       protectedSessionsRef.current = Math.max(1, highPriorityDevices.length);
//     }
//   }, [lastEvent, state, metrics]);

//   // Calculate impact metrics when cycle completes
//   useEffect(() => {
//     if (!lastEvent) return;

//     // Detect when SWITCH_BACK_COMPLETED occurs (new cycle completion)
//     const isNewCycleComplete = lastEvent === 'SWITCH_BACK_COMPLETED' && lastEventRef.current !== 'SWITCH_BACK_COMPLETED';
    
//     // Update ref to track current event
//     lastEventRef.current = lastEvent;

//     if (isNewCycleComplete && baselineMetricsRef.current && optimizedMetricsRef.current) {
//       const baseline = baselineMetricsRef.current;
//       const optimized = optimizedMetricsRef.current;

//       // Calculate latency reduction
//       const latencyReduction = Math.round(((baseline.latencyMs - optimized.latencyMs) / baseline.latencyMs) * 100);

//       // Calculate improvement based on latency reduction (most visible metric)
//       // This matches the "Reduced latency by X%" bullet point for consistency
//       const qualityImprovement = latencyReduction;

//       // Use tracked protected sessions count
//       const protectedSessions = protectedSessionsRef.current;

//       setImpactData({
//         qualityImprovement,
//         protectedSessions,
//         latencyReduction,
//         latencyBefore: baseline.latencyMs,
//         latencyAfter: optimized.latencyMs,
//         updatedAt: Date.now(),
//       });

//       // Reset refs for next cycle
//       baselineMetricsRef.current = null;
//       optimizedMetricsRef.current = null;
//     }
//   }, [lastEvent]);

//   const hasImpactData = impactData != null;

//   return (
//     <div className="business-impact-card">
//       <div className="business-impact-decoration">
//         <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
//           <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
//           <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
//           <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
//           <circle cx="12" cy="20" r="1"></circle>
//         </svg>
//       </div>

//       {hasImpactData ? (
//         <>
//           <h1 className="business-impact-title">
//             DreamCatcher improved connection quality by {impactData.qualityImprovement}%
//           </h1>
//           <p className="business-impact-updated">
//             Updated: {getTimeAgo(impactData.updatedAt)}
//           </p>
//           <ul className="business-impact-bullets">
//             <li>
//               Protected {impactData.protectedSessions} real-time video session{impactData.protectedSessions !== 1 ? 's' : ''} from network congestion
//             </li>
//             <li>
//               Reduced latency by {impactData.latencyReduction}% during high-priority tasks ({impactData.latencyBefore}ms → {impactData.latencyAfter}ms)
//             </li>
//             <li>
//               Zero customer intervention required — fully automatic optimization
//             </li>
//             <li>
//               Network intelligence adapted in under 3 seconds
//             </li>
//           </ul>
//         </>
//       ) : (
//         <>
//           <h1 className="business-impact-title business-impact-placeholder">
//             DreamCatcher improved connection quality by —%
//           </h1>
//           <p className="business-impact-updated">
//             Updated: Waiting for first cycle…
//           </p>
//           <ul className="business-impact-bullets">
//             <li>
//               Protected — real-time video session(s) from network congestion
//             </li>
//             <li>
//               Reduced latency by —% during high-priority tasks (—ms → —ms)
//             </li>
//             <li>
//               Zero customer intervention required — fully automatic optimization
//             </li>
//             <li>
//               Network intelligence adapted in under 3 seconds
//             </li>
//           </ul>
//         </>
//       )}
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from 'react';
import './BusinessImpactCard.css';
import { useTelemetry } from '../../../shared/context/TelemetryContext';
import { getVariant } from '../../../shared/utils/getSource';


/**
 * Calculates quality score from metrics
 */
function calculateQualityScore(latencyMs, jitterMs, packetLossPct) {
  const normalize = (value, good, bad) => {
    const clamped = Math.max(0, Math.min(1, (bad - value) / (bad - good)));
    return clamped;
  };

  const sLatency = normalize(latencyMs, 20, 120);
  const sJitter = normalize(jitterMs, 2, 30);
  const sLoss = normalize(packetLossPct, 0, 2);

  const score01 = 0.45 * sLatency + 0.30 * sJitter + 0.25 * sLoss;
  return Math.round(100 * Math.pow(score01, 1.2));
}

/**
 * Formats time ago string
 */
function getTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  return `${minutes} minutes ago`;
}

export default function BusinessImpactCard() {
  const { state, metrics, lastEvent } = useTelemetry();
  const variant = getVariant();

  const [impactData, setImpactData] = useState(null);
  const lastEventRef = useRef(null);
  
  const baselineMetricsRef = useRef(null);
  const optimizedMetricsRef = useRef(null);
  const protectedSessionsRef = useRef(1);

  useEffect(() => {
    if (!metrics || !lastEvent) return;

    if (lastEvent === 'MEETING_DETECTED') {
      baselineMetricsRef.current = {
        latencyMs: metrics.latencyMs,
        jitterMs: metrics.jitterMs,
        packetLossPct: metrics.packetLossPct,
      };
    }
  }, [lastEvent, metrics]);

  useEffect(() => {
    if (!state || !metrics || !lastEvent) return;

    if (lastEvent === 'SWITCH_COMPLETED') {
      optimizedMetricsRef.current = {
        latencyMs: metrics.latencyMs,
        jitterMs: metrics.jitterMs,
        packetLossPct: metrics.packetLossPct,
      };

      const highPriorityDevices = (state.devices || []).filter(d => d.priority === 'high');
      protectedSessionsRef.current = Math.max(1, highPriorityDevices.length);
    }
  }, [lastEvent, state, metrics]);

  useEffect(() => {
    if (!lastEvent) return;

    const isNewCycleComplete = lastEvent === 'SWITCH_BACK_COMPLETED' && lastEventRef.current !== 'SWITCH_BACK_COMPLETED';
    
    lastEventRef.current = lastEvent;

    if (isNewCycleComplete && baselineMetricsRef.current && optimizedMetricsRef.current) {
      const baseline = baselineMetricsRef.current;
      const optimized = optimizedMetricsRef.current;

      const latencyReduction = Math.round(((baseline.latencyMs - optimized.latencyMs) / baseline.latencyMs) * 100);
      const qualityImprovement = latencyReduction;
      const protectedSessions = protectedSessionsRef.current;

      setImpactData({
        qualityImprovement,
        protectedSessions,
        latencyReduction,
        latencyBefore: baseline.latencyMs,
        latencyAfter: optimized.latencyMs,
        updatedAt: Date.now(),
      });

      baselineMetricsRef.current = null;
      optimizedMetricsRef.current = null;
    }
  }, [lastEvent]);

  const hasImpactData = impactData != null;

  // Variant C: Card-based layout, horizontal cards, no sidebar (same layout as B cards)
  if (variant === 'c') {
    return (
      <div className="business-impact-card">
        <div className="business-impact-decoration">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <circle cx="12" cy="20" r="1"></circle>
          </svg>
        </div>

        {hasImpactData ? (
          <>
            <h1 className="business-impact-title">
              DreamCatcher improved connection quality by {impactData.qualityImprovement}%
            </h1>
            <p className="business-impact-updated">
              Updated: {getTimeAgo(impactData.updatedAt)}
            </p>
            
            <div className="impact-cards impact-cards-horizontal">
              <div className="impact-card">
                <span className="impact-card-stat">{impactData.protectedSessions}</span>
                <span className="impact-card-label">
                  real-time video session{impactData.protectedSessions !== 1 ? 's' : ''} protected from network congestion
                </span>
              </div>
              
              <div className="impact-card">
                <span className="impact-card-stat">{impactData.latencyReduction}%</span>
                <span className="impact-card-label">
                  latency reduced ({impactData.latencyBefore}ms → {impactData.latencyAfter}ms) during high-priority tasks
                </span>
              </div>
              
              <div className="impact-card">
                <span className="impact-card-stat">&lt;3s</span>
                <span className="impact-card-label">to adapt network intelligence</span>
              </div>
              
              <div className="impact-card">
                <span className="impact-card-stat">Zero</span>
                <span className="impact-card-label">intervention required — fully automatic</span>
              </div>
            </div>
          </>
        ) : (
          <div className="impact-waiting">
            <h1 className="business-impact-title">
              DreamCatcher is monitoring your network
            </h1>
            <p className="impact-waiting-subtitle">
              Results will appear after the first optimization
            </p>
            <br />
            <br />
            <br />
            <br />
          </div>
        )}
      </div>
    );
  }

  // Variant B: Card-based layout (vertical)
  if (variant === 'b') {
    return (
      <div className="business-impact-card">
        <div className="business-impact-decoration">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <circle cx="12" cy="20" r="1"></circle>
          </svg>
        </div>

        {hasImpactData ? (
          <>
            <h1 className="business-impact-title">
              DreamCatcher improved connection quality by {impactData.qualityImprovement}%
            </h1>
            <p className="business-impact-updated">
              Updated: {getTimeAgo(impactData.updatedAt)}
            </p>
            
            <div className="impact-cards">
              <div className="impact-card">
                <span className="impact-card-stat">{impactData.protectedSessions}</span>
                <span className="impact-card-label">
                  real-time video session{impactData.protectedSessions !== 1 ? 's' : ''} protected from network congestion
                </span>
              </div>
              
              <div className="impact-card">
                <span className="impact-card-stat">{impactData.latencyReduction}%</span>
                <span className="impact-card-label">
                  latency reduced ({impactData.latencyBefore}ms → {impactData.latencyAfter}ms) during high-priority tasks
                </span>
              </div>
              
              <div className="impact-card">
                <span className="impact-card-stat">&lt;3s</span>
                <span className="impact-card-label">to adapt network intelligence</span>
              </div>
              
              <div className="impact-card">
                <span className="impact-card-stat">Zero</span>
                <span className="impact-card-label">intervention required — fully automatic</span>
              </div>
            </div>
          </>
        ) : (
          <div className="impact-waiting">
            <h1 className="business-impact-title">
              DreamCatcher is monitoring your network
            </h1>
            <p className="impact-waiting-subtitle">
              Results will appear after the first optimization
            </p>
          </div>
        )}
      </div>
    );
  }

  // Variant A: Original bullet layout
  return (
    <div className="business-impact-card">
      <div className="business-impact-decoration">
        <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <circle cx="12" cy="20" r="1"></circle>
        </svg>
      </div>

      {hasImpactData ? (
        <>
          <h1 className="business-impact-title">
            DreamCatcher improved connection quality by {impactData.qualityImprovement}%
          </h1>
          <p className="business-impact-updated">
            Updated: {getTimeAgo(impactData.updatedAt)}
          </p>
          <ul className="business-impact-bullets">
            <li>
              Protected {impactData.protectedSessions} real-time video session{impactData.protectedSessions !== 1 ? 's' : ''} from network congestion
            </li>
            <li>
              Reduced latency by {impactData.latencyReduction}% during high-priority tasks ({impactData.latencyBefore}ms → {impactData.latencyAfter}ms)
            </li>
            <li>
              Zero customer intervention required — fully automatic optimization
            </li>
            <li>
              Network intelligence adapted in under 3 seconds
            </li>
          </ul>
        </>
      ) : (
        <div className="impact-waiting">
            <h1 className="business-impact-title">
              DreamCatcher is monitoring your network
            </h1>
            <p className="impact-waiting-subtitle">
              Results will appear after the first optimization
            </p>
          </div>
      )}
    </div>
  );
}