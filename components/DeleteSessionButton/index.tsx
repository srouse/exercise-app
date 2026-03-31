'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import styles from './DeleteSessionButton.module.css'

type Props = {
  sessionId: string
  className?: string
}

export default function DeleteSessionButton({ sessionId, className }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const closeConfirm = useCallback(() => {
    if (busy) return
    setConfirmOpen(false)
    setError(null)
  }, [busy])

  useEffect(() => {
    if (!confirmOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmOpen, closeConfirm])

  async function handleConfirmDelete() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      setConfirmOpen(false)
      router.replace('/')
    } catch {
      setError('Could not delete. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${className ?? ''}`.trim()}
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        aria-label="Delete workout"
        aria-expanded={confirmOpen}
        aria-haspopup="dialog"
      >
        Delete workout
      </button>

      {confirmOpen && (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={closeConfirm}
        >
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-workout-title"
            aria-describedby="delete-workout-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-workout-title" className={styles.dialogTitle}>
              Delete this workout?
            </h2>
            <p id="delete-workout-desc" className={styles.dialogBody}>
              All exercises and rests logged in this session will be removed. This cannot be
              undone.
            </p>
            {error && (
              <p className={styles.dialogError} role="alert">
                {error}
              </p>
            )}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeConfirm}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleConfirmDelete}
                disabled={busy}
              >
                {busy ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
