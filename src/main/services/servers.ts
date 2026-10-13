import { app, dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { ServerEntry } from '../../shared/types'
import { instanceRoot } from '../paths'
import { loadStore } from '../store'

interface StoredServer {
  id: string
  name: string
  address: string
  /** Filename under the instance server-icons folder, or a bundled default key. */
  iconKey?: string
}

const DEFAULT_SERVERS: { name: string; address: string; iconKey: string }[] = [
  { name: 'Hypixel', address: 'hypixel.net', iconKey: 'hypixel.png' },
  { name: 'Pika Network', address: 'pika.host', iconKey: 'pika.png' },
  { name: 'Minemen EU', address: 'eu.minemen.club', iconKey: 'minemen-eu.png' },
  { name: 'Minemen NA', address: 'na.minemen.club', iconKey: 'minemen-na.png' },
  { name: 'Minemen AS', address: 'as.minemen.club', iconKey: 'minemen-as.png' }
]

function file(): string {
  const data = loadStore()
  return path.join(instanceRoot(data.activeInstanceId), 'servers.json')
}

function dismissedFile(): string {
  const data = loadStore()
  return path.join(instanceRoot(data.activeInstanceId), 'dismissed-servers.json')
}

function iconsDir(): string {
  const data = loadStore()
  const dir = path.join(instanceRoot(data.activeInstanceId), 'server-icons')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function bundledIconsRoot(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server-icons')
  }
  return path.join(app.getAppPath(), 'resources', 'server-icons')
}

function readDismissed(): Set<string> {
  try {
    const raw = JSON.parse(fs.readFileSync(dismissedFile(), 'utf8')) as string[]
    return new Set(raw.map((item) => item.toLowerCase()))
  } catch {
    return new Set()
  }
}

function writeDismissed(dismissed: Set<string>): void {
  fs.writeFileSync(dismissedFile(), JSON.stringify([...dismissed], null, 2))
}

function readStored(): StoredServer[] {
  const target = file()
  if (!fs.existsSync(target)) return []
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8')) as StoredServer[]
  } catch {
    return []
  }
}

function resolveIconPath(iconKey: string | undefined): string | null {
  if (!iconKey) return null
  const custom = path.join(iconsDir(), iconKey)
  if (fs.existsSync(custom)) return custom
  const bundled = path.join(bundledIconsRoot(), iconKey)
  if (fs.existsSync(bundled)) return bundled
  return null
}

function toDataUrl(filePath: string | null): string | undefined {
  if (!filePath || !fs.existsSync(filePath)) return undefined
  try {
    const buf = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const mime =
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return undefined
  }
}

function enrich(server: StoredServer): ServerEntry {
  return {
    id: server.id,
    name: server.name,
    address: server.address,
    iconKey: server.iconKey,
    iconUrl: toDataUrl(resolveIconPath(server.iconKey))
  }
}

function ensureDefaults(servers: StoredServer[]): { servers: StoredServer[]; changed: boolean } {
  const dismissed = readDismissed()
  let changed = false
  const next = [...servers]
  for (const def of DEFAULT_SERVERS) {
    const addr = def.address.toLowerCase()
    if (dismissed.has(addr)) continue
    const existing = next.find((s) => s.address.toLowerCase() === addr)
    if (!existing) {
      next.push({
        id: `default-${def.iconKey.replace(/\.png$/i, '')}`,
        name: def.name,
        address: def.address,
        iconKey: def.iconKey
      })
      changed = true
    } else if (!existing.iconKey) {
      existing.iconKey = def.iconKey
      if (!existing.name?.trim()) existing.name = def.name
      changed = true
    }
  }
  return { servers: next, changed }
}

function save(servers: StoredServer[]): void {
  fs.writeFileSync(file(), JSON.stringify(servers, null, 2))
  writeServersDat(servers)
}

export function listServers(): ServerEntry[] {
  const ensured = ensureDefaults(readStored())
  if (ensured.changed) save(ensured.servers)
  return ensured.servers.map(enrich)
}

export function addServer(name: string, address: string): ServerEntry[] {
  if (!address.trim()) throw new Error('Server address is required.')
  const addr = address.trim()
  const dismissed = readDismissed()
  if (dismissed.has(addr.toLowerCase())) {
    dismissed.delete(addr.toLowerCase())
    writeDismissed(dismissed)
  }
  const servers = ensureDefaults(readStored()).servers
  if (servers.some((s) => s.address.toLowerCase() === addr.toLowerCase())) {
    throw new Error('That server is already in the list.')
  }
  servers.push({
    id: randomUUID(),
    name: name.trim() || addr,
    address: addr
  })
  save(servers)
  return servers.map(enrich)
}

export function removeServer(id: string): ServerEntry[] {
  const current = readStored()
  const removed = current.find((server) => server.id === id)
  const servers = current.filter((server) => server.id !== id)
  if (removed) {
    const dismissed = readDismissed()
    dismissed.add(removed.address.toLowerCase())
    writeDismissed(dismissed)
  }
  save(servers)
  return ensureDefaults(servers).servers.map(enrich)
}

export function setServerIcon(id: string, sourcePath: string): ServerEntry[] {
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('Icon file not found.')
  const servers = ensureDefaults(readStored()).servers
  const server = servers.find((item) => item.id === id)
  if (!server) throw new Error('Server not found.')
  const ext = path.extname(sourcePath).toLowerCase() || '.png'
  const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext) ? ext : '.png'
  const iconKey = `${server.id}${safeExt}`
  fs.copyFileSync(sourcePath, path.join(iconsDir(), iconKey))
  server.iconKey = iconKey
  save(servers)
  return servers.map(enrich)
}

export async function chooseServerIcon(id: string): Promise<ServerEntry[]> {
  const result = await dialog.showOpenDialog({
    title: 'Choose server icon',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  })
  if (result.canceled || !result.filePaths[0]) return listServers()
  return setServerIcon(id, result.filePaths[0])
}

function nbtString(value: string): Buffer {
  const bytes = Buffer.from(value, 'utf8')
  const out = Buffer.alloc(2 + bytes.length)
  out.writeUInt16BE(bytes.length, 0)
  bytes.copy(out, 2)
  return out
}

function writeServersDat(servers: StoredServer[]): void {
  const data = loadStore()
  const gameDir = data.settings.gameDir || path.join(instanceRoot(data.activeInstanceId), 'game')
  fs.mkdirSync(gameDir, { recursive: true })
  const chunks: Buffer[] = [Buffer.from([0x0a, 0x00, 0x00])]
  const listPayload: Buffer[] = []
  for (const server of servers) {
    const name = Buffer.concat([Buffer.from([0x08]), nbtString('name'), nbtString(server.name)])
    const ip = Buffer.concat([Buffer.from([0x08]), nbtString('ip'), nbtString(server.address)])
    listPayload.push(Buffer.concat([Buffer.from([0x0a]), name, ip, Buffer.from([0x00])]))
  }
  const count = Buffer.alloc(4)
  count.writeInt32BE(servers.length, 0)
  chunks.push(Buffer.from([0x09]), nbtString('servers'), Buffer.from([0x0a]), count, ...listPayload, Buffer.from([0x00]))
  fs.writeFileSync(path.join(gameDir, 'servers.dat'), Buffer.concat(chunks))
}
