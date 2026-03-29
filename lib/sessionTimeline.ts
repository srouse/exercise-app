import type { SessionWithChildren, ExerciseRecord, RestInterval } from './sessionTypes'

export type SessionTimelineEvent =
  | { kind: 'exercise'; item: ExerciseRecord; at: Date }
  | { kind: 'rest'; item: RestInterval; at: Date }

export function buildSessionTimeline(session: SessionWithChildren): SessionTimelineEvent[] {
  return [
    ...session.exercises.map((e) => ({
      kind: 'exercise' as const,
      item: e,
      at: new Date(e.recordedAt),
    })),
    ...session.rests.map((r) => ({
      kind: 'rest' as const,
      item: r,
      at: new Date(r.startedAt),
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime())
}

export function formatTimelineTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatPlannedRestMs(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

/** Wall-clock length of a rest (from start to end timestamps). */
export function formatElapsedRestMs(startedAt: Date | string, endedAt: Date | string) {
  const ms = Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime())
  return formatPlannedRestMs(ms)
}

/**
 * One-line label for a rest in activity lists (session view + detail).
 * - In progress: planned timer label
 * - Completed (ran to alarm): full planned duration (e.g. 1:00)
 * - Cancelled: actual elapsed from timestamps, then "stopped early"
 */
export function formatRestActivityLabel(r: RestInterval): string {
  if (!r.endedAt) {
    return `Rest ${formatPlannedRestMs(r.plannedDurationMs)} · in progress`
  }
  if (r.outcome === 'cancelled') {
    const elapsed = formatElapsedRestMs(r.startedAt, r.endedAt)
    return `Rest ${elapsed} · stopped early`
  }
  return `Rest ${formatPlannedRestMs(r.plannedDurationMs)} · done`
}
