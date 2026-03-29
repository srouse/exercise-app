let alarmInterval: ReturnType<typeof setInterval> | null = null

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)

    osc.onended = () => ctx.close()
  } catch {
    // AudioContext blocked by policy or not available — fail silently
  }
}

export function playAlarmBeep() {
  playBeep()
}

export function startAlarmLoop() {
  if (alarmInterval !== null) return
  playBeep()
  alarmInterval = setInterval(playBeep, 2000)
}

export function stopAlarmLoop() {
  if (alarmInterval !== null) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
}
