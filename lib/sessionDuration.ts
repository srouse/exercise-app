import type { WorkoutSession } from '@/lib/sessionTypes'

/** Wall-clock session length: ended sessions use `endedAt`; active uses `endMs` (default now). */
export function getSessionDurationMs(
  session: Pick<WorkoutSession, 'startedAt' | 'endedAt' | 'status'>,
  endMs: number = Date.now(),
): number {
  const start = new Date(session.startedAt).getTime()
  const end =
    session.status === 'ended' && session.endedAt != null
      ? new Date(session.endedAt).getTime()
      : endMs
  return Math.max(0, end - start)
}

/** Human-readable length for workout session wall time (e.g. `12m 5s`, `1h 0m 3s`). */
export function formatSessionDuration(ms: number): string {
  const mTotal = Math.floor(ms / 60000)
  const h = Math.floor(mTotal / 60)
  const m = mTotal % 60
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
