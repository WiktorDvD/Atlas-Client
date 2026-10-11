import fs from 'node:fs'
import path from 'node:path'
import type { ModEntry } from '../../shared/types'
import { instanceRoot } from '../paths'
import { loadStore } from '../store'

function modsDir(): string {
  const data = loadStore()
  const dir = path.join(instanceRoot(data.activeInstanceId), 'lunarclient', 'profiles', '1.8', 'mods')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function listMods(): ModEntry[] {
  const dir = modsDir()
  return fs.readdirSync(dir).filter((name) => name.endsWith('.jar') || name.endsWith('.jar.disabled')).map((fileName) => {
    const enabled = fileName.endsWith('.jar')
    const stat = fs.statSync(path.join(dir, fileName))
    return {
      name: fileName.replace(/\.jar(\.disabled)?$/, ''),
      fileName,
      enabled,
      size: stat.size
    }
  })
}

export function setModEnabled(fileName: string, enabled: boolean): ModEntry[] {
  const dir = modsDir()
  const current = path.join(dir, fileName)
  if (!fs.existsSync(current)) throw new Error('Mod file not found.')
  if (enabled && fileName.endsWith('.jar.disabled')) {
    fs.renameSync(current, path.join(dir, fileName.replace(/\.disabled$/, '')))
  }
  if (!enabled && fileName.endsWith('.jar')) {
    fs.renameSync(current, `${current}.disabled`)
  }
  return listMods()
}
