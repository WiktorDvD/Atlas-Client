import { optimalGameRamMb } from '@shared/jvm'
import type { JvmPreset, LaunchSettings } from '@shared/types'
import { useState } from 'react'
import { useApp } from '../stores/appStore'

type SettingsTab = 'game' | 'launcher' | 'privacy' | 'debug'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'game', label: 'Game' },
  { id: 'launcher', label: 'Launcher' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'debug', label: 'Debug' }
]

const presets: JvmPreset[] = ['default', 'custom']

function Toggle(props: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border border-white/8 bg-white/[0.02] px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-white">{props.label}</span>
        {props.hint ? <span className="mt-1 block text-xs text-[var(--muted)]">{props.hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        className={`relative mt-0.5 h-5 w-9 shrink-0 border transition-colors ${
          props.checked ? 'border-[var(--accent-play)] bg-[var(--accent-play)]' : 'border-white/25 bg-transparent'
        }`}
        onClick={() => props.onChange(!props.checked)}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 bg-white transition-all ${
            props.checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

export function SettingsPage() {
  const snap = useApp((s) => s.snap)
  const refresh = useApp((s) => s.refresh)
  const toast = useApp((s) => s.toast)
  const [tab, setTab] = useState<SettingsTab>('game')
  if (!snap) return null

  const settings = snap.settings
  const jvmMode: JvmPreset = settings.jvmPreset === 'custom' ? 'custom' : 'default'
  const launcherUpdateLabel =
    (snap.updater.phase === 'available' || snap.updater.phase === 'downloaded') && snap.updater.latestVersion
      ? `Update to ${snap.updater.latestVersion}`
      : ''

  const save = (patch: Partial<LaunchSettings>) => {
    void window.lunar
      .saveSettings({ ...settings, ...patch })
      .then(() => refresh())
      .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Save failed'))
  }

  const setRam = (mb: number) => {
    save({ maxRamMb: mb, minRamMb: mb })
  }

  const pickJava = () => {
    void window.lunar.browseJava().then((file) => {
      if (file) save({ javaPath: file, jvmPreset: 'custom' })
    })
  }

  const debugOn = Boolean(settings.debugMode ?? settings.showConsole)

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-7 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <nav className="riot-settings-tabs mt-5 flex gap-6 border-b border-white/10">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`riot-settings-tab ${tab === item.id ? 'riot-settings-tab-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-7 py-6">
        {tab === 'game' ? (
          <div className="max-w-xl space-y-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/50">Java &amp; RAM</p>
              <button
                className="text-sm text-[var(--muted)] hover:text-white"
                onClick={() => {
                  const ram = optimalGameRamMb(snap.memory.totalMb)
                  save({
                    maxRamMb: ram,
                    minRamMb: ram,
                    jvmPreset: 'default',
                    jvmArgs: '',
                    javaPath: ''
                  })
                }}
              >
                Reset defaults
              </button>
            </div>

            <label className="block text-sm font-medium">
              RAM allocation · {settings.maxRamMb} MB
              <input
                type="range"
                min={512}
                max={Math.max(2048, snap.memory.totalMb)}
                step={256}
                value={settings.maxRamMb}
                onChange={(e) => setRam(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--accent-play)]"
              />
            </label>
            <p className="text-xs text-[var(--muted)]">
              {snap.memory.freeMb} MB free / {snap.memory.totalMb} MB total
              {settings.maxRamMb > snap.memory.totalMb * 0.8 ? ' · high for this PC' : ''}
            </p>

            <div>
              <p className="text-sm font-medium">Java options</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    className="border border-white/15 px-3 py-1.5 text-sm capitalize"
                    style={{
                      background: jvmMode === preset ? '#fff' : 'transparent',
                      color: jvmMode === preset ? '#111' : undefined
                    }}
                    onClick={() => save({ jvmPreset: preset })}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {jvmMode === 'custom' ? (
              <div className="space-y-3">
                <label className="block text-sm">
                  JVM arguments
                  <textarea
                    className="mt-1 h-24 w-full border border-white/10 bg-transparent p-3 text-sm"
                    value={settings.jvmArgs}
                    placeholder="-XX:+UseG1GC ..."
                    onChange={(e) => save({ jvmArgs: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Java path
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center justify-between gap-2 border border-white/10 bg-transparent px-3 py-2.5 text-left text-sm hover:bg-white/5"
                    onClick={pickJava}
                    title="Choose java.exe"
                  >
                    <span className={`min-w-0 truncate ${settings.javaPath ? '' : 'text-[var(--muted)]'}`}>
                      {settings.javaPath || 'Click to select java.exe…'}
                    </span>
                    <span className="shrink-0 text-[var(--muted)]">Browse</span>
                  </button>
                </label>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">Using Optic’s bundled Java with default flags.</p>
            )}
          </div>
        ) : null}

        {tab === 'launcher' ? (
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/50">Launcher</p>

            <Toggle
              label="Close launcher when game starts"
              hint="Quit Optic after Minecraft launches successfully."
              checked={settings.closeOnLaunch}
              onChange={(closeOnLaunch) => save({ closeOnLaunch })}
            />
            <Toggle
              label="Keep launcher open"
              hint="Stay in the tray/window while the game runs."
              checked={settings.keepOpen}
              onChange={(keepOpen) => save({ keepOpen })}
            />
            <Toggle
              label="Fullscreen game"
              checked={settings.fullscreen}
              onChange={(fullscreen) => save({ fullscreen })}
            />
            <Toggle
              label="Borderless window"
              checked={settings.borderless}
              onChange={(borderless) => save({ borderless })}
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Width
                <input
                  type="number"
                  className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm"
                  value={settings.width}
                  onChange={(e) => save({ width: Number(e.target.value) || 1280 })}
                />
              </label>
              <label className="block text-sm">
                Height
                <input
                  type="number"
                  className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm"
                  value={settings.height}
                  onChange={(e) => save({ height: Number(e.target.value) || 720 })}
                />
              </label>
            </div>

            <div className="border-t border-white/8 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-[var(--muted)]">
                  Launcher {snap.updater.version}: {snap.updater.status || 'Not checked yet'}
                </p>
                {launcherUpdateLabel ? (
                  <button
                    className="px-3 py-1 text-sm font-semibold text-[#07110a]"
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
              {snap.updater.phase === 'downloading' ? (
                <div className="mt-2 h-1 overflow-hidden bg-white/10">
                  <div
                    className="h-full"
                    style={{ width: `${snap.updater.percent}%`, background: 'var(--accent-play)' }}
                  />
                </div>
              ) : null}
              <button
                className="mt-3 border border-white/15 px-3 py-1.5 text-sm disabled:opacity-50"
                disabled={
                  snap.updater.phase === 'checking' ||
                  snap.updater.phase === 'downloading' ||
                  snap.updater.phase === 'installing'
                }
                onClick={() =>
                  void window.lunar
                    .checkUpdate()
                    .then((updater) => useApp.getState().applyUpdater(updater))
                    .catch((error: unknown) =>
                      toast(error instanceof Error ? error.message : 'Update check failed')
                    )
                }
              >
                Check for updates
              </button>
            </div>
          </div>
        ) : null}

        {tab === 'privacy' ? (
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/50">Privacy</p>
            <p className="mt-4 text-sm text-[var(--muted)]">Nothing here yet.</p>
          </div>
        ) : null}

        {tab === 'debug' ? (
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/50">Debug</p>

            <Toggle
              label="Backup launcher settings"
              hint="Copies settings.json into backups/ before each launch."
              checked={Boolean(settings.backupLauncherSettings)}
              onChange={(backupLauncherSettings) => save({ backupLauncherSettings })}
            />
            <Toggle
              label="Backup game settings"
              hint="Copies options.txt and related files before each launch."
              checked={Boolean(settings.backupGameSettings)}
              onChange={(backupGameSettings) => save({ backupGameSettings })}
            />
            <Toggle
              label="Launch Minecraft in debug mode"
              hint="Opens the Optic console when you press Play."
              checked={debugOn}
              onChange={(debugMode) => save({ debugMode, showConsole: debugMode })}
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                className="border border-white/15 px-3 py-1.5 text-sm"
                onClick={() =>
                  void window.lunar
                    .backupLauncherSettings()
                    .then(() => toast('Launcher backup saved'))
                    .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Backup failed'))
                }
              >
                Backup launcher now
              </button>
              <button
                className="border border-white/15 px-3 py-1.5 text-sm"
                onClick={() =>
                  void window.lunar
                    .backupGameSettings()
                    .then(() => toast('Game settings backup saved'))
                    .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Backup failed'))
                }
              >
                Backup game now
              </button>
              <button
                className="border border-white/15 px-3 py-1.5 text-sm"
                onClick={() =>
                  void window.lunar
                    .openBackupsFolder()
                    .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Could not open folder'))
                }
              >
                Open backups folder
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
