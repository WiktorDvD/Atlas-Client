import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { ServerEntry } from '../../shared/types'
import { instanceRoot } from '../paths'
import { loadStore } from '../store'

function file(): string {
  const data = loadStore()
  return path.join(instanceRoot(data.activeInstanceId), 'servers.json')
}

export function listServers(): ServerEntry[] {
  const target = file()
  if (!fs.existsSync(target)) return []
  return JSON.parse(fs.readFileSync(target, 'utf8')) as ServerEntry[]
}

function save(servers: ServerEntry[]): void {
  fs.writeFileSync(file(), JSON.stringify(servers, null, 2))
  writeServersDat(servers)
}

export function addServer(name: string, address: string): ServerEntry[] {
  if (!address.trim()) throw new Error('Server address is required.')
  const servers = listServers()
  servers.push({ id: randomUUID(), name: name.trim() || address.trim(), address: address.trim() })
  save(servers)
  return servers
}

export function removeServer(id: string): ServerEntry[] {
  const servers = listServers().filter((server) => server.id !== id)
  save(servers)
  return servers
}

function nbtString(value: string): Buffer {
  const bytes = Buffer.from(value, 'utf8')
  const out = Buffer.alloc(2 + bytes.length)
  out.writeUInt16BE(bytes.length, 0)
  bytes.copy(out, 2)
  return out
}

function writeServersDat(servers: ServerEntry[]): void {
  const data = loadStore()
  const gameDir = data.settings.gameDir || path.join(instanceRoot(data.activeInstanceId), 'game')
  fs.mkdirSync(gameDir, { recursive: true })
  const chunks: Buffer[] = [Buffer.from([0x0a, 0x00, 0x00])]
  const listPayload: Buffer[] = []
  for (const server of servers) {
    const name = Buffer.concat([
      Buffer.from([0x08]),
      nbtString('name'),
      nbtString(server.name)
    ])
    const ip = Buffer.concat([Buffer.from([0x08]), nbtString('ip'), nbtString(server.address)])
    listPayload.push(Buffer.concat([Buffer.from([0x0a]), name, ip, Buffer.from([0x00])]))
  }
  const count = Buffer.alloc(4)
  count.writeInt32BE(servers.length, 0)
  chunks.push(Buffer.from([0x09]), nbtString('servers'), Buffer.from([0x0a]), count, ...listPayload, Buffer.from([0x00]))
  fs.writeFileSync(path.join(gameDir, 'servers.dat'), Buffer.concat(chunks))
}
