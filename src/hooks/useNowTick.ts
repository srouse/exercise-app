import { useEffect, useState } from 'react';

/** Drives countdown UI without persisting every tick. */
export function useNowTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (active) setNow(Date.now());
  }, [active]);

  return now;
}
