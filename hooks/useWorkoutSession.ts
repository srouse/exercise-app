'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { startAlarmLoop, stopAlarmLoop } from '@/lib/alarmSound'

export type Phase = 'exercise_idle' | 'rest_running' | 'rest_alarm'

interface WorkoutState {
  phase: Phase
  restId: string | null
  startedAt: number | null    // timestamp ms
  plannedMs: number | null
  remainingMs: number | null
}

const FIXED_REST_MS = 60_000 // 1 minute fixed — no user selection

export function useWorkoutSession(sessionId: string) {
  const [state, setState] = useState<WorkoutState>({
    phase: 'exercise_idle',
    restId: null,
    startedAt: null,
    plannedMs: null,
    remainingMs: null,
  })
  const [apiError, setApiError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown tick — updates remainingMs every 250ms
  const startCountdown = useCallback((startMs: number, plannedMs: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startMs
      const remaining = Math.max(0, plannedMs - elapsed)
      setState((prev) => {
        if (prev.phase !== 'rest_running') return prev
        if (remaining <= 0) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          startAlarmLoop()
          return { ...prev, phase: 'rest_alarm', remainingMs: 0 }
        }
        return { ...prev, remainingMs: remaining }
      })
    }, 250)
  }, [])

  // Clean up countdown and alarm on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopAlarmLoop()
    }
  }, [])

  const startRest = useCallback(async () => {
    setApiError(null)
    const now = new Date()
    try {
      const res = await fetch(`/api/sessions/${sessionId}/rests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_duration_ms: FIXED_REST_MS,
          started_at: now.toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setApiError(err.error ?? 'Failed to start rest')
        return
      }
      const rest = await res.json()
      const startMs = now.getTime()
      setState({
        phase: 'rest_running',
        restId: rest.id,
        startedAt: startMs,
        plannedMs: FIXED_REST_MS,
        remainingMs: FIXED_REST_MS,
      })
      startCountdown(startMs, FIXED_REST_MS)
    } catch {
      setApiError('Network error — could not start rest')
    }
  }, [sessionId, startCountdown])

  const dismissAlarm = useCallback(async () => {
    stopAlarmLoop()
    const { restId } = state
    setState((prev) => ({
      ...prev,
      phase: 'exercise_idle',
      restId: null,
      startedAt: null,
      plannedMs: null,
      remainingMs: null,
    }))
    if (!restId) return
    try {
      await fetch(`/api/sessions/${sessionId}/rests/${restId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: 'completed', ended_at: new Date().toISOString() }),
      })
    } catch {
      // Non-blocking — rest row can be reconciled later
    }
  }, [state, sessionId])

  // T041: Stop rest early (outcome = cancelled)
  const stopRest = useCallback(async () => {
    stopAlarmLoop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const { restId } = state
    setState({
      phase: 'exercise_idle',
      restId: null,
      startedAt: null,
      plannedMs: null,
      remainingMs: null,
    })
    if (!restId) return
    try {
      await fetch(`/api/sessions/${sessionId}/rests/${restId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: 'cancelled', ended_at: new Date().toISOString() }),
      })
    } catch {
      // Non-blocking
    }
  }, [state, sessionId])

  return { state, apiError, startRest, dismissAlarm, stopRest }
}
