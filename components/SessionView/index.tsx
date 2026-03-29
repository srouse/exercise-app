"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SessionWithChildren } from "@/lib/sessionTypes";
import { EXERCISE_PRESET_GROUPS } from "@/lib/exercisePresets";
import { buildSessionTimeline } from "@/lib/sessionTimeline";
import SessionActivityTimeline from "@/components/SessionActivityTimeline";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import TimerDisplay from "@/components/TimerDisplay";
import styles from "./SessionView.module.css";

interface Props {
  session: SessionWithChildren;
}

export default function SessionView({ session }: Props) {
  const router = useRouter();
  const refreshSession = useCallback(() => {
    router.refresh();
  }, [router]);
  const { state, apiError, startRest, dismissAlarm, stopRest } =
    useWorkoutSession(session.id, { onSessionMutated: refreshSession });

  const timeline = useMemo(() => buildSessionTimeline(session), [session]);

  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [logStatus, setLogStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [endingSession, setEndingSession] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const closeExerciseModal = useCallback(() => {
    setExerciseModalOpen(false);
  }, []);

  useEffect(() => {
    if (!exerciseModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeExerciseModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exerciseModalOpen, closeExerciseModal]);

  async function logExerciseWithLabel(label: string) {
    setLogStatus("saving");
    setNetworkError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error("Failed to log exercise");
      closeExerciseModal();
      router.refresh();
      setLogStatus("saved");
      setTimeout(() => setLogStatus("idle"), 1500);
    } catch {
      setLogStatus("error");
      setNetworkError("Could not save exercise. Try again.");
    }
  }

  async function handleEndSession() {
    setEndingSession(true);
    setNetworkError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      if (!res.ok) throw new Error("Failed to end session");
      router.push("/");
    } catch {
      setNetworkError("Could not end session. Try again.");
      setEndingSession(false);
    }
  }

  // Alarm phase — full-surface overlay
  if (state.phase === "rest_alarm") {
    return (
      <div className={`${styles.alarmOverlay} alarm-flash`} role="alert">
        <p className={styles.alarmLabel}>Rest complete!</p>
        <TimerDisplay remainingMs={0} />
        <button className={styles.doneButton} onClick={dismissAlarm}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>
          ← Workouts
        </Link>
      </nav>

      {/* Rest running phase */}
      {state.phase === "rest_running" && (
        <section className={styles.restRunning}>
          <div className={styles.restRunningHeader}>
            <p className={styles.phaseLabel}>Resting…</p>
          </div>
          <div className={styles.restTimerCenter}>
            <TimerDisplay remainingMs={state.remainingMs ?? 0} />
          </div>
          <div className={styles.restRunningFooter}>
            <button className={styles.stopButton} onClick={stopRest}>
              Stop
            </button>
          </div>
        </section>
      )}

      {/* Exercise idle phase */}
      {state.phase === "exercise_idle" && (
        <section className={styles.idleSection}>
          <div className={styles.idleTop}>
            <button className={styles.startRestButton} onClick={startRest}>
              Start Rest
            </button>

            <div className={styles.logExercise}>
              <button
                type="button"
                className={styles.logButton}
                onClick={() => setExerciseModalOpen(true)}
                disabled={logStatus === "saving"}
              >
                {logStatus === "saving"
                  ? "…"
                  : logStatus === "saved"
                    ? "✓ Saved"
                    : "Log Exercise"}
              </button>
            </div>

            {exerciseModalOpen && (
            <div
              className={styles.modalBackdrop}
              role="presentation"
              onClick={closeExerciseModal}
            >
              <div
                className={styles.modalSheet}
                role="dialog"
                aria-modal="true"
                aria-labelledby="exercise-picker-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="exercise-picker-title" className={styles.modalTitle}>
                  Pick exercise
                </h2>
                <div className={styles.modalScroll}>
                  {EXERCISE_PRESET_GROUPS.map((group) => (
                    <section key={group.label} className={styles.modalGroup}>
                      <h3 className={styles.modalGroupLabel}>{group.label}</h3>
                      <ul
                        className={styles.modalList}
                        role="listbox"
                        aria-label={`${group.label} exercises`}
                      >
                        {group.exercises.map((name) => (
                          <li key={name}>
                            <button
                              type="button"
                              className={styles.modalRow}
                              disabled={logStatus === "saving"}
                              onClick={() => logExerciseWithLabel(name)}
                            >
                              {name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={closeExerciseModal}
                >
                  Cancel
                </button>
              </div>
            </div>
            )}
          </div>

          <div className={styles.activityRegion}>
            <div className={styles.activityScroll}>
              <SessionActivityTimeline
                events={timeline}
                emptyMessage="Nothing logged yet"
              />
            </div>
          </div>

          <button
            className={styles.endButton}
            onClick={handleEndSession}
            disabled={endingSession}
          >
            {endingSession ? "Ending…" : "End Session"}
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
  );
}
