/** Aligns with specs/001-bootstrap-session-timer/data-model.md and contracts/storage-schema.json */

export type Lifecycle = 'active' | 'ended';

export type RestPhase = 'exercise_idle' | 'rest_running' | 'rest_alarm';

export type Screen = 'entry' | 'session';

export interface RestRunLogEntry {
  startedAt: number;
  endedAt: number;
  outcome: 'completed' | 'cancelled';
}

/** Subset written to localStorage (no screen) */
export interface PersistedWorkoutState {
  schemaVersion: 1;
  sessionId: string;
  sessionStartedAt: number;
  updatedAt: number;
  lifecycle: Lifecycle;
  phase: RestPhase;
  restDurationMs?: number;
  restEndsAt?: number;
  alarmActive?: boolean;
  lastRestOutcome?: 'completed' | 'cancelled';
  restRunLog: RestRunLogEntry[];
}

export interface WorkoutState extends PersistedWorkoutState {
  screen: Screen;
}

export function emptyEntryState(): WorkoutState {
  return {
    screen: 'entry',
    schemaVersion: 1,
    sessionId: '',
    sessionStartedAt: 0,
    updatedAt: 0,
    lifecycle: 'ended',
    phase: 'exercise_idle',
    restRunLog: [],
  };
}
