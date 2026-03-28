import type { PersistedWorkoutState, RestRunLogEntry } from './sessionTypes';

export const STORAGE_KEY = 'rest-timer-session-v1';

function isRestRunLogEntry(x: unknown): x is RestRunLogEntry {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.startedAt === 'number' &&
    typeof o.endedAt === 'number' &&
    (o.outcome === 'completed' || o.outcome === 'cancelled')
  );
}

function validatePersisted(raw: unknown): PersistedWorkoutState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (typeof o.sessionId !== 'string' || o.sessionId.length < 1) return null;
  if (o.lifecycle !== 'active' && o.lifecycle !== 'ended') return null;

  const phase = o.phase;
  if (
    phase !== undefined &&
    phase !== 'exercise_idle' &&
    phase !== 'rest_running' &&
    phase !== 'rest_alarm'
  ) {
    return null;
  }

  const restRunLog = Array.isArray(o.restRunLog) ? o.restRunLog : [];
  if (!restRunLog.every(isRestRunLogEntry)) return null;

  const base: PersistedWorkoutState = {
    schemaVersion: 1,
    sessionId: o.sessionId,
    sessionStartedAt: typeof o.sessionStartedAt === 'number' ? o.sessionStartedAt : Date.now(),
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : Date.now(),
    lifecycle: o.lifecycle,
    phase: (phase as PersistedWorkoutState['phase']) ?? 'exercise_idle',
    restRunLog,
  };

  if (typeof o.restDurationMs === 'number') base.restDurationMs = o.restDurationMs;
  if (typeof o.restEndsAt === 'number') base.restEndsAt = o.restEndsAt;
  if (typeof o.alarmActive === 'boolean') base.alarmActive = o.alarmActive;
  if (o.lastRestOutcome === 'completed' || o.lastRestOutcome === 'cancelled') {
    base.lastRestOutcome = o.lastRestOutcome;
  }

  return base;
}

export function loadPersistedState(): PersistedWorkoutState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === '') return null;
    const parsed: unknown = JSON.parse(raw);
    const v = validatePersisted(parsed);
    if (!v) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return v;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function savePersistedState(state: PersistedWorkoutState): void {
  const toSave: PersistedWorkoutState = {
    ...state,
    updatedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
