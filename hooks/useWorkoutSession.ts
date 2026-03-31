'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { startAlarmLoop, stopAlarmLoop } from '@/lib/alarmSound'
import type { RestInterval, SessionWithChildren } from '@/lib/sessionTypes'

export type Phase = 'catalog' | 'exercise_active' | 'rest_running' | 'rest_alarm'

type CompleteFailure = 'exercise' | 'rest'

interface WorkoutState {
  phase: Phase
  activeExerciseLabel: string | null
  restId: string | null
  startedAt: number | null
  plannedMs: number | null
  remainingMs: number | null
  completeError: string | null
  /** Set when Complete chain failed after exercise POST (`exercise`) or after (`rest`). */
  completeFailure: CompleteFailure | null
}

const FIXED_REST_MS = 60_000

function findOpenRest(rests: RestInterval[]): RestInterval | null {
  const open = rests.filter((r) => !r.endedAt)
  if (open.length === 0) return null
  return open.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )[0]!
}

function hydrateFromOpenRest(open: RestInterval): Omit<
  WorkoutState,
  'completeError' | 'completeFailure' | 'activeExerciseLabel'
> & {
  phase: 'rest_running' | 'rest_alarm'
  activeExerciseLabel: null
} {
  const startMs = new Date(open.startedAt).getTime()
  const planned = open.plannedDurationMs
  const elapsed = Date.now() - startMs
  if (elapsed >= planned) {
    return {
      phase: 'rest_alarm',
      activeExerciseLabel: null,
      restId: open.id,
      startedAt: startMs,
      plannedMs: planned,
      remainingMs: 0,
    }
  }
  return {
    phase: 'rest_running',
    activeExerciseLabel: null,
    restId: open.id,
    startedAt: startMs,
    plannedMs: planned,
    remainingMs: Math.max(0, planned - elapsed),
  }
}

function catalogReset(): WorkoutState {
  return {
    phase: 'catalog',
    activeExerciseLabel: null,
    restId: null,
    startedAt: null,
    plannedMs: null,
    remainingMs: null,
    completeError: null,
    completeFailure: null,
  }
}

