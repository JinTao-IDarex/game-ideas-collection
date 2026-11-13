// ─── 极简合成音效（无音频资源，WebAudio 直出） ─────────────────────
let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
  const c = ac()
  if (!c) return
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export const sfx = {
  board: () => tone(520, 0.12, 'sine', 0.12),
  transfer: () => { tone(330, 0.1, 'sine', 0.1); tone(440, 0.12, 'sine', 0.1, 0.09) },
  lineDead: () => { tone(180, 0.35, 'triangle', 0.14); tone(120, 0.5, 'triangle', 0.12, 0.12) },
  warn: () => tone(660, 0.15, 'square', 0.06),
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'sine', 0.14, i * 0.13)) },
  lose: () => { [330, 262, 196].forEach((f, i) => tone(f, 0.4, 'triangle', 0.12, i * 0.18)) },
}
