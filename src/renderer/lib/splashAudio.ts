/** Procedural splash SFX — no asset files needed. */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  start: number,
  freq: number,
  duration: number,
  type: OscillatorType,
  gainPeak: number,
  freqEnd?: number
): void {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 4200
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function noiseBurst(start: number, duration: number, gainPeak: number, lowpass = 1800): void {
  const ac = audio()
  if (!ac) return
  const frames = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = lowpass
  filter.Q.value = 0.7
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ac.destination)
  src.start(start)
  src.stop(start + duration + 0.02)
}

/** Soft whoosh when OPTIC collapses into O. */
export function playCompressWhoosh(): void {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  noiseBurst(t, 0.45, 0.18, 900)
  tone(t, 220, 0.5, 'sine', 0.08, 90)
  tone(t + 0.05, 440, 0.35, 'triangle', 0.04, 160)
}

/** Clock-like ticks while the needle spins. */
export function playNeedleSpin(durationSec = 1.6): void {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime
  const ticks = 12
  for (let i = 0; i < ticks; i++) {
    const t = t0 + (i / ticks) * durationSec
    const peak = 0.035 + (i / ticks) * 0.04
    tone(t, 880 + i * 18, 0.05, 'square', peak, 420)
    noiseBurst(t, 0.04, peak * 0.6, 2400)
  }
  // low rumble under the spin
  tone(t0, 70, durationSec * 0.9, 'sine', 0.05, 55)
}

/** Settle / ready chime when splash finishes. */
export function playResolveChime(): void {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  tone(t, 523.25, 0.22, 'sine', 0.09) // C5
  tone(t + 0.08, 659.25, 0.28, 'sine', 0.08) // E5
  tone(t + 0.16, 783.99, 0.45, 'triangle', 0.07) // G5
  noiseBurst(t + 0.05, 0.2, 0.05, 1200)
}

/** Soft boot thud when splash appears. */
export function playBootHit(): void {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  tone(t, 90, 0.35, 'sine', 0.12, 45)
  noiseBurst(t, 0.18, 0.1, 500)
}
