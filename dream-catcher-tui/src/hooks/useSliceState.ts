import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  SliceState,
  SliceEventEntry,
  WanId,
  SlicePhase,
  SwitchEvent,
  StatusEvent,
} from '../sources/types.js';

const MAX_EVENTS = 50;

const initialState: SliceState = {
  activeWan: 'wan1',
  phase: 'idle',
  triggerApp: null,
  switchedAt: null,
  cooldownRemaining: 0,
  events: [],
};

export function useSliceState() {
  const [state, setState] = useState<SliceState>(initialState);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addEvent = useCallback((entry: Omit<SliceEventEntry, 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      events: [{ ...entry, timestamp: Date.now() }, ...prev.events].slice(0, MAX_EVENTS),
    }));
  }, []);

  const handleSwitch = useCallback((event: SwitchEvent) => {
    const now = Date.now();
    const isToWan2 = event.action === 'switch_to_wan2';

    setState(prev => ({
      ...prev,
      activeWan: isToWan2 ? 'wan2' : 'wan1',
      phase: isToWan2 ? 'active' : 'idle',
      triggerApp: event.trigger,
      switchedAt: now,
      cooldownRemaining: 0,
      events: [
        {
          timestamp: now,
          type: (isToWan2 ? 'switch' : 'revert') as SliceEventEntry['type'],
          label: isToWan2 ? `SWITCH \u2192 WAN2` : `REVERT \u2192 WAN1`,
          detail: event.reason,
        },
        ...prev.events,
      ].slice(0, MAX_EVENTS),
    }));
  }, []);

  const handleStatus = useCallback((event: StatusEvent) => {
    setState(prev => {
      const updates: Partial<SliceState> = {
        activeWan: event.activeWan,
        phase: event.phase,
      };

      // When entering cooldown, start the timer
      if (event.phase === 'cooldown' && prev.phase !== 'cooldown') {
        updates.cooldownRemaining = 30;
        updates.events = ([
          {
            timestamp: Date.now(),
            type: 'cooldown' as const,
            label: 'COOLDOWN',
            detail: 'Waiting for Conversational RT timeout',
          },
          ...prev.events,
        ] as SliceEventEntry[]).slice(0, MAX_EVENTS);
      }

      return { ...prev, ...updates };
    });
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (state.phase === 'cooldown' && state.cooldownRemaining > 0) {
      cooldownRef.current = setInterval(() => {
        setState(prev => {
          if (prev.cooldownRemaining <= 1) {
            return { ...prev, cooldownRemaining: 0 };
          }
          return { ...prev, cooldownRemaining: prev.cooldownRemaining - 1 };
        });
      }, 1000);

      return () => {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      };
    }
  }, [state.phase, state.cooldownRemaining > 0]);

  return { state, handleSwitch, handleStatus, addEvent };
}
