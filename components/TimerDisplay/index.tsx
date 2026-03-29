'use client'

import styles from './TimerDisplay.module.css'

interface Props {
  remainingMs: number
}

function format(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TimerDisplay({ remainingMs }: Props) {
  const atZero = remainingMs <= 0
  return (
    <div className={styles.wrapper} aria-live="polite" aria-label={`${format(remainingMs)} remaining`}>
      <span className={styles.time} data-alarm={atZero}>
        {format(remainingMs)}
      </span>
    </div>
  )
}