export function useWorkoutSession(
  sessionId: string,
  options: { session: SessionWithChildren; onSessionMutated?: () => void },
) {
  const { onSessionMutated, session } = options

  const [state, setState] = useState<WorkoutState>(() => {
    const open = findOpenRest(session.rests)
    if (!open) return catalogReset()
    return { ...hydrateFromOpenRest(open), completeError: null, completeFailure: null }
  })

  const [completing, setCompleting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCountdown = useCallback((startMs: number, plannedMs: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startMs
      const remaining = Math.max(0, plannedMs - elapsed)
      setState((prev) => {
        if (prev.phase !== 'rest_running') return prev
        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          startAlarmLoop()
          return { ...prev, phase: 'rest_alarm', remainingMs: 0 }
        }
        return { ...prev, remainingMs: remaining }
      })
    }, 250)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopAlarmLoop()
    }
  }, [])

  useEffect(() => {
    if (state.phase === 'rest_alarm') {
      startAlarmLoop()
      return () => stopAlarmLoop()
    }
    stopAlarmLoop()
    return undefined
  }, [state.phase])

  useEffect(() => {
    if (state.phase === 'rest_running' && state.startedAt && state.plannedMs) {
      startCountdown(state.startedAt, state.plannedMs)
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
    return undefined
  }, [state.phase, state.restId, state.startedAt, state.plannedMs, startCountdown])

  useEffect(() => {
    const rests = session.rests

    setState((prev) => {
      const open = findOpenRest(rests)

      if (prev.phase === 'rest_running' || prev.phase === 'rest_alarm') {
        if (!open) {
          const mine = rests.find((r) => r.id === prev.restId)
          if (mine?.endedAt) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            return catalogReset()
          }
          return prev
        }
        if (open.id !== prev.restId) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return { ...hydrateFromOpenRest(open), completeError: null, completeFailure: null }
        }
        return prev
      }

      if (open) {
        return { ...hydrateFromOpenRest(open), completeError: null, completeFailure: null }
      }

      return prev
    })
  }, [session])

  const selectActiveExercise = useCallback((label: string) => {
    setState((prev) => {
      if (prev.phase === 'rest_running' || prev.phase === 'rest_alarm') return prev
      if (prev.completeFailure === 'rest') return prev
      return {
        ...prev,
        phase: 'exercise_active',
        activeExerciseLabel: label,
        completeError: null,
        completeFailure: null,
      }
    })
  }, [])

  /** Return to catalog without logging (exercise_active only). */
  const cancelActiveExercise = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'exercise_active') return prev
      return catalogReset()
    })
  }, [])

  /** Log exercise only; return to catalog (no rest timer). */
  const completeExerciseOnly = useCallback(async () => {
    const label = state.activeExerciseLabel
    if (!label || completing) return
    if (state.completeFailure === 'rest') return
    setCompleting(true)
    setApiError(null)
    setState((s) => ({
      ...s,
      completeError: null,
      completeFailure: null,
    }))
    try {
      const exRes = await fetch(`/api/sessions/${sessionId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!exRes.ok) {
        const err = await exRes.json().catch(() => ({}))
        setState((s) => ({
          ...s,
          completeError: (err as { error?: string }).error ?? 'Could not save exercise',
          completeFailure: 'exercise',
        }))
        return
      }

      // Close any unended rests so session sync does not immediately re-enter rest_running from catalog.
      const dangling = session.rests.filter((r) => !r.endedAt)
      if (dangling.length > 0) {
        const endedAt = new Date().toISOString()
        const patchResults = await Promise.all(
          dangling.map((r) =>
            fetch(`/api/sessions/${sessionId}/rests/${r.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                outcome: 'cancelled' as const,
                ended_at: endedAt,
              }),
            }),
          ),
        )
        if (patchResults.some((res) => !res.ok)) {
          setApiError('Could not clear an old rest timer — try again.')
          return
        }
      }

      setState(catalogReset())
      onSessionMutated?.()
    } catch {
      setApiError('Network error — try again')
    } finally {
      setCompleting(false)
    }
  }, [sessionId, session, state.activeExerciseLabel, state.completeFailure, completing, onSessionMutated])

  /** Log exercise then start rest (fixed duration). */
  const completeCurrentExercise = useCallback(async () => {
    const label = state.activeExerciseLabel
    if (!label || completing) return
    setCompleting(true)
    setApiError(null)
    setState((s) => ({
      ...s,
      completeError: null,
      completeFailure: null,
    }))
    try {
      const exRes = await fetch(`/api/sessions/${sessionId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (!exRes.ok) {
        const err = await exRes.json().catch(() => ({}))
        setState((s) => ({
          ...s,
          completeError: (err as { error?: string }).error ?? 'Could not save exercise',
          completeFailure: 'exercise',
        }))
        return
      }

      const now = new Date()
      const restRes = await fetch(`/api/sessions/${sessionId}/rests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_duration_ms: FIXED_REST_MS,
          started_at: now.toISOString(),
        }),
      })
      if (!restRes.ok) {
        const err = await restRes.json().catch(() => ({}))
        setState((s) => ({
          ...s,
          completeError:
            (err as { error?: string }).error ??
            'Exercise saved — could not start rest. Use Retry rest timer.',
          completeFailure: 'rest',
        }))
        return
      }
      const rest = await restRes.json()
      const startMs = now.getTime()
      setState({
        phase: 'rest_running',
        activeExerciseLabel: null,
        restId: rest.id,
        startedAt: startMs,
        plannedMs: FIXED_REST_MS,
        remainingMs: FIXED_REST_MS,
        completeError: null,
        completeFailure: null,
      })
      onSessionMutated?.()
    } catch {
      setApiError('Network error — try again')
    } finally {
      setCompleting(false)
    }
  }, [sessionId, state.activeExerciseLabel, completing, onSessionMutated])

  const retryStartRestAfterExercise = useCallback(async () => {
    if (completing) return
    setCompleting(true)
    setApiError(null)
    try {
      const now = new Date()
      const restRes = await fetch(`/api/sessions/${sessionId}/rests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_duration_ms: FIXED_REST_MS,
          started_at: now.toISOString(),
        }),
      })
      if (!restRes.ok) {
        setState((s) => ({
          ...s,
          completeError: 'Could not start rest. Try Retry again.',
          completeFailure: 'rest',
        }))
        return
      }
      const rest = await restRes.json()
      const startMs = now.getTime()
      setState({
        phase: 'rest_running',
        activeExerciseLabel: null,
        restId: rest.id,
        startedAt: startMs,
        plannedMs: FIXED_REST_MS,
        remainingMs: FIXED_REST_MS,
        completeError: null,
        completeFailure: null,
      })
      onSessionMutated?.()
    } catch {
      setApiError('Network error — try again')
    } finally {
      setCompleting(false)
    }
  }, [sessionId, completing, onSessionMutated])

  const dismissAlarm = useCallback(async () => {
    stopAlarmLoop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    let rid: string | null = null
    setState((prev) => {
      rid = prev.restId
      return catalogReset()
    })
    if (rid) {
      try {
        await fetch(`/api/sessions/${sessionId}/rests/${rid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outcome: 'completed',
            ended_at: new Date().toISOString(),
          }),
        })
        onSessionMutated?.()
      } catch {
        /* non-blocking */
      }
    }
  }, [sessionId, onSessionMutated])

  const stopRest = useCallback(async () => {
    stopAlarmLoop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    let rid: string | null = null
    setState((prev) => {
      rid = prev.restId
      return catalogReset()
    })
    if (rid) {
      try {
        await fetch(`/api/sessions/${sessionId}/rests/${rid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outcome: 'cancelled',
            ended_at: new Date().toISOString(),
          }),
        })
        onSessionMutated?.()
      } catch {
        /* non-blocking */
      }
    }
  }, [sessionId, onSessionMutated])

  return {
    state,
    apiError,
    completing,
    selectActiveExercise,
    cancelActiveExercise,
    completeExerciseOnly,
    completeCurrentExercise,
    retryStartRestAfterExercise,
    dismissAlarm,
    stopRest,
  }
}
