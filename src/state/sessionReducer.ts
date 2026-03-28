import type { PersistedWorkoutState, RestRunLogEntry, WorkoutState } from '../lib/sessionTypes';
import { emptyEntryState } from '../lib/sessionTypes';

export type SessionAction =
  | { type: 'HYDRATE'; payload: PersistedWorkoutState | null }
  | { type: 'NEW_SESSION' }
  | { type: 'CONTINUE_SESSION' }
  | { type: 'START_REST'; durationMs: number }
  | { type: 'REST_STOP' }
  | { type: 'REST_COMPLETE' }
  | { type: 'ALARM_DONE' }
  | { type: 'END_WORKOUT' };

function toScreen(p: PersistedWorkoutState | null): WorkoutState['screen'] {
  if (!p || !p.sessionId) return 'entry';
  if (p.lifecycle === 'active') return 'session';
  return 'entry';
}

function persistedToWorkout(p: PersistedWorkoutState): WorkoutState {
  return {
    screen: toScreen(p),
    ...p,
  };
}

function newSessionId(): string {
  return crypto.randomUUID();
}

export function sessionReducer(state: WorkoutState, action: SessionAction): WorkoutState {
  const now = Date.now();

  switch (action.type) {
    case 'HYDRATE': {
      if (!action.payload) return emptyEntryState();
      return persistedToWorkout(action.payload);
    }

    case 'NEW_SESSION': {
      const id = newSessionId();
      return {
        screen: 'session',
        schemaVersion: 1,
        sessionId: id,
        sessionStartedAt: now,
        updatedAt: now,
        lifecycle: 'active',
        phase: 'exercise_idle',
        restRunLog: [],
      };
    }

    case 'CONTINUE_SESSION': {
      if (!state.sessionId) return state;
      return {
        ...state,
        screen: 'session',
        lifecycle: 'active',
        updatedAt: now,
      };
    }

    case 'START_REST': {
      if (state.phase === 'rest_running') return state;
      if (state.lifecycle !== 'active') return state;
      const durationMs = action.durationMs;
      return {
        ...state,
        phase: 'rest_running',
        restDurationMs: durationMs,
        restEndsAt: now + durationMs,
        alarmActive: false,
        updatedAt: now,
      };
    }

    case 'REST_STOP': {
      if (state.phase !== 'rest_running') return state;
      if (state.restEndsAt === undefined || state.restDurationMs === undefined) {
        return {
          ...state,
          phase: 'exercise_idle',
          restEndsAt: undefined,
          restDurationMs: undefined,
          alarmActive: false,
          updatedAt: now,
        };
      }
      const startedAt = state.restEndsAt - state.restDurationMs;
      const entry: RestRunLogEntry = {
        startedAt,
        endedAt: now,
        outcome: 'cancelled',
      };
      return {
        ...state,
        phase: 'exercise_idle',
        restEndsAt: undefined,
        restDurationMs: undefined,
        alarmActive: false,
        lastRestOutcome: 'cancelled',
        restRunLog: [...state.restRunLog, entry],
        updatedAt: now,
      };
    }

    case 'REST_COMPLETE': {
      if (state.phase !== 'rest_running') return state;
      return {
        ...state,
        phase: 'rest_alarm',
        alarmActive: true,
        updatedAt: now,
      };
    }

    case 'ALARM_DONE': {
      if (state.phase !== 'rest_alarm') return state;
      if (state.restEndsAt === undefined || state.restDurationMs === undefined) {
        return {
          ...state,
          phase: 'exercise_idle',
          alarmActive: false,
          restEndsAt: undefined,
          restDurationMs: undefined,
          updatedAt: now,
        };
      }
      const startedAt = state.restEndsAt - state.restDurationMs;
      const entry: RestRunLogEntry = {
        startedAt,
        endedAt: state.restEndsAt,
        outcome: 'completed',
      };
      return {
        ...state,
        phase: 'exercise_idle',
        alarmActive: false,
        restEndsAt: undefined,
        restDurationMs: undefined,
        lastRestOutcome: 'completed',
        restRunLog: [...state.restRunLog, entry],
        updatedAt: now,
      };
    }

    case 'END_WORKOUT': {
      return {
        ...state,
        screen: 'entry',
        lifecycle: 'ended',
        phase: 'exercise_idle',
        restEndsAt: undefined,
        restDurationMs: undefined,
        alarmActive: false,
        updatedAt: now,
      };
    }

    default:
      return state;
  }
}

export function toPersisted(state: WorkoutState): PersistedWorkoutState | null {
  if (!state.sessionId) return null;
  const { screen: _s, ...rest } = state;
  return rest;
}
