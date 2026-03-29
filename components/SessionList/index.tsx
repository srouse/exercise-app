'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import type { WorkoutSession } from '@/lib/sessionTypes'
import SessionListItem from '@/components/SessionListItem'
import styles from './SessionList.module.css'

interface Props {
  sessions: WorkoutSession[]
}

export default function SessionList({ sessions }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [conflict, setConflict] = useState<{ sessionId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleNew() {
    setLoading(true)
    setConflict(null)
    setError(null)
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      if (res.status === 409) {
        const body = await res.json()
        setConflict({ sessionId: body.sessionId })
        return
      }
      if (!res.ok) throw new Error('Failed to create session')
      const session = await res.json()
      router.push(`/session/${session.id}`)
    } catch {
      setError('Could not create session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Workouts</h1>
        <button
          className={styles.newButton}
          onClick={handleNew}
          disabled={loading}
        >
          {loading ? '…' : 'New'}
        </button>
      </div>

      {conflict && (
        <div className={styles.notice}>
          You have an active session.{' '}
          <Link href={`/session/${conflict.sessionId}`} className={styles.noticeLink}>
            Continue it
          </Link>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {sessions.length === 0 ? (
        <div className={styles.empty}>
          <p>No sessions yet.</p>
          <p>Tap <strong>New</strong> to start your first workout.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {sessions.map((s) => (
            <li key={s.id}>
              <SessionListItem session={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
