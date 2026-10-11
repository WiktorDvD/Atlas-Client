import { useState } from 'react'
import { optimalGameRamMb } from '@shared/jvm'
import type { JvmPreset, LaunchSettings } from '@shared/types'
import { useApp } from '../stores/appStore'

const presets: JvmPreset[] = ['default', 'aikar', 'low', 'zgc', 'pvp', 'custom']

export function SettingsPage() {
  const snap = useApp((s) => s.snap)
  const refresh = useApp((s) => s.refresh)
  const toast = useApp((s) => s.toast)
  const [preview, setPreview] = useState('')
  const [javaInfo, setJavaInfo] = useState('')
  if (!snap) return null
  const settings = snap.settings
  const launcherUpdateLabel =
    (snap.updater.phase === 'available' || snap.updater.phase === 'downloaded') && snap.updater.latestVersion
      ? `Update to ${snap.updater.latestVersion}`
      : ''
  const save = (patch: Partial<LaunchSettings>) => {
    void window.lunar.saveSettings({ ...settings, ...patch }).then(() => refresh()).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Save failed'))
  }
  return (
    <section className="glass h-full overflow-auto rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <button className="text-sm text-[var(--muted)]" onClick={() => {
          const ram = optimalGameRamMb(snap.memory.totalMb)
          void window.lunar.saveSettings({ ...settings, maxRamMb: ram, minRamMb: ram, jvmPreset: 'default', jvmArgs: '', gameArgs: '', width: 1280, height: 720, fullscreen: false }).then(() => refresh())
        }}>
          Reset launch defaults
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        RAM: {snap.memory.freeMb} MB free / {snap.memory.totalMb} MB total
        {settings.maxRamMb > snap.memory.totalMb * 0.8 ? ' · warning: max RAM is most of system memory' : ''}
      </p>
      <label className="mt-4 block text-sm">Max RAM {settings.maxRamMb} MB
        <input type="range" min={512} max={Math.max(2048, snap.memory.totalMb)} step={256} value={settings.maxRamMb} onChange={(e) => save({ maxRamMb: Number(e.target.value) })} className="w-full" />
      </label>
      <label className="mt-2 block text-sm">Min RAM {settings.minRamMb} MB
        <input type="range" min={256} max={settings.maxRamMb} step={128} value={settings.minRamMb} onChange={(e) => save({ minRamMb: Number(e.target.value) })} className="w-full" />
      </label>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Default heap is 4 GB (or 30% of system RAM, minimum 2 GB). Bundled Graal PVP Java commits that amount at start (Xms=Xmx) so the heap never grows mid-fight.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button key={preset} className="rounded-full px-3 py-1 text-sm" style={{ background: settings.jvmPreset === preset ? 'var(--accent)' : 'transparent', border: '1px solid var(--line)' }} onClick={() => save({ jvmPreset: preset })}>
            {preset}
          </button>
        ))}
      </div>
      <textarea className="mt-3 h-24 w-full rounded-xl border border-white/10 bg-transparent p-3 text-sm" value={settings.jvmArgs} placeholder="Extra JVM arguments" onChange={(e) => save({ jvmArgs: e.target.value, jvmPreset: settings.jvmPreset === 'default' ? 'custom' : settings.jvmPreset })} />
      <textarea className="mt-2 h-16 w-full rounded-xl border border-white/10 bg-transparent p-3 text-sm" value={settings.gameArgs} placeholder="Game arguments" onChange={(e) => save({ gameArgs: e.target.value })} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <input className="rounded-xl border border-white/10 bg-transparent px-3 py-2" type="number" value={settings.width} onChange={(e) => save({ width: Number(e.target.value) })} />
        <input className="rounded-xl border border-white/10 bg-transparent px-3 py-2" type="number" value={settings.height} onChange={(e) => save({ height: Number(e.target.value) })} />
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.fullscreen} onChange={(e) => save({ fullscreen: e.target.checked })} /> Fullscreen</label>
      <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.showConsole} onChange={(e) => save({ showConsole: e.target.checked })} /> Show console on launch</label>
      <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.closeOnLaunch} onChange={(e) => save({ closeOnLaunch: e.target.checked, keepOpen: !e.target.checked })} /> Close launcher after the game starts</label>
      <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.keepOpen} onChange={(e) => save({ keepOpen: e.target.checked, closeOnLaunch: !e.target.checked })} /> Keep launcher open</label>
      <div className="mt-3 text-sm">Environment
        {settings.env.map((pair, index) => (
          <div key={index} className="mt-1 flex gap-2">
            <input className="w-1/3 rounded-xl border border-white/10 bg-transparent px-3 py-2" value={pair.key} placeholder="KEY" onChange={(e) => {
              const env = settings.env.map((item, i) => i === index ? { ...item, key: e.target.value } : item)
              save({ env })
            }} />
            <input className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2" value={pair.value} placeholder="value" onChange={(e) => {
              const env = settings.env.map((item, i) => i === index ? { ...item, value: e.target.value } : item)
              save({ env })
            }} />
            <button className="text-sm" onClick={() => save({ env: settings.env.filter((_, i) => i !== index) })}>Remove</button>
          </div>
        ))}
        <button className="mt-2 text-sm" onClick={() => save({ env: [...settings.env, { key: '', value: '' }] })}>Add variable</button>
      </div>
      <label className="mt-3 block text-sm">On launch
        <select className="ml-2 rounded-lg bg-transparent" value={settings.onLaunch} onChange={(e) => save({ onLaunch: e.target.value as LaunchSettings['onLaunch'] })}>
          <option value="stay">Stay open</option>
          <option value="minimize">Minimize</option>
          <option value="tray">Hide to tray</option>
        </select>
      </label>
      <label className="mt-3 block text-sm">Theme
        <select className="ml-2 rounded-lg bg-transparent" value={settings.theme} onChange={(e) => save({ theme: e.target.value as 'dark' | 'light' })}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>
      <label className="mt-2 block text-sm">Accent <input type="color" value={settings.accent} onChange={(e) => save({ accent: e.target.value })} /></label>
      <label className="mt-3 block text-sm">Java (17+ required)
        <input className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2" value={settings.javaPath} onChange={(e) => save({ javaPath: e.target.value })} />
      </label>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Default is GraalVM CE 17 + 1ms timer agent with light G1 flags (no over-tuned JVM stack). Installs into %APPDATA%\.lunar-remake\runtimes\mc-pvp-java17.
      </p>
      <label className="mt-3 block text-sm">PVP kit (optional — leave empty with bundled PVP Java)
        <input className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2" value={settings.pvpKitPath} onChange={(e) => save({ pvpKitPath: e.target.value })} placeholder="Only needed for a plain JDK" />
      </label>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Bundled PVP Java already loads the timer agent, commits Xms=Xmx, raises process priority, and uses a short-pause G1 profile. Match Min RAM to Max RAM on a plain JDK for the same heap behavior. Only set a kit folder if you point Java at a plain JDK instead.
      </p>
      <div className="mt-2 flex gap-2">
        <button className="rounded-xl border border-white/15 px-3 py-1 text-sm" onClick={() => void window.lunar.browseJava().then((file) => file && save({ javaPath: file }))}>Browse</button>
        <button className="rounded-xl border border-white/15 px-3 py-1 text-sm" onClick={() => void window.lunar.testJava(settings.javaPath).then((info) => setJavaInfo(`${info.version} ${info.arch}`)).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Test failed'))}>Test</button>
        <span className="text-sm text-[var(--muted)]">{javaInfo}</span>
      </div>
      <label className="mt-3 block text-sm">Dev runtime (local remake folder)
        <input className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2" value={settings.devRuntime} onChange={(e) => save({ devRuntime: e.target.value })} />
      </label>
      <label className="mt-3 block text-sm">Pre-launch
        <input className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2" value={settings.preLaunch} onChange={(e) => save({ preLaunch: e.target.value })} />
      </label>
      <label className="mt-2 block text-sm">Post-exit
        <input className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2" value={settings.postExit} onChange={(e) => save({ postExit: e.target.value })} />
      </label>
      <label className="mt-2 block text-sm">Wrapper command
        <input className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2" value={settings.wrapper} onChange={(e) => save({ wrapper: e.target.value })} />
      </label>
      <button className="mt-4 rounded-xl px-4 py-2 text-sm text-white" style={{ background: 'var(--accent)' }} onClick={() => void window.lunar.preview().then((result) => setPreview(result.command)).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Preview failed'))}>
        Preview command
      </button>
      {preview ? (
        <div className="mt-2 flex gap-2">
          <pre className="max-h-32 flex-1 overflow-auto rounded-xl bg-black/30 p-3 text-xs">{preview}</pre>
          <button className="text-sm" onClick={() => void navigator.clipboard.writeText(preview)}>Copy</button>
        </div>
      ) : null}
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-[var(--muted)]">
            Launcher {snap.updater.version}: {snap.updater.status || 'Not checked yet'}
          </p>
          {launcherUpdateLabel ? (
            <button
              className="rounded-xl px-3 py-1 text-sm text-white"
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
        {snap.updater.phase === 'downloading' ? (
          <div className="mt-1 h-1 overflow-hidden rounded bg-white/10">
            <div className="h-full" style={{ width: `${snap.updater.percent}%`, background: 'var(--accent)' }} />
          </div>
        ) : null}
        <div className="mt-2 flex gap-2">
          <button
            className="rounded-xl border border-white/15 px-3 py-1 text-sm disabled:opacity-50"
            disabled={snap.updater.phase === 'checking' || snap.updater.phase === 'downloading' || snap.updater.phase === 'installing'}
            onClick={() =>
              void window.lunar
                .checkUpdate()
                .then((updater) => useApp.getState().applyUpdater(updater))
                .catch((error: unknown) => toast(error instanceof Error ? error.message : 'Update check failed'))
            }
          >
            Check for updates
          </button>
        </div>
      </div>
    </section>
  )
}
