import './AlarmSurface.css';

type Props = {
  onDismiss: () => void;
};

/** Full-area alarm: pulse unless prefers-reduced-motion (sustained). US1 / research.md */
export function AlarmSurface({ onDismiss }: Props) {
  return (
    <div className="alarm-surface" role="alert" aria-live="assertive">
      <div className="alarm-surface-inner">
        <p className="alarm-surface-title">Rest done</p>
        <button type="button" className="btn btn-primary alarm-done-btn" onClick={onDismiss}>
          Done
        </button>
      </div>
    </div>
  );
}
