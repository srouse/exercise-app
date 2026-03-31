'use client'

import { useCallback, useId, useState } from 'react'
import type { ExercisePresetGroup } from '@/lib/exercisePresets'
import styles from './ExerciseAccordion.module.css'

type Props = {
  groups: readonly ExercisePresetGroup[]
  /** Exactly one panel index expanded at a time; default 0 = first group */
  selectedExerciseLabel: string | null
  onSelectExercise: (label: string) => void
  /** When true (e.g. rest timer failed after exercise saved), selection is frozen until retry. */
  disabled?: boolean
}

/**
 * Single-open accordion by category. First group expanded on mount (FR-016/017).
 * Switching active exercise (replace selection, no server write until Complete) — spec / plan.
 */
export default function ExerciseAccordion({
  groups,
  selectedExerciseLabel,
  onSelectExercise,
  disabled = false,
}: Props) {
  const baseId = useId()
  const [expandedIndex, setExpandedIndex] = useState(0)

  const toggleGroup = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? prev : index))
  }, [])

  return (
    <div className={styles.root}>
      {groups.map((group, gi) => {
        const expanded = expandedIndex === gi
        const panelId = `${baseId}-panel-${gi}`
        const headerId = `${baseId}-header-${gi}`
        return (
          <div key={group.label} className={styles.group}>
            <button
              type="button"
              id={headerId}
              className={styles.groupHeader}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => toggleGroup(gi)}
            >
              <span className={styles.groupTitle}>{group.label}</span>
              <span className={styles.chevron} aria-hidden>
                {expanded ? '▾' : '▸'}
              </span>
            </button>
            {expanded && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className={styles.panel}
              >
                <ul className={styles.exerciseList}>
                  {group.exercises.map((name) => {
                    const isActive = selectedExerciseLabel === name
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          className={`${styles.exerciseRow} ${isActive ? styles.exerciseRowActive : ''}`}
                          aria-pressed={isActive}
                          disabled={disabled}
                          onClick={() => onSelectExercise(name)}
                        >
                          {name}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
