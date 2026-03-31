'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { WorkoutSession } from '@/lib/sessionTypes'
import { formatSessionDuration, getSessionDurationMs } from '@/lib/sessionDuration'
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
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [isActive])

  const durationMs = getSessionDurationMs(session)

  return (
    <Link href={`/session/${session.id}`} className={styles.row}>
      <div className={styles.rowLeft}>
        <span className={styles.datetime}>
          {formatDate(session.startedAt)} &middot; {formatTime(session.startedAt)}
        </span>
        <span className={styles.duration}>
          {formatSessionDuration(durationMs)}
          {isActive ? ' · so far' : ''}
        </span>
      </div>
      <span
        className={styles.badge}
        style={{
          color: isActive ? 'var(--color-status-active)' : 'var(--color-status-ended)',
        }}
      >
        {isActive ? 'Active' : 'Ended'}
      </span>
    </Link>
  )
}
