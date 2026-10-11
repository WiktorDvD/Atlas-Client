import { useEffect, useState } from 'react'
import type { ModEntry, ServerEntry, SkinInfo } from '@shared/types'
import { useApp } from '../stores/appStore'

export function InstancesPage() {
  const snap = useApp((s) => s.snap)
  const refresh = useApp((s) => s.refresh)
  const toast = useApp((s) => s.toast)
  const [name, setName] = useState('')
  if (!snap) return null
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="text-xl font-semibold">Instances</h1>
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

export function ModsPage() {
  const [mods, setMods] = useState<ModEntry[]>([])
  const toast = useApp((s) => s.toast)
  useEffect(() => {
    void window.lunar.listMods().then(setMods).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))
  }, [toast])
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="text-xl font-semibold">Mods</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Drop jars into the instance mods folder. Toggle disables by renaming.</p>
      <ul className="mt-4 space-y-2">
        {mods.length === 0 ? <li className="text-sm text-[var(--muted)]">No mods yet.</li> : null}
        {mods.map((mod) => (
          <li key={mod.fileName} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
            <span>{mod.name}</span>
            <button onClick={() => void window.lunar.toggleMod(mod.fileName, !mod.enabled).then(setMods)}>{mod.enabled ? 'On' : 'Off'}</button>
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
  const toast = useApp((s) => s.toast)
  useEffect(() => {
    void window.lunar.listServers().then(setServers).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))
  }, [toast])
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="text-xl font-semibold">Servers</h1>
      <div className="mt-4 flex gap-2">
        <input className="rounded-xl border border-white/10 bg-transparent px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded-xl border border-white/10 bg-transparent px-3 py-2" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <button className="rounded-xl px-4 text-white" style={{ background: 'var(--accent)' }} onClick={() => void window.lunar.addServer(name, address).then(setServers).catch((e: unknown) => toast(e instanceof Error ? e.message : 'Failed'))}>
          Add
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {servers.map((server) => (
          <li key={server.id} className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
            <span>{server.name} · {server.address}</span>
            <button onClick={() => void window.lunar.removeServer(server.id).then(setServers)}>Remove</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SkinsPage() {
  const [skin, setSkin] = useState<SkinInfo | null>(null)
  useEffect(() => {
    void window.lunar.skinInfo().then(setSkin)
  }, [])
  return (
    <section className="glass rounded-3xl p-6">
      <h1 className="text-xl font-semibold">Skins</h1>
      <div className="mt-4 flex items-center gap-4">
        {skin?.remoteUrl ? <img alt="" src={skin.remoteUrl} className="h-24 w-24 rounded-2xl" /> : <div className="skel h-24 w-24 rounded-2xl" />}
        <div>
          <p className="text-sm">{skin?.username}</p>
          <button className="mt-2 rounded-xl px-4 py-2 text-sm text-white" style={{ background: 'var(--accent)' }} onClick={() => void window.lunar.chooseSkin().then(setSkin)}>
            Choose PNG
          </button>
          {skin?.localPath ? <p className="mt-2 text-xs text-[var(--muted)]">{skin.localPath}</p> : null}
        </div>
      </div>
    </section>
  )
}
