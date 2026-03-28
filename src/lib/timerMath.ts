export function remainingMsFromEndsAt(nowMs: number, endsAtMs: number): number {
  return Math.max(0, endsAtMs - nowMs);
}

export function formatMmSs(totalMs: number): string {
  const s = Math.ceil(totalMs / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
