import fs from 'node:fs'
import path from 'node:path'
import { loadStore } from '../store'
import { ensureDir, folders, resolveGameDir } from '../paths'

function stamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function backupsRoot(): string {
  return ensureDir(path.join(folders.root(), 'backups'))
}

function copyFileSafe(src: string, dest: string): boolean {
  try {
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) return false
    ensureDir(path.dirname(dest))
    fs.copyFileSync(src, dest)
    return true
  } catch {
    return false
  }
}

/** Backup electron-store launcher settings. */
export function backupLauncherSettingsNow(): string {
  const storeFile = path.join(folders.root(), 'settings.json')
  const dest = path.join(backupsRoot(), 'launcher', `settings-${stamp()}.json`)
  if (!copyFileSafe(storeFile, dest)) {
    throw new Error('No launcher settings file to back up yet')
  }
  return dest
}

/** Backup common Minecraft options files from the active instance game dir. */
export function backupGameSettingsNow(): string {
  const data = loadStore()
  const gameDir = resolveGameDir(data.activeInstanceId, data.settings.gameDir)
  const destDir = ensureDir(path.join(backupsRoot(), 'game', `game-${stamp()}`))
  const names = [
    'options.txt',
    'optionsof.txt',
    'optionsshaders.txt',
    'servers.dat',
    'pvpoptimizer.properties',
    'optic.properties'
  ]
  let copied = 0
  for (const name of names) {
    if (copyFileSafe(path.join(gameDir, name), path.join(destDir, name))) copied++
  }
  // Also grab config folder lightly if present
  const configDir = path.join(gameDir, 'config')
  if (fs.existsSync(configDir) && fs.statSync(configDir).isDirectory()) {
    const destConfig = ensureDir(path.join(destDir, 'config'))
    for (const entry of fs.readdirSync(configDir)) {
      const src = path.join(configDir, entry)
      const lower = entry.toLowerCase()
      const okExt =
        lower.endsWith('.cfg') ||
        lower.endsWith('.txt') ||
        lower.endsWith('.properties') ||
        lower.endsWith('.json')
      if (fs.statSync(src).isFile() && okExt) {
        if (copyFileSafe(src, path.join(destConfig, entry))) copied++
      }
    }
  }
  if (copied === 0) throw new Error('No game settings files found to back up')
  return destDir
}

/** Run enabled automatic backups before launch. Returns note strings. */
export function runLaunchBackups(): string[] {
  const settings = loadStore().settings
  const notes: string[] = []
  if (settings.backupLauncherSettings) {
    try {
      notes.push(`Launcher settings backed up → ${backupLauncherSettingsNow()}`)
    } catch (error) {
      notes.push(error instanceof Error ? error.message : 'Launcher backup skipped')
    }
  }
  if (settings.backupGameSettings) {
    try {
      notes.push(`Game settings backed up → ${backupGameSettingsNow()}`)
    } catch (error) {
      notes.push(error instanceof Error ? error.message : 'Game backup skipped')
    }
  }
  return notes
}

export function openBackupsFolder(): string {
  return backupsRoot()
}
