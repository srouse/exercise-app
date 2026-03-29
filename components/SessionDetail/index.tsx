import Link from 'next/link'
import type { SessionWithChildren, ExerciseRecord, RestInterval } from '@/lib/sessionTypes'
import styles from './SessionDetail.module.css'

interface Props {
  session: SessionWithChildren
}

type TimelineEvent =
  | { kind: 'exercise'; item: ExerciseRecord; at: Date }
  | { kind: 'rest'; item: RestInterval; at: Date }

function formatDateTime(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function SessionDetail({ session }: Props) {
  const events: TimelineEvent[] = [
    ...session.exercises.map((e) => ({ kind: 'exercise' as const, item: e, at: new Date(e.recordedAt) })),
    ...session.rests.map((r) => ({ kind: 'rest' as const, item: r, at: new Date(r.startedAt) })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime())

  const totalRestMs = session.rests
    .filter((r) => r.outcome === 'completed' && r.endedAt)
    .reduce((acc, r) => {
      const end = new Date(r.endedAt!).getTime()
      const start = new Date(r.startedAt).getTime()
      return acc + (end - start)
    }, 0)

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>← Workouts</Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>
          {new Date(session.startedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </h1>
        <p className={styles.meta}>
          {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''} &middot;{' '}
          {session.rests.length} rest{session.rests.length !== 1 ? 's' : ''}
          {totalRestMs > 0 ? ` · ${formatDuration(totalRestMs)} resting` : ''}
        </p>
      </header>

      {events.length === 0 ? (
        <p className={styles.empty}>No activity recorded.</p>
      ) : (
        <ul className={styles.timeline}>
          {events.map((ev) => (
            <li key={ev.kind + (ev.kind === 'exercise' ? ev.item.id : ev.item.id)} className={styles.event}>
              {ev.kind === 'exercise' ? (
                <div className={styles.exerciseEvent}>
                  <span className={styles.eventTime}>{formatDateTime(ev.at)}</span>
                  <span className={styles.exerciseLabel}>{(ev.item as ExerciseRecord).label}</span>
                </div>
              ) : (
                <div className={styles.restEvent}>
                  <span className={styles.eventTime}>{formatDateTime(ev.at)}</span>
                  <span className={styles.restInfo}>
                    Rest · {formatDuration((ev.item as RestInterval).plannedDurationMs)}
                    {(ev.item as RestInterval).outcome && (
                      <span
                        className={styles.restOutcome}
                        data-outcome={(ev.item as RestInterval).outcome}
                      >
                        {(ev.item as RestInterval).outcome}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
