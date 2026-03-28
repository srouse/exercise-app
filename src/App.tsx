import { useCallback } from 'react';
import { unlockAudio, resumeAudioContext } from './lib/alarmSound';
import { EntryView } from './components/EntryView';
import { SessionView } from './components/SessionView';
import { useWorkoutSession } from './hooks/useWorkoutSession';

export default function App() {
  const { state, dispatch } = useWorkoutSession();

  const onFirstGesture = useCallback(() => {
    unlockAudio();
    void resumeAudioContext();
  }, []);

  const showContinue = Boolean(state.sessionId) && state.lifecycle === 'ended';

  return (
    <div
      className="app-shell"
      onPointerDown={onFirstGesture}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFirstGesture();
      }}
      role="presentation"
    >
      {state.screen === 'entry' ? (
        <EntryView
          showContinue={showContinue}
          onContinue={() => dispatch({ type: 'CONTINUE_SESSION' })}
          onNewWorkout={() => dispatch({ type: 'NEW_SESSION' })}
        />
      ) : (
        <SessionView state={state} dispatch={dispatch} />
      )}
    </div>
  );
}
