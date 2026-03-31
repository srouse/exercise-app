"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SessionWithChildren } from "@/lib/sessionTypes";
import { EXERCISE_PRESET_GROUPS } from "@/lib/exercisePresets";
import { buildSessionTimeline } from "@/lib/sessionTimeline";
import SessionActivityTimeline from "@/components/SessionActivityTimeline";
import ExerciseAccordion from "@/components/ExerciseAccordion";
import { useWorkoutSession } from "@/hooks/useWorkoutSession";
import TimerDisplay from "@/components/TimerDisplay";
import styles from "./SessionView.module.css";

interface Props {
  session: SessionWithChildren;
}

/**
 * US2 edge case: accordion selection only updates local active exercise (`selectActiveExercise`);
 * **Complete** logs the exercise only; **Complete and rest** chains exercise POST then rest POST.
 */
export default function SessionView({ session }: Props) {
  const router = useRouter();
  const refreshSession = useCallback(() => {
    router.refresh();
  }, [router]);
  const {
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
  } = useWorkoutSession(session.id, {
    session,
    onSessionMutated: refreshSession,
  });

  const timeline = useMemo(() => buildSessionTimeline(session), [session]);

  const [endingSession, setEndingSession] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

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

  if (state.phase === "rest_running") {
    return (
      <div
        className={styles.exerciseFullscreen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rest-focus-title"
        aria-live="polite"
      >
        <div className={styles.exerciseFullscreenInner}>
          <p className={styles.exerciseFullscreenEyebrow}>Rest</p>
          <h1 id="rest-focus-title" className={styles.restFullscreenTitle}>
            Resting…
          </h1>
          <div className={styles.restFullscreenTimer}>
            <TimerDisplay remainingMs={state.remainingMs ?? 0} />
          </div>
          <div className={styles.exerciseFullscreenActions}>
            <button type="button" className={styles.stopButton} onClick={stopRest}>
              Stop
            </button>
          </div>
          <div className={styles.exerciseFullscreenFooter}>
            <button
              type="button"
              className={styles.endButtonInline}
              onClick={handleEndSession}
              disabled={endingSession}
            >
              {endingSession ? "Ending…" : "End session"}
            </button>
          </div>
        </div>

        {(apiError || networkError) && (
          <div className={styles.errorBannerFloating} role="status">
            {apiError || networkError}
          </div>
        )}
      </div>
    );
  }

  if (state.phase === "exercise_active" && state.activeExerciseLabel) {
    const label = state.activeExerciseLabel;
    const restBlocked = state.completeFailure === "rest";

    return (
      <div
        className={styles.exerciseFullscreen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-focus-title"
        aria-describedby="exercise-focus-hint"
      >
        <div className={styles.exerciseFullscreenInner}>
          <p className={styles.exerciseFullscreenEyebrow}>Now</p>
          <h1
            id="exercise-focus-title"
            className={styles.exerciseFullscreenTitle}
          >
            {label}
          </h1>

          {state.completeError && (
            <p className={styles.exerciseFullscreenError} role="alert">
              {state.completeError}
            </p>
          )}

          <div className={styles.exerciseFullscreenActions}>
            {restBlocked && (
              <button
                type="button"
                className={styles.retryRestButton}
                onClick={() => void retryStartRestAfterExercise()}
                disabled={completing}
              >
                {completing ? "…" : "Retry rest timer"}
              </button>
            )}
            {!restBlocked && (
              <>
                <button
                  type="button"
                  className={styles.completeVerbButton}
                  onClick={() => void completeExerciseOnly()}
                  disabled={completing || !label}
                >
                  {completing ? "…" : "Complete"}
                </button>
                <button
                  type="button"
                  className={styles.completedButton}
                  onClick={() => void completeCurrentExercise()}
                  disabled={completing || !label}
                >
                  {completing ? "…" : "Complete and rest"}
                </button>
              </>
            )}
            <button
              type="button"
              className={styles.cancelExerciseButton}
              onClick={cancelActiveExercise}
              disabled={completing}
            >
              Cancel
            </button>
          </div>

          <div className={styles.exerciseFullscreenFooter}>
            <button
              type="button"
              className={styles.endButtonInline}
              onClick={handleEndSession}
              disabled={endingSession}
            >
              {endingSession ? "Ending…" : "End session"}
            </button>
          </div>
        </div>

        {(apiError || networkError) && (
          <div className={styles.errorBannerFloating} role="status">
            {apiError || networkError}
          </div>
        )}
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

      {state.phase === "catalog" && (
        <section className={styles.mainSection}>
          <div className={styles.catalogTop}>
            <ExerciseAccordion
              groups={EXERCISE_PRESET_GROUPS}
              selectedExerciseLabel={state.activeExerciseLabel}
              onSelectExercise={selectActiveExercise}
              disabled={false}
            />
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

      {(apiError || networkError) && (
        <div className={styles.errorBanner} role="status">
          {apiError || networkError}
        </div>
      )}
    </div>
  );
}
