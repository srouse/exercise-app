import { formatMmSs, remainingMsFromEndsAt } from '../lib/timerMath';

type Props = {
  remainingMs: number;
};

export function TimerDisplay({ remainingMs }: Props) {
  return <div className="timer-display">{formatMmSs(remainingMs)}</div>;
}

export function useRemainingForDisplay(
  nowMs: number,
  endsAt: number | undefined,
  phase: string,
): number {
  if (phase !== 'rest_running' || endsAt === undefined) return 0;
  return remainingMsFromEndsAt(nowMs, endsAt);
}
