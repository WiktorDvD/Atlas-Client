import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ServerEntry } from '@shared/types'
import logo from '../assets/logo.png'
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
  const [servers, setServers] = useState<ServerEntry[]>([])
  const closeAdd = () => {
    setOffline('')
    setAddStep('idle')
  }

  useEffect(() => {
    void window.lunar.listServers().then(setServers).catch(() => setServers([]))
  }, [])

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
      // ensureClientBeforePlay runs in main on launch — updates client automatically
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
  const playLabel = snap.launch.running
    ? 'RUNNING'
    : downloading
      ? 'UPDATING'
      : starting
        ? 'STARTING'
        : 'LAUNCH GAME'
  const newsItems = snap.news.length
    ? snap.news.slice(0, 4)
    : [
        {
          title: 'Atlas Client',
          body: snap.client.changelog || snap.client.message || 'Minecraft 1.8.9 · butter hitreg · sticky WASD'
        }
      ]

  return (
    <div className="flex h-full min-h-0 gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-auto pr-0.5">
        <motion.section
          className="hero-banner relative overflow-hidden rounded-3xl border border-white/8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="absolute -right-6 top-[-18%] h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl" />
            <div className="absolute bottom-[-28%] left-[8%] h-56 w-56 rounded-full bg-[var(--accent-play)]/15 blur-3xl" />
          </div>

          <div className="relative flex min-h-[280px] flex-col items-center justify-center gap-5 px-6 py-10 text-center">
            <img
              src={logo}
              alt="Atlas Client"
              className="h-20 w-20 object-contain drop-shadow-[0_12px_28px_rgba(62,198,255,0.3)]"
              draggable={false}
            />
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Atlas Client</h1>
              <p className="mt-2 text-sm text-white/60">
                {snap.client.message || 'Minecraft 1.8.9 with OptiFine'}
              </p>
            </div>

            {snap.updater.phase !== 'idle' ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <p className="text-xs text-[var(--muted)]">{snap.updater.status}</p>
                {launcherUpdateLabel ? (
                  <button
                    className="rounded-full px-3 py-1 text-xs font-semibold text-[#07110a]"
                    style={{ background: 'var(--accent-play)' }}
                    onClick={() =>
                      void window.lunar
                        .installUpdate()
                        .then((updater) => useApp.getState().applyUpdater(updater))
                        .catch((error: unknown) =>
                          toast(error instanceof Error ? error.message : 'Could not install update')
                        )
                    }
                  >
                    {launcherUpdateLabel}
                  </button>
                ) : null}
              </div>
            ) : null}
            {snap.updater.phase === 'downloading' ? (
              <div className="h-1 w-48 overflow-hidden rounded bg-white/10">
                <div className="h-full" style={{ width: `${snap.updater.percent}%`, background: 'var(--accent-play)' }} />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex h-11 items-center rounded-full border border-white/12 bg-black/35 px-4 text-sm font-medium">
                1.8.9
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/35 text-[var(--muted)] transition hover:bg-white/8 hover:text-white"
                title="Settings"
                onClick={() => setPage('settings')}
              >
                ⚙
              </button>
              <motion.button
                whileHover={{ scale: snap.launch.running || starting ? 1 : 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void play()}
                disabled={snap.launch.running || starting}
                className="launch-btn h-14 min-w-[220px] rounded-full px-10 text-[15px] disabled:cursor-not-allowed"
              >
                {playLabel}
              </motion.button>
            </div>

            {progress ? (
              <div className="w-full max-w-md text-center text-xs text-[var(--muted)]">
                Updating client · {progress.label} · {formatBytes(progress.speedBps)}
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress.overallTotal ? (progress.overallReceived / progress.overallTotal) * 100 : 0}%`,
                      background: 'var(--accent-play)'
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </motion.section>

        <section className="rise-in flex items-center gap-2" style={{ animationDelay: '60ms' }}>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5">
            {servers.length === 0 ? (
              <button
                className="server-chip flex h-12 shrink-0 items-center gap-2 rounded-xl px-3 text-xs text-[var(--muted)]"
                onClick={() => setPage('servers')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm">+</span>
                Add servers
              </button>
            ) : (
              servers.slice(0, 10).map((server) => (
                <button
                  key={server.id}
                  className="server-chip flex h-12 shrink-0 items-center gap-2 rounded-xl px-2.5"
                  title={`${server.name} · ${server.address}`}
                  onClick={() => setPage('servers')}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent-play)]/20 text-xs font-bold">
                    {server.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="max-w-[88px] truncate text-xs font-medium">{server.name}</span>
                </button>
              ))
            )}
          </div>
          <button
            className="server-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--muted)]"
            title="Edit servers"
            onClick={() => setPage('servers')}
          >
            ⚙
          </button>
        </section>

        <section className="rise-in" style={{ animationDelay: '110ms' }}>
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-sm font-semibold">Latest News</h2>
            <span className="text-[11px] text-[var(--muted)]">{newsItems.length} update{newsItems.length === 1 ? '' : 's'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {newsItems.map((item, index) => (
              <article key={`${item.title}-${index}`} className="news-card overflow-hidden rounded-xl">
                <div
                  className="relative h-20"
                  style={{
                    background: `linear-gradient(135deg, hsl(${185 + index * 24}, 60%, 28%), hsl(${150 + index * 18}, 45%, 16%))`
                  }}
                >
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[var(--accent-play)]" />
                  ) : null}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-[12px] font-semibold">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[var(--muted)]">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="hidden w-[220px] shrink-0 flex-col gap-3 lg:flex">
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center gap-3">
            {account ? (
              <img alt="" className="h-12 w-12 rounded-xl" src={`https://mc-heads.net/avatar/${account.uuid}/64`} />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-white/10" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{account?.username ?? 'No account'}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-play)]" />
                {account?.kind ?? 'Sign in to play'}
              </div>
            </div>
          </div>
        </div>

        <div className="glass flex min-h-0 flex-1 flex-col rounded-2xl p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Accounts</h2>
            {addStep === 'idle' ? (
              <button
                className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#07110a]"
                style={{ background: 'var(--accent-play)' }}
                onClick={() => setAddStep('choose')}
              >
                Add
              </button>
            ) : (
              <button className="rounded-md border border-white/12 px-2 py-0.5 text-[11px]" onClick={closeAdd}>
                Back
              </button>
            )}
          </div>

          {login?.state === 'waiting' || login?.state === 'starting' ? (
            <p className="mt-2 text-xs">
              {login.message}
              {login.code ? (
                <>
                  {' '}
                  Code <span className="font-semibold">{login.code}</span>
                </>
              ) : null}
            </p>
          ) : null}
          {login?.state === 'error' ? <p className="mt-2 text-xs text-red-300">{login.message}</p> : null}
          {login?.state === 'success' ? <p className="mt-2 text-xs">{login.message}</p> : null}

          {addStep === 'choose' ? (
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                className="rounded-lg border border-white/12 px-2 py-1.5 text-left text-xs hover:bg-white/5"
                onClick={() => setAddStep('offline')}
              >
                Offline account
              </button>
              <button
                className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#07110a]"
                style={{ background: 'var(--accent-play)' }}
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
            <div className="mt-2 flex flex-col gap-1.5">
              <input
                className="rounded-lg border border-white/12 bg-transparent px-2 py-1.5 text-xs"
                placeholder="Username"
                value={offline}
                onChange={(event) => setOffline(event.target.value)}
              />
              <button
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#07110a]"
                style={{ background: 'var(--accent-play)' }}
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

          <ul className="mt-2 space-y-1 overflow-auto">
            {snap.accounts.length === 0 ? (
              <li className="text-xs text-[var(--muted)]">No accounts yet.</li>
            ) : (
              snap.accounts.map((item) => (
                <li key={item.id}>
                  <button
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-white/5 ${
                      item.id === snap.activeAccountId ? 'bg-white/8' : ''
                    }`}
                    onClick={() => void window.lunar.selectAccount(item.id).then(() => refresh())}
                  >
                    <img alt="" className="h-6 w-6 rounded-md" src={`https://mc-heads.net/avatar/${item.uuid}/32`} />
                    <span className="truncate font-medium">{item.username}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <button
          className="glass rounded-2xl px-3 py-2.5 text-left text-xs text-[var(--muted)] transition hover:text-white"
          onClick={() => setPage('settings')}
        >
          Open settings →
        </button>
      </aside>

      <aside className="glass flex w-[180px] shrink-0 flex-col gap-2 overflow-auto rounded-2xl p-3 lg:hidden">
        <div className="flex items-center gap-2">
          {account ? (
            <img alt="" className="h-9 w-9 rounded-lg" src={`https://mc-heads.net/avatar/${account.uuid}/64`} />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-white/10" />
          )}
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">{account?.username ?? 'No account'}</div>
            <div className="text-[10px] text-[var(--muted)]">{account?.kind ?? 'Sign in'}</div>
          </div>
        </div>
        {addStep === 'idle' ? (
          <button
            className="rounded-md px-2 py-1 text-[11px] font-semibold text-[#07110a]"
            style={{ background: 'var(--accent-play)' }}
            onClick={() => setAddStep('choose')}
          >
            Add account
          </button>
        ) : (
          <button className="rounded-md border border-white/12 px-2 py-1 text-[11px]" onClick={closeAdd}>
            Back
          </button>
        )}
        {addStep === 'choose' ? (
          <div className="flex flex-col gap-1">
            <button
              className="rounded-lg border border-white/12 px-2 py-1 text-left text-[11px]"
              onClick={() => setAddStep('offline')}
            >
              Offline
            </button>
            <button
              className="rounded-lg px-2 py-1 text-left text-[11px] font-semibold text-[#07110a]"
              style={{ background: 'var(--accent-play)' }}
              onClick={() => {
                closeAdd()
                void window.lunar.startMicrosoft()
              }}
            >
              Microsoft
            </button>
          </div>
        ) : null}
        {addStep === 'offline' ? (
          <div className="flex flex-col gap-1">
            <input
              className="rounded-lg border border-white/12 bg-transparent px-2 py-1 text-[11px]"
              placeholder="Username"
              value={offline}
              onChange={(event) => setOffline(event.target.value)}
            />
            <button
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#07110a]"
              style={{ background: 'var(--accent-play)' }}
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
        <div className="flex flex-wrap gap-1">
          {snap.accounts.map((item) => (
            <button
              key={item.id}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] hover:bg-white/10"
              onClick={() => void window.lunar.selectAccount(item.id).then(() => refresh())}
            >
              {item.username}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
