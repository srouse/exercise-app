import Link from 'next/link'
import type { WorkoutSession } from '@/lib/sessionTypes'
import styles from './SessionListItem.module.css'

interface Props {
  session: WorkoutSession
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function SessionListItem({ session }: Props) {
  const isActive = session.status === 'active'

  return (
    <Link href={`/session/${session.id}`} className={styles.row}>
      <span className={styles.datetime}>
        {formatDate(session.startedAt)} &middot; {formatTime(session.startedAt)}
      </span>
      <span
        className={styles.badge}
        style={{ color: isActive ? 'var(--color-status-active)' : 'var(--color-status-ended)' }}
      >
        {isActive ? 'Active' : 'Ended'}
      </span>
    </Link>
  )
}
