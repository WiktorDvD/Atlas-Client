import { useEffect, useState } from 'react'
import type { ServerEntry, SkinEntry } from '@shared/types'
import { useApp } from '../stores/appStore'

export function InstancesPage() {
  const snap = useApp((s) => s.snap)
  const refresh = useApp((s) => s.refresh)
  const toast = useApp((s) => s.toast)
  const [name, setName] = useState('')
  if (!snap) return null
  return (
    <section className="cb-card h-full overflow-auto p-6">
      <h1 className="text-xl font-semibold">Profiles</h1>
      <div className="mt-4 flex gap-2">
        <input className="rounded-xl border border-white/10 bg-transparent px-3 py-2" value={name} placeholder="Name" onChange={(e) => setName(e.target.value)} />
        <button className="rounded-xl px-4 text-white" style={{ background: 'var(--accent)' }} onClick={() => void window.lunar.createInstance(name).then(() => refresh()).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))}>
          Create
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {snap.instances.map((instance) => (
          <li key={instance.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <button onClick={() => void window.lunar.selectInstance(instance.id).then(() => refresh())}>
              {instance.name} {instance.id === snap.activeInstanceId ? '· active' : ''}
            </button>
            <button className="text-xs text-[var(--muted)]" onClick={() => void window.lunar.deleteInstance(instance.id).then(() => refresh()).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ServersPage() {
  const [servers, setServers] = useState<ServerEntry[]>([])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [joining, setJoining] = useState<string | null>(null)
  const toast = useApp((s) => s.toast)
  const setPage = useApp((s) => s.setPage)
  const snap = useApp((s) => s.snap)

  useEffect(() => {
    void window.lunar.listServers().then(setServers).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))
  }, [toast])

  const joinAndLaunch = (server: ServerEntry) => {
    if (joining || snap?.launch.running) {
      toast(snap?.launch.running ? 'Game is already running' : 'Launch already started')
      return
    }
    if (!snap?.accounts.some((item) => item.id === snap.activeAccountId)) {
      toast('Sign in first, then double-click a server')
      useApp.getState().openAccountMenu()
      return
    }
    setJoining(server.id)
    void window.lunar
      .startGame(server.address)
      .then(() => {
        toast(`Launching → ${server.name}`)
        const debug = Boolean(snap.settings.debugMode ?? snap.settings.showConsole)
        if (debug) setPage('console')
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Launch failed'))
      .finally(() => setJoining(null))
  }

  return (
    <section className="cb-card h-full overflow-auto p-6">
      <h1 className="text-xl font-semibold">Servers</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Double-click a server to launch and join it. Click the icon to set a custom image.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="min-w-[140px] flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="min-w-[160px] flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#07110a]"
          style={{ background: 'var(--accent-play)' }}
          onClick={() =>
            void window.lunar
              .addServer(name, address)
              .then((next) => {
                setServers(next)
                setName('')
                setAddress('')
              })
              .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))
          }
        >
          Add
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {servers.map((server) => (
          <li
            key={server.id}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm transition hover:bg-white/8 ${
              joining === server.id ? 'ring-1 ring-[var(--accent-play)]/50' : ''
            }`}
            title="Double-click to launch & join"
            onDoubleClick={() => joinAndLaunch(server)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30 transition hover:border-[var(--accent)]"
                title="Change icon"
                onClick={(event) => {
                  event.stopPropagation()
                  void window.lunar
                    .chooseServerIcon(server.id)
                    .then(setServers)
                    .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Could not set icon'))
                }}
              >
                {server.iconUrl ? (
                  <img alt="" src={server.iconUrl} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--muted)]">
                    {server.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </button>
              <div className="min-w-0">
                <div className="truncate font-medium">{server.name}</div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {joining === server.id ? 'Launching…' : server.address}
                </div>
              </div>
            </div>
            <button
              className="shrink-0 text-xs text-[var(--muted)] hover:text-white"
              onClick={(event) => {
                event.stopPropagation()
                void window.lunar
                  .removeServer(server.id)
                  .then(setServers)
                  .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SkinsPage() {
  const [skins, setSkins] = useState<SkinEntry[]>([])
  const [ign, setIgn] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useApp((s) => s.toast)

  const reload = () =>
    window.lunar
      .listSkins()
      .then(setSkins)
      .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed to load skins'))

  useEffect(() => {
    void reload()
  }, [])

  const addIgn = () => {
    if (busy) return
    setBusy(true)
    void window.lunar
      .addSkinByIgn(ign)
      .then((next) => {
        setSkins(next)
        setIgn('')
        toast('Skin added')
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Could not add skin'))
      .finally(() => setBusy(false))
  }

  return (
    <section className="cb-card h-full overflow-auto p-6">
      <h1 className="text-xl font-semibold">Skins</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Add skins by Minecraft IGN or PNG, then click one to apply it.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="min-w-[160px] flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm"
          placeholder="Minecraft IGN"
          value={ign}
          maxLength={16}
          onChange={(e) => setIgn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addIgn()
          }}
        />
        <button
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#07110a] disabled:opacity-50"
          style={{ background: 'var(--accent-play)' }}
          disabled={busy || ign.trim().length < 3}
          onClick={addIgn}
        >
          Add IGN
        </button>
        <button
          className="rounded-xl border border-white/15 px-4 py-2 text-sm disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void window.lunar
              .addSkinByPng()
              .then(setSkins)
              .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Could not add PNG'))
              .finally(() => setBusy(false))
          }}
        >
          Add PNG
        </button>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {skins.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-[var(--muted)] sm:col-span-2">
            No skins yet. Add one by IGN or PNG.
          </li>
        ) : (
          skins.map((skin) => (
            <li
              key={skin.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                skin.active ? 'bg-white/10 ring-1 ring-[var(--accent-play)]/50' : 'bg-white/5'
              }`}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() =>
                  void window.lunar
                    .selectSkin(skin.id)
                    .then(setSkins)
                    .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Could not apply skin'))
                }
              >
                {skin.previewUrl ? (
                  <img alt="" src={skin.previewUrl} className="h-12 w-12 rounded-xl object-cover" draggable={false} />
                ) : (
                  <div className="skel h-12 w-12 rounded-xl" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{skin.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    {skin.source === 'ign' ? 'IGN' : 'PNG'}
                    {skin.active ? ' · active' : ''}
                  </div>
                </div>
              </button>
              <button
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-white/10 hover:text-white"
                title="Remove"
                onClick={() =>
                  void window.lunar
                    .removeSkin(skin.id)
                    .then(setSkins)
                    .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Could not remove'))
                }
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
