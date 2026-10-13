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
  const toast = useApp((s) => s.toast)
  const setPage = useApp((s) => s.setPage)
  const openAccountMenu = useApp((s) => s.openAccountMenu)
  const [starting, setStarting] = useState(false)

  if (!snap) return <div className="skel m-4 h-40 rounded-2xl" />

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
      toast('Launching')
      const debug = Boolean(snap.settings.debugMode ?? snap.settings.showConsole)
      if (debug) setPage('console')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Launch failed')
    } finally {
      setStarting(false)
      useApp.setState({ progress: null })
    }
  }

  const downloading = starting && (Boolean(progress) || snap.client.kind === 'downloading')
  const ctaLabel = !account
    ? 'Sign In'
    : snap.launch.running
      ? 'Running'
      : downloading
        ? 'Updating'
        : starting
          ? 'Launching'
          : 'Play'

  const onCta = () => {
    if (!account) {
      openAccountMenu()
      return
    }
    void play()
  }

  const headline = 'Beta Test of Optic'
  const body = 'Welcome to Optic'

  const DISCORD_URL = 'https://discord.gg/'
  const YOUTUBE_URL = 'https://www.youtube.com/'

  const cards = [
    {
      key: 'discord',
      tag: 'Discord',
      title: 'Join the Optic Discord',
      tone: 'from-[#5865F2]/50 to-black/85',
      icon: 'discord' as const,
      onClick: () => window.open(DISCORD_URL, '_blank')
    },
    {
      key: 'youtube',
      tag: 'YouTube',
      title: 'Watch Optic on YouTube',
      tone: 'from-[#FF0000]/45 to-black/85',
      icon: 'youtube' as const,
      onClick: () => window.open(YOUTUBE_URL, '_blank')
    },
    {
      key: 'updates',
      tag: 'Updates',
      title: 'Beta Test of Optic',
      tone: 'from-emerald-900/80 to-black/80',
      icon: 'updates' as const,
      onClick: () => setPage('home')
    }
  ]

  const statusBits: string[] = []
  if (starting && !snap.launch.running) statusBits.push('Launching')
  else if (snap.launch.running) statusBits.push('Running')
  if (snap.client.kind === 'update') statusBits.push('Client update available')
  if (snap.updater.phase === 'available' || snap.updater.phase === 'downloaded') statusBits.push('Launcher update')
  if (progress) statusBits.push(progress.label)
  if (statusBits.length === 0) statusBits.push(snap.client.message || 'Ready')

  return (
    <div className="valorant-stage relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="valorant-art pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-8 pb-7 pt-10">
        {/* Featured story — left, mid-upper like Riot */}
        <div className="max-w-[420px]">
          <h1 className="text-[28px] font-extrabold uppercase leading-[1.15] tracking-[0.04em] text-white sm:text-[34px]">
            {headline}
          </h1>
          <p className="mt-3 line-clamp-4 text-[13px] leading-relaxed text-white/75">{body}</p>
          <button
            className="mt-5 rounded-full bg-white px-5 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-black transition hover:bg-white/90"
            onClick={() => setPage('home')}
          >
            View updates
          </button>
        </div>

        {/* Bottom action row */}
        <div className="mt-auto flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex shrink-0 flex-col gap-2">
            <motion.button
              whileHover={{ scale: snap.launch.running || starting ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={Boolean(account) && (snap.launch.running || starting)}
              onClick={onCta}
              className="riot-play disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M8 5.5v13l11-6.5L8 5.5z" />
              </svg>
              <span>{ctaLabel}</span>
            </motion.button>

            {progress ? (
              <div className="w-[200px] text-[11px] text-white/55">
                {progress.label} · {formatBytes(progress.speedBps)}
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${
                        progress.overallTotal ? (progress.overallReceived / progress.overallTotal) * 100 : 0
                      }%`,
                      background: 'var(--accent-play)'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[12px] text-white/55">
                <span className="inline-block h-2 w-2 rounded-sm bg-amber-400" />
                <span>
                  {statusBits.length} Status Update{statusBits.length === 1 ? '' : 's'}
                  <span className="text-white/35"> · {statusBits[0]}</span>
                </span>
              </div>
            )}

            {launcherUpdateLabel ? (
              <button
                className="w-fit rounded px-2 py-0.5 text-[11px] font-semibold text-[#07110a]"
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

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-[640px]">
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                className="valorant-card group text-left"
                onClick={card.onClick}
              >
                <div className={`valorant-card-media flex items-center justify-center bg-gradient-to-br ${card.tone}`}>
                  {card.icon === 'discord' ? (
                    <svg viewBox="0 0 24 24" className="h-9 w-9 text-white/90" fill="currentColor">
                      <path d="M20.3 4.4A19 19 0 0 0 15.9 3l-.2.4a17.4 17.4 0 0 1 4 2 14.6 14.6 0 0 0-13.4 0 17.4 17.4 0 0 1 4-2L10.1 3A19 19 0 0 0 5.7 4.4C2.3 9.4 1.5 14.2 1.8 18.9A19.2 19.2 0 0 0 7.6 21l1-1.3a12.4 12.4 0 0 1-1.9-.9l.5-.4a13.4 13.4 0 0 0 11.6 0l.5.4c-.6.4-1.2.7-1.9.9L16.4 21a19.2 19.2 0 0 0 5.8-2.1c.4-5.4-.7-10.1-1.9-14.5zM8.7 15.7c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2zm6.6 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2z" />
                    </svg>
                  ) : null}
                  {card.icon === 'youtube' ? (
                    <svg viewBox="0 0 24 24" className="h-9 w-9 text-white/90" fill="currentColor">
                      <path d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.6 12 4.6 12 4.6s-7.5 0-9.4.5A3 3 0 0 0 .5 7.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-4.8zM9.8 15.4V8.6L15.8 12l-6 3.4z" />
                    </svg>
                  ) : null}
                  {card.icon === 'updates' ? (
                    <svg viewBox="0 0 24 24" className="h-9 w-9 text-white/90" fill="currentColor">
                      <path d="M12 2a10 10 0 0 0-9.9 8.8H5a7 7 0 0 1 12.6-3.1L15 10h7V3l-2.6 2.6A9.9 9.9 0 0 0 12 2zm7.9 11.2H19a7 7 0 0 1-12.6 3.1L9 14H2v7l2.6-2.6A9.9 9.9 0 0 0 12 22a10 10 0 0 0 7.9-8.8z" />
                    </svg>
                  ) : null}
                  <span className="valorant-card-tag">{card.tag}</span>
                </div>
                <div className="valorant-card-title">{card.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
