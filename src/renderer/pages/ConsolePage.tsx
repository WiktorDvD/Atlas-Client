import { useEffect } from 'react'
import { useApp } from '../stores/appStore'

export function ConsolePage() {
  const lines = useApp((s) => s.consoleLines)
  const snap = useApp((s) => s.snap)
  const toast = useApp((s) => s.toast)
  useEffect(() => {
    void window.lunar.consoleLog().then((existing) => {
      for (const line of existing) useApp.getState().pushConsole(line)
    })
  }, [])
  const text = lines.map((line) => line.text).join('\n')
  return (
    <section className="glass flex h-full flex-col rounded-3xl p-4">
      <div className="mb-2 flex gap-2">
        <button className="rounded-lg border border-white/15 px-3 py-1 text-sm" onClick={() => void navigator.clipboard.writeText(text)}>Copy log</button>
        <button className="rounded-lg border border-white/15 px-3 py-1 text-sm" onClick={() => void window.lunar.openCrash().catch((e: unknown) => toast(e instanceof Error ? e.message : 'No crash report'))}>Open crash report</button>
        <button className="rounded-lg border border-white/15 px-3 py-1 text-sm" onClick={() => void window.lunar.stopGame()}>Stop</button>
        <span className="text-xs text-[var(--muted)]">{snap?.launch.running ? `pid ${snap.launch.pid}` : 'idle'}</span>
      </div>
      <pre className="flex-1 overflow-auto rounded-xl bg-black/40 p-3 text-xs leading-5">{text || 'Console is empty.'}</pre>
    </section>
  )
}
