import { motion } from 'framer-motion'
import { useState } from 'react'
import { useApp } from '../stores/appStore'

function formatBytes(value: number): string {
  if (value > 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB/s`
  if (value > 1024) return `${(value / 1024).toFixed(0)} KB/s`
  return `${value.toFixed(0)} B/s`
}

export function PlayPage() {
  const snap = useApp((s) => s.snap)
  const progress = useApp((s) => s.progress)
  const login = useApp((s) => s.login)
  const toast = useApp((s) => s.toast)
  const refresh = useApp((s) => s.refresh)
  const setPage = useApp((s) => s.setPage)
  const [offline, setOffline] = useState('')
  const [addStep, setAddStep] = useState<'idle' | 'choose' | 'offline'>('idle')
  const [starting, setStarting] = useState(false)
  const closeAdd = () => {
    setOffline('')
    setAddStep('idle')
  }
  if (!snap) return <div className="skel h-40 rounded-2xl" />
  const account = snap.accounts.find((item) => item.id === snap.activeAccountId)
  const launcherUpdateLabel =
    (snap.updater.phase === 'available' || snap.updater.phase === 'downloaded') && snap.updater.latestVersion
      ? `Update to ${snap.updater.latestVersion}`
      : ''
  const play = async () => {
    setStarting(true)
    useApp.setState({ progress: null })
    try {
      await window.lunar.startGame()
      toast('Game starting')
      if (snap.settings.showConsole) setPage('console')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Launch failed')
    } finally {
      setStarting(false)
      useApp.setState({ progress: null })
    }
  }
  const downloading = starting && (Boolean(progress) || snap.client.kind === 'downloading')
  const playLabel = snap.launch.running ? 'RUNNING' : downloading ? 'DOWNLOADING' : starting ? 'STARTING' : 'LAUNCH'
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-black/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(92,255,138,0.12),transparent_42%)]" />

      <div className="relative flex items-start justify-between gap-4 px-8 pt-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Home</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Lunar Remake</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">{snap.client.message || 'Minecraft 1.8.9 · Java 21 PVP kit'}</p>
          {snap.updater.phase !== 'idle' ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-[var(--muted)]">{snap.updater.status}</p>
              {launcherUpdateLabel ? (
                <button
                  className="rounded-full px-3 py-1 text-xs font-semibold text-[#07110a]"
                  style={{ background: 'var(--accent)' }}
                  onClick={() =>
                    void window.lunar
                      .installUpdate()
                      .then((updater) => useApp.getState().applyUpdater(updater))
                      .catch((error: unknown) => toast(error instanceof Error ? error.message : 'Could not install update'))
                  }
                >
                  {launcherUpdateLabel}
                </button>
              ) : null}
            </div>
          ) : null}
          {snap.updater.phase === 'downloading' ? (
            <div className="mt-2 h-1 w-48 overflow-hidden rounded bg-white/10">
              <div className="h-full" style={{ width: `${snap.updater.percent}%`, background: 'var(--accent)' }} />
            </div>
          ) : null}
        </div>

        <div className="glass flex items-center gap-3 rounded-2xl px-3 py-2">
          {account ? (
            <img alt="" className="h-11 w-11 rounded-xl" src={`https://mc-heads.net/avatar/${account.uuid}/64`} />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-white/10" />
          )}
          <div>
            <div className="text-sm font-semibold">{account?.username ?? 'No account'}</div>
            <div className="text-xs text-[var(--muted)]">{account?.kind ?? 'Sign in to play'}</div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4">
        <motion.button
          whileHover={{ scale: snap.launch.running || starting ? 1 : 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => void play()}
          disabled={snap.launch.running || starting}
          className="play-orb h-[88px] w-[280px] rounded-full text-xl font-bold tracking-[0.18em] text-[#07110a] disabled:opacity-70"
        >
          {playLabel}
        </motion.button>
        {progress ? (
          <div className="w-80 text-center text-xs text-[var(--muted)]">
            {progress.label} · {formatBytes(progress.speedBps)} · ETA {Math.ceil(progress.etaSeconds)}s
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress.overallTotal ? (progress.overallReceived / progress.overallTotal) * 100 : 0}%`,
                  background: 'var(--accent)'
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">Version 1.8.9 · Zulu 21 · Badlion-like G1 PVP</p>
        )}
        <div className="flex gap-2">
          <button
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
            onClick={() =>
              void window.lunar
                .installClient()
                .then(() => refresh())
                .catch((error: unknown) => toast(error instanceof Error ? error.message : 'Download failed'))
            }
          >
            {snap.client.kind === 'update' ? 'Update client' : 'Download client'}
          </button>
          <button
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
            onClick={() =>
              void window.lunar
                .rollbackClient()
                .then(() => refresh())
                .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Rollback failed'))
            }
          >
            Rollback
          </button>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-4 px-6 pb-6">
        <article className="glass rounded-2xl p-4">
          <h2 className="text-sm font-semibold">News</h2>
          <p className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted)]">
            {snap.news[0]?.body || snap.client.changelog || 'No release notes yet.'}
          </p>
        </article>
        <article className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Account</h2>
            {addStep === 'idle' ? (
              <button
                className="rounded-lg px-3 py-1 text-sm font-semibold text-[#07110a]"
                style={{ background: 'var(--accent)' }}
                onClick={() => setAddStep('choose')}
              >
                Add
              </button>
            ) : (
              <button className="rounded-full border border-white/15 px-3 py-1 text-xs" onClick={closeAdd}>
                Back
              </button>
            )}
          </div>
          {login?.state === 'waiting' || login?.state === 'starting' ? (
            <p className="mt-2 text-sm">
              {login.message}
              {login.code ? (
                <>
                  {' '}
                  Code <span className="font-semibold">{login.code}</span>
                </>
              ) : null}
            </p>
          ) : null}
          {login?.state === 'error' ? <p className="mt-2 text-sm text-red-300">{login.message}</p> : null}
          {login?.state === 'success' ? <p className="mt-2 text-sm">{login.message}</p> : null}
          {addStep === 'choose' ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="rounded-lg border border-white/15 px-3 py-1 text-sm" onClick={() => setAddStep('offline')}>
                Offline account
              </button>
              <button
                className="rounded-lg px-3 py-1 text-sm font-semibold text-[#07110a]"
                style={{ background: 'var(--accent)' }}
                onClick={() => {
                  closeAdd()
                  void window.lunar.startMicrosoft()
                }}
              >
                Microsoft account
              </button>
            </div>
          ) : null}
          {addStep === 'offline' ? (
            <div className="mt-2 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-transparent px-2 text-sm"
                placeholder="Username"
                value={offline}
                onChange={(event) => setOffline(event.target.value)}
              />
              <button
                className="rounded-lg px-3 py-1 text-sm font-semibold text-[#07110a]"
                style={{ background: 'var(--accent)' }}
                onClick={() =>
                  void window.lunar
                    .addOffline(offline)
                    .then(() => {
                      closeAdd()
                      return refresh()
                    })
                    .catch((error: unknown) => toast(error instanceof Error ? error.message : 'Could not add account'))
                }
              >
                Confirm
              </button>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            {snap.accounts.map((item) => (
              <button
                key={item.id}
                className="rounded-full bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                onClick={() => void window.lunar.selectAccount(item.id).then(() => refresh())}
              >
                {item.username}
              </button>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
