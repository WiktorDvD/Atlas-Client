import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'
import wordmark from '../assets/optic-wordmark.png'
import { playBootHit, playCompressWhoosh, playNeedleSpin, playResolveChime } from '../lib/splashAudio'

type Phase = 'boot' | 'wordmark' | 'compress' | 'spin' | 'hold' | 'out'

export function SplashScreen(props: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('boot')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let cancelled = false
    // Unlock audio on first paint (Electron allows this without a gesture).
    playBootHit()

    const timers = [
      window.setTimeout(() => {
        if (!cancelled) setPhase('wordmark')
      }, 180),
      window.setTimeout(() => {
        if (cancelled) return
        setPhase('compress')
        playCompressWhoosh()
      }, 1100),
      window.setTimeout(() => {
        if (cancelled) return
        setPhase('spin')
        playNeedleSpin(1.55)
      }, 1750),
      window.setTimeout(() => {
        if (cancelled) return
        setPhase('hold')
        playResolveChime()
      }, 3400),
      window.setTimeout(() => {
        if (!cancelled) setPhase('out')
      }, 4000),
      window.setTimeout(() => {
        if (cancelled) return
        setVisible(false)
        props.onDone()
      }, 4550)
    ]
    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  const showWord = phase === 'boot' || phase === 'wordmark' || phase === 'compress'
  const showO = phase === 'compress' || phase === 'spin' || phase === 'hold' || phase === 'out'
  const spinning = phase === 'spin'
  const exiting = phase === 'out'

  return (
    <div className={`splash-root ${exiting ? 'splash-out' : ''}`} aria-hidden>
      <div className="splash-glow" />
      <div className="splash-stage">
        {showWord ? (
          <img
            src={wordmark}
            alt=""
            className={`splash-wordmark splash-wordmark-${phase}`}
            draggable={false}
          />
        ) : null}

        {showO ? (
          <div className={`splash-o-wrap splash-o-${phase}`}>
            <img
              src={logo}
              alt=""
              className={`splash-o-mark ${spinning ? 'splash-o-mark-spin' : 'splash-o-mark-rest'}`}
              draggable={false}
            />
          </div>
        ) : null}
      </div>

      <div className={`splash-status splash-status-${phase}`}>
        {phase === 'boot' || phase === 'wordmark' ? 'Starting Optic…' : null}
        {phase === 'compress' ? 'Loading…' : null}
        {phase === 'spin' ? 'Calibrating…' : null}
        {phase === 'hold' || phase === 'out' ? 'Ready' : null}
      </div>
    </div>
  )
}
