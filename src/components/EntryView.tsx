type Props = {
  showContinue: boolean;
  onNewWorkout: () => void;
  onContinue: () => void;
};

export function EntryView({ showContinue, onNewWorkout, onContinue }: Props) {
  return (
    <div className="entry-view stack-gap">
      <h1 className="entry-title">Workout rest timer</h1>
      {showContinue ? (
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          Continue workout
        </button>
      ) : null}
      <button type="button" className="btn btn-primary" onClick={onNewWorkout}>
        New workout
      </button>
    </div>
  );
}
