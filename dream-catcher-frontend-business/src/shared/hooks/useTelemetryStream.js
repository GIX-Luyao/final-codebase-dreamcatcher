// 

import { useState, useEffect, useRef } from 'react';
import { subscribeTelemetry } from '../telemetry/telemetryClient';

const EVENT_MEETING_DETECTED = 'MEETING_DETECTED';
const EVENT_SWITCH_COMPLETED = 'SWITCH_COMPLETED';
// const EVENT_MEETING_ENDED = 'MEETING_ENDED';
// const EVENT_SWITCH_BACK_COMPLETED = 'SWITCH_BACK_COMPLETED';

export function useTelemetryStream({ 
  tickMs = 1000, 
  autoStart = true, 
  source = 'backend'  // 'mock' | 'backend' | 'polling'
} = {}) {
  const [state, setState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [series, setSeries] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const unsubscribeRef = useRef(null);
  const currentIndexRef = useRef(0);
  const pendingAfterMarkerRef = useRef(null);

  const resetStreamState = () => {
    setState(null);
    setMetrics(null);
    setSeries([]);
    setMarkers([]);
    setLastEvent(null);
    currentIndexRef.current = 0;
    pendingAfterMarkerRef.current = null;
  };

  const handleTickFactory = () => ({ state: newState, metrics: newMetrics, event, seriesPoint }) => {
    setState(newState);
    setMetrics(newMetrics);
    setLastEvent(event);

    const currentIndex = currentIndexRef.current;

    setSeries((prev) => [...prev, seriesPoint].slice(-60));

    // Always append markers; cap to last 10
    const pushMarker = (type, label) => {
      setMarkers((prev) => {
        const next = [
          ...prev,
          {
            type,          // 'before' | 'after'
            label,         // 'Priority increase detected' etc.
            timestamp: seriesPoint.timestamp,
            quality: seriesPoint.quality,
            index: currentIndex,
          },
        ];
    
        // optional dedupe
        const deduped = next.filter(
          (m, i, arr) => i === arr.findIndex((x) => x.type === m.type && x.index === m.index)
        );
    
        return deduped.slice(-10);
      });
    };
    
    if (event === EVENT_MEETING_DETECTED) pushMarker('before', 'Before switching');
    if (event === EVENT_SWITCH_COMPLETED) pushMarker('after', 'After switching');
    // if (event === EVENT_MEETING_ENDED) pushMarker('before', 'Low-priority task detected');
    // if (event === EVENT_SWITCH_BACK_COMPLETED) pushMarker('after', 'Network returned to normal');

    currentIndexRef.current = currentIndex + 1;
  };

  useEffect(() => {
    if (!autoStart) return;

    resetStreamState();
    const handleTick = handleTickFactory();

    unsubscribeRef.current = subscribeTelemetry(handleTick, { tickMs, source });
    setIsRunning(true);

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsRunning(false);
    };
  }, [tickMs, autoStart, source]);

  const start = () => {
    if (isRunning) return;

    resetStreamState();
    const handleTick = handleTickFactory();

    unsubscribeRef.current = subscribeTelemetry(handleTick, { tickMs, source });
    setIsRunning(true);
  };

  const stop = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsRunning(false);
    }
  };

  return { state, metrics, series, markers, lastEvent, start, stop, isRunning };
}

// // 

// import { useState, useEffect, useRef } from 'react';
// import { subscribeTelemetry } from '../telemetry/telemetryClient';

// const EVENT_SWITCH_INITIATED = 'SWITCH_INITIATED';

// const EVENT_MEETING_DETECTED = 'MEETING_DETECTED';
// const EVENT_SWITCH_COMPLETED = 'SWITCH_COMPLETED';
// // const EVENT_MEETING_ENDED = 'MEETING_ENDED';
// // const EVENT_SWITCH_BACK_COMPLETED = 'SWITCH_BACK_COMPLETED';

// export function useTelemetryStream({ tickMs = 1000, autoStart = true } = {}) {
//   const [state, setState] = useState(null);
//   const [metrics, setMetrics] = useState(null);
//   const [series, setSeries] = useState([]);
//   const [markers, setMarkers] = useState([]);
//   const [lastEvent, setLastEvent] = useState(null);
//   const [isRunning, setIsRunning] = useState(false);

//   const unsubscribeRef = useRef(null);
//   const currentIndexRef = useRef(0);
//   const pendingAfterMarkerRef = useRef(null);

//   const resetStreamState = () => {
//     setState(null);
//     setMetrics(null);
//     setSeries([]);
//     setMarkers([]);
//     setLastEvent(null);
//     currentIndexRef.current = 0;
//     pendingAfterMarkerRef.current = null;
//   };

//   const handleTickFactory = () => ({ state: newState, metrics: newMetrics, event, seriesPoint }) => {
//     setState(newState);
//     setMetrics(newMetrics);
//     setLastEvent(event);

//     const currentIndex = currentIndexRef.current;

//     setSeries((prev) => [...prev, seriesPoint].slice(-60));

//     // Always append markers; cap to last 10
//     const pushMarker = (type, label) => {
//       setMarkers((prev) => {
//         const next = [
//           ...prev,
//           {
//             type,          // 'before' | 'after'
//             label,         // 'Priority increase detected' etc.
//             timestamp: seriesPoint.timestamp,
//             quality: seriesPoint.quality,
//             index: currentIndex,
//           },
//         ];
    
//         // optional dedupe
//         const deduped = next.filter(
//           (m, i, arr) => i === arr.findIndex((x) => x.type === m.type && x.index === m.index)
//         );
    
//         return deduped.slice(-10);
//       });
//     };
    
//     if (event === EVENT_MEETING_DETECTED) pushMarker('before', 'Before switching');
//     if (event === EVENT_SWITCH_COMPLETED) pushMarker('after', 'After switching');
//     // if (event === EVENT_MEETING_ENDED) pushMarker('before', 'Low-priority task detected');
//     // if (event === EVENT_SWITCH_BACK_COMPLETED) pushMarker('after', 'Network returned to normal');

//     currentIndexRef.current = currentIndex + 1;
//   };

//   useEffect(() => {
//     if (!autoStart) return;

//     resetStreamState();
//     const handleTick = handleTickFactory();

//     // unsubscribeRef.current = subscribeTelemetry(handleTick, { tickMs });
//     unsubscribeRef.current = subscribeTelemetry(handleTick, { tickMs, source: 'backend' });

//     setIsRunning(true);

//     return () => {
//       if (unsubscribeRef.current) unsubscribeRef.current();
//       unsubscribeRef.current = null;
//       setIsRunning(false);
//     };
//   }, [tickMs, autoStart]);

//   const start = () => {
//     if (isRunning) return;

//     resetStreamState();
//     const handleTick = handleTickFactory();

//     // unsubscribeRef.current = subscribeTelemetry(handleTick, { tickMs });
//     unsubscribeRef.current = subscribeTelemetry(handleTick, { tickMs, source: 'backend' });

//     setIsRunning(true);
//   };

//   const stop = () => {
//     if (unsubscribeRef.current) {
//       unsubscribeRef.current();
//       unsubscribeRef.current = null;
//       setIsRunning(false);
//     }
//   };

//   return { state, metrics, series, markers, lastEvent, start, stop, isRunning };
// }
