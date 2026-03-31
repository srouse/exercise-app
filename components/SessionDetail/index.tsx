import Link from 'next/link'
import type { SessionWithChildren } from '@/lib/sessionTypes'
import { buildSessionTimeline } from '@/lib/sessionTimeline'
import { formatSessionDuration, getSessionDurationMs } from '@/lib/sessionDuration'
import SessionActivityTimeline from '@/components/SessionActivityTimeline'
import DeleteSessionButton from '@/components/DeleteSessionButton'
import styles from './SessionDetail.module.css'

interface Props {
  session: SessionWithChildren
}

export default function SessionDetail({ session }: Props) {
  const events = buildSessionTimeline(session)
  const sessionDurationMs = getSessionDurationMs(session)

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
          {formatSessionDuration(sessionDurationMs)} session
          {' · '}
          {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''} &middot;{' '}
          {session.rests.length} rest{session.rests.length !== 1 ? 's' : ''}
          {totalRestMs > 0
            ? ` · ${formatSessionDuration(totalRestMs)} resting`
            : ''}
        </p>
      </header>

      <SessionActivityTimeline
        events={events}
        emptyMessage="No activity recorded."
      />

      <DeleteSessionButton sessionId={session.id} />
    </div>
  )
}
