import { dialog, nativeImage } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { SkinEntry, SkinInfo } from '../../shared/types'
import { folders, instanceRoot } from '../paths'
import { loadStore } from '../store'
import { activeAccount } from './auth'

interface StoredSkin {
  id: string
  name: string
  source: 'ign' | 'png'
  ign?: string
  fileName: string
}

interface SkinsFile {
  skins: StoredSkin[]
  activeId: string
}

function skinsRoot(): string {
  const data = loadStore()
  return path.join(instanceRoot(data.activeInstanceId), 'skins')
}

function libraryPath(): string {
  return path.join(skinsRoot(), 'library.json')
}

function readLibrary(): SkinsFile {
  const file = libraryPath()
  if (!fs.existsSync(file)) return { skins: [], activeId: '' }
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as SkinsFile
    return {
      skins: Array.isArray(raw.skins) ? raw.skins : [],
      activeId: typeof raw.activeId === 'string' ? raw.activeId : ''
    }
  } catch {
    return { skins: [], activeId: '' }
  }
}

function writeLibrary(data: SkinsFile): void {
  fs.mkdirSync(skinsRoot(), { recursive: true })
  fs.writeFileSync(libraryPath(), JSON.stringify(data, null, 2), 'utf8')
}

function previewDataUrl(filePath: string, ign?: string): string {
  if (filePath && fs.existsSync(filePath)) {
    try {
      const buf = fs.readFileSync(filePath)
      return `data:image/png;base64,${buf.toString('base64')}`
    } catch {
      /* fall through */
    }
  }
  if (ign) return `https://mc-heads.net/avatar/${encodeURIComponent(ign)}/128`
  return ''
}

function toEntry(item: StoredSkin, activeId: string): SkinEntry {
  const localPath = path.join(skinsRoot(), item.fileName)
  const exists = fs.existsSync(localPath)
  return {
    id: item.id,
    name: item.name,
    source: item.source,
    ign: item.ign,
    localPath: exists ? localPath : '',
    previewUrl: previewDataUrl(exists ? localPath : '', item.ign),
    active: item.id === activeId
  }
}

function activeAccountSkinPath(): string {
  const account = activeAccount()
  return path.join(folders.accounts(), `${account?.uuid || 'offline'}.png`)
}

function applyStoredSkin(item: StoredSkin): void {
  const source = path.join(skinsRoot(), item.fileName)
  if (!fs.existsSync(source)) throw new Error('Skin file is missing.')
  fs.mkdirSync(skinsRoot(), { recursive: true })
  fs.copyFileSync(source, path.join(skinsRoot(), 'skin.png'))
  fs.copyFileSync(source, activeAccountSkinPath())
}

export function skinInfo(): SkinInfo {
  const account = activeAccount()
  const username = account?.username ?? 'Player'
  const uuid = account?.uuid ?? ''
  const local = path.join(folders.accounts(), `${uuid || 'offline'}.png`)
  const lib = readLibrary()
  const active = lib.skins.find((item) => item.id === lib.activeId)
  return {
    username,
    uuid,
    localPath: fs.existsSync(local) ? local : '',
    remoteUrl: active?.ign
      ? `https://mc-heads.net/avatar/${encodeURIComponent(active.ign)}/128`
      : uuid
        ? `https://mc-heads.net/avatar/${uuid}/128`
        : ''
  }
}

export function listSkins(): SkinEntry[] {
  const lib = readLibrary()
  return lib.skins.map((item) => toEntry(item, lib.activeId))
}

async function downloadIgnSkin(ign: string, dest: string): Promise<void> {
  const urls = [
    `https://mc-heads.net/skin/${encodeURIComponent(ign)}`,
    `https://mineskin.eu/skin/${encodeURIComponent(ign)}`
  ]
  let lastError: Error | null = null
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 100) throw new Error('Skin download was empty.')
      // Validate it's an image Electron can read.
      const img = nativeImage.createFromBuffer(buf)
      if (img.isEmpty()) throw new Error('Downloaded file is not a valid image.')
      fs.writeFileSync(dest, buf)
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Download failed')
    }
  }
  throw lastError ?? new Error(`Could not find a skin for ${ign}`)
}

export async function addSkinByIgn(rawIgn: string): Promise<SkinEntry[]> {
  const ign = rawIgn.trim().replace(/[^A-Za-z0-9_]/g, '').slice(0, 16)
  if (ign.length < 3) throw new Error('Enter a valid Minecraft IGN (3–16 characters).')

  const root = skinsRoot()
  fs.mkdirSync(root, { recursive: true })
  const id = crypto.randomUUID()
  const fileName = `${id}.png`
  const dest = path.join(root, fileName)
  await downloadIgnSkin(ign, dest)

  const lib = readLibrary()
  lib.skins.push({ id, name: ign, source: 'ign', ign, fileName })
  if (!lib.activeId) {
    lib.activeId = id
    applyStoredSkin(lib.skins[lib.skins.length - 1]!)
  }
  writeLibrary(lib)
  return listSkins()
}

export async function addSkinByPng(): Promise<SkinEntry[]> {
  const picked = await dialog.showOpenDialog({
    title: 'Choose a skin PNG',
    filters: [{ name: 'PNG', extensions: ['png'] }],
    properties: ['openFile']
  })
  const source = picked.filePaths[0]
  if (!source) return listSkins()

  const root = skinsRoot()
  fs.mkdirSync(root, { recursive: true })
  const id = crypto.randomUUID()
  const fileName = `${id}.png`
  const dest = path.join(root, fileName)
  fs.copyFileSync(source, dest)

  const base = path.basename(source, path.extname(source)).slice(0, 32) || 'Custom skin'
  const lib = readLibrary()
  lib.skins.push({ id, name: base, source: 'png', fileName })
  if (!lib.activeId) {
    lib.activeId = id
    applyStoredSkin(lib.skins[lib.skins.length - 1]!)
  }
  writeLibrary(lib)
  return listSkins()
}

/** @deprecated kept for preload compatibility — adds a PNG to the library */
export async function chooseSkin(): Promise<SkinInfo> {
  await addSkinByPng()
  return skinInfo()
}

export function removeSkin(id: string): SkinEntry[] {
  const lib = readLibrary()
  const item = lib.skins.find((skin) => skin.id === id)
  if (!item) throw new Error('Skin not found.')
  const file = path.join(skinsRoot(), item.fileName)
  if (fs.existsSync(file)) fs.unlinkSync(file)
  lib.skins = lib.skins.filter((skin) => skin.id !== id)
  if (lib.activeId === id) {
    lib.activeId = lib.skins[0]?.id ?? ''
    if (lib.activeId) {
      const next = lib.skins.find((skin) => skin.id === lib.activeId)
      if (next) applyStoredSkin(next)
    }
  }
  writeLibrary(lib)
  return listSkins()
}

export function selectSkin(id: string): SkinEntry[] {
  const lib = readLibrary()
  const item = lib.skins.find((skin) => skin.id === id)
  if (!item) throw new Error('Skin not found.')
  applyStoredSkin(item)
  lib.activeId = id
  writeLibrary(lib)
  return listSkins()
}
