'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SessionWithChildren } from '@/lib/sessionTypes'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import TimerDisplay from '@/components/TimerDisplay'
import styles from './SessionView.module.css'

interface Props {
  session: SessionWithChildren
}

export default function SessionView({ session }: Props) {
  const router = useRouter()
  const { state, apiError, startRest, dismissAlarm, stopRest } = useWorkoutSession(session.id)

  const [exerciseLabel, setExerciseLabel] = useState('')
  const [logStatus, setLogStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [endingSession, setEndingSession] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleLogExercise() {
    const label = exerciseLabel.trim()
    if (!label) return
    setLogStatus('saving')
    setNetworkError(null)
    try {
      const res = await fetch(`/api/sessions/${session.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!res.ok) throw new Error('Failed to log exercise')
      setExerciseLabel('')
      setLogStatus('saved')
      setTimeout(() => setLogStatus('idle'), 1500)
    } catch {
      setLogStatus('error')
      setNetworkError('Could not save exercise. Try again.')
    }
  }

  async function handleEndSession() {
    setEndingSession(true)
    setNetworkError(null)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      })
      if (!res.ok) throw new Error('Failed to end session')
      router.push('/')
    } catch {
      setNetworkError('Could not end session. Try again.')
      setEndingSession(false)
    }
  }

  // Alarm phase — full-surface overlay
  if (state.phase === 'rest_alarm') {
    return (
      <div className={`${styles.alarmOverlay} alarm-flash`} role="alert">
        <p className={styles.alarmLabel}>Rest complete!</p>
        <TimerDisplay remainingMs={0} />
        <button className={styles.doneButton} onClick={dismissAlarm}>
          Done
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>← Workouts</Link>
      </nav>

      {/* Rest running phase */}
      {state.phase === 'rest_running' && (
        <section className={styles.restRunning}>
          <p className={styles.phaseLabel}>Resting…</p>
          <TimerDisplay remainingMs={state.remainingMs ?? 0} />
          <button className={styles.stopButton} onClick={stopRest}>
            Stop
          </button>
        </section>
      )}

      {/* Exercise idle phase */}
      {state.phase === 'exercise_idle' && (
        <section className={styles.idleSection}>
          <button
            className={styles.startRestButton}
            onClick={startRest}
          >
            Start Rest
          </button>

          <div className={styles.logExercise}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Exercise name…"
              value={exerciseLabel}
              onChange={(e) => setExerciseLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogExercise()}
              maxLength={200}
            />
            <button
              className={styles.logButton}
              onClick={handleLogExercise}
              disabled={!exerciseLabel.trim() || logStatus === 'saving'}
            >
              {logStatus === 'saving' ? '…' : logStatus === 'saved' ? '✓ Saved' : 'Log Exercise'}
            </button>
          </div>

          <button
            className={styles.endButton}
            onClick={handleEndSession}
            disabled={endingSession}
          >
            {endingSession ? 'Ending…' : 'End Session'}
          </button>
        </section>
      )}

      {/* Network error banner — non-blocking */}
      {(apiError || networkError) && (
        <div className={styles.errorBanner} role="status">
          {apiError || networkError}
        </div>
      )}
    </div>
  )
}
