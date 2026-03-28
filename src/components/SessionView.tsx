import { useState } from "react";
import { AlarmSurface } from "./AlarmSurface";
import { TimerDisplay, useRemainingForDisplay } from "./TimerDisplay";
import { useNowTick } from "../hooks/useNowTick";
import type { SessionAction } from "../state/sessionReducer";
import type { WorkoutState } from "../lib/sessionTypes";

/** Constitution II: minimal choices; 0.1 / 1 / 2 min only. */
const REST_PRESETS = [
  { ms: 6_000, label: "0.1 min" },
  { ms: 60_000, label: "1 min" },
  { ms: 120_000, label: "2 min" },
] as const;

type Props = {
  state: WorkoutState;
  dispatch: (a: SessionAction) => void;
};

export function SessionView({ state, dispatch }: Props) {
  const [selectedMs, setSelectedMs] = useState<number>(60_000);
  const tick = useNowTick(state.phase === "rest_running");
  const remaining = useRemainingForDisplay(tick, state.restEndsAt, state.phase);

  return (
    <div className="session-view">
      {state.phase === "rest_alarm" ? (
        <AlarmSurface onDismiss={() => dispatch({ type: "ALARM_DONE" })} />
      ) : null}

      <div className="session-view-stage">
        <h1 className="entry-title session-view-heading">Session</h1>

        {state.phase === "exercise_idle" ? (
          <div className="session-view-presets">
            <div className="preset-row" aria-label="Rest length">
              {REST_PRESETS.map(({ ms, label }) => (
                <button
                  key={ms}
                  type="button"
                  className={`preset-btn${selectedMs === ms ? " selected" : ""}`}
                  onClick={() => setSelectedMs(ms)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="session-view-stage-body">
          {state.phase === "rest_running" ? (
            <TimerDisplay remainingMs={remaining} />
          ) : null}
        </div>
      </div>

      <div className="session-view-actions">
        {state.phase === "exercise_idle" ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              dispatch({ type: "START_REST", durationMs: selectedMs })
            }
          >
            Start rest
          </button>
        ) : null}

        {state.phase === "rest_running" ? (
          <button
            type="button"
            className="btn btn-stop"
            onClick={() => dispatch({ type: "REST_STOP" })}
          >
            Stop
          </button>
        ) : null}
        {/* US2: Stop dispatches REST_STOP — early end, no alarm; next Start rest after next exercise. */}

        {state.phase !== "rest_running" ? (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => dispatch({ type: "END_WORKOUT" })}
          >
            End workout
          </button>
        ) : null}
      </div>
    </div>
  );
}
