import { useCallback, useEffect, useReducer } from 'react';
import { emptyEntryState } from '../lib/sessionTypes';
import { loadPersistedState, savePersistedState } from '../lib/storage';
import { playAlarmBeep, resumeAudioContext } from '../lib/alarmSound';
import { sessionReducer, toPersisted, type SessionAction } from '../state/sessionReducer';
import type { WorkoutState } from '../lib/sessionTypes';

function initialWorkoutState(): WorkoutState {
  const p = loadPersistedState();
  if (!p) return emptyEntryState();
  return {
    ...p,
    screen: p.lifecycle === 'active' ? 'session' : 'entry',
  };
}

const ALARM_REPEAT_MS = 2000;

export function useWorkoutSession() {
  const [state, dispatch] = useReducer(sessionReducer, 0, () => initialWorkoutState());

  useEffect(() => {
    const p = toPersisted(state);
    if (p) savePersistedState(p);
  }, [state]);

  useEffect(() => {
    if (state.phase !== 'rest_running' || state.restEndsAt === undefined) return;
    const endsAt = state.restEndsAt;
    const tick = () => {
      if (Date.now() >= endsAt) {
        dispatch({ type: 'REST_COMPLETE' });
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [state.phase, state.restEndsAt]);

  useEffect(() => {
    if (state.phase !== 'rest_alarm') return;

    const beep = () => {
      void resumeAudioContext().then(() => playAlarmBeep());
    };
    beep();
    const id = window.setInterval(beep, ALARM_REPEAT_MS);
    return () => window.clearInterval(id);
  }, [state.phase]);

  const act = useCallback((a: SessionAction) => dispatch(a), []);

  return { state, dispatch: act };
}
