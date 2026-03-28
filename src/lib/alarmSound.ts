let ctx: AudioContext | null = null;
let unlocked = false;

export function unlockAudio(): void {
  if (unlocked) return;
  try {
    ctx = new AudioContext();
    unlocked = true;
  } catch {
    /* ignore */
  }
}

export function playAlarmBeep(): void {
  if (!ctx || ctx.state === 'closed') return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

export async function resumeAudioContext(): Promise<void> {
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume();
  }
}
