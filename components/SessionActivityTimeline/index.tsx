import type { SessionTimelineEvent } from '@/lib/sessionTimeline'
import { formatTimelineTime, formatRestActivityLabel } from '@/lib/sessionTimeline'
import styles from './SessionActivityTimeline.module.css'

type Props = {
  events: SessionTimelineEvent[]
  emptyMessage: string
  /** e.g. narrow column on active session */
  className?: string
}

function eventKey(ev: SessionTimelineEvent) {
  return ev.kind === 'exercise' ? `e-${ev.item.id}` : `r-${ev.item.id}`
}

export default function SessionActivityTimeline({
  events,
  emptyMessage,
  className,
}: Props) {
  if (events.length === 0) {
    return (
      <p className={`${styles.empty} ${className ?? ''}`.trim()}>{emptyMessage}</p>
    )
  }

  return (
    <ul className={`${styles.list} ${className ?? ''}`.trim()}>
      {events.map((ev) => (
        <li key={eventKey(ev)} className={styles.item} data-kind={ev.kind}>
          {ev.kind === 'exercise' ? (
            <span className={styles.labelExercise}>{ev.item.label}</span>
          ) : (
            <span className={styles.labelRest}>
              {formatRestActivityLabel(ev.item)}
            </span>
          )}
          <span className={styles.time}>{formatTimelineTime(ev.at)}</span>
        </li>
      ))}
    </ul>
  )
}
