import { safeStorage } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import Store from 'electron-store'
import { DEFAULT_ACCENT, isStockLauncherRam, optimalGameRamMb } from '../shared/jvm'
import type { Account, Instance, LaunchSettings } from '../shared/types'
import { bundledPvpJavaPath, folders, PVP_JAVA_DIR } from './paths'

export interface Persisted {
  accounts: Account[]
  activeAccountId: string
  instances: Instance[]
  activeInstanceId: string
  settings: LaunchSettings
  installedClientVersion: string
  previousClientVersion: string
}

const REMOTE_RUNTIME = 'F:\\Projects\\LunarClientremake-main'

function resolveDefaultJava(): string {
  const bundled = bundledPvpJavaPath()
  if (fs.existsSync(bundled)) return bundled
  // Dev fallback before first bundled install completes.
  return ''
}

export function defaultSettings(): LaunchSettings {
  const dev = process.env.LUNAR_REVAMPED_RUNTIME || (fs.existsSync(REMOTE_RUNTIME) ? REMOTE_RUNTIME : '')
  const javaPath = resolveDefaultJava()
  return {
    minRamMb: optimalGameRamMb(Math.round(os.totalmem() / (1024 * 1024))),
    maxRamMb: optimalGameRamMb(Math.round(os.totalmem() / (1024 * 1024))),
    jvmArgs: '',
    // Light GraalVM 17 kit; keep preset default (no over-tuned G1 stack).
    jvmPreset: 'default',
    gameArgs: '',
    width: 1280,
    height: 720,
    fullscreen: false,
    borderless: false,
    rememberSize: true,
    gameDir: '',
    env: [],
    preLaunch: '',
    postExit: '',
    wrapper: '',
    closeOnLaunch: false,
    showConsole: true,
    keepOpen: true,
    onLaunch: 'stay',
    javaPath,
    pvpKitPath: '',
    theme: 'dark',
    accent: DEFAULT_ACCENT,
    devRuntime: dev
  }
}

function canCrypt(): boolean {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

function seal(value: string): string {
  if (!value) return ''
  if (!canCrypt()) return `plain:${Buffer.from(value, 'utf8').toString('base64')}`
  return `enc:${safeStorage.encryptString(value).toString('base64')}`
}

function open(value: string | undefined): string {
  if (!value) return ''
  if (value.startsWith('enc:')) {
    return safeStorage.decryptString(Buffer.from(value.slice(4), 'base64'))
  }
  if (value.startsWith('plain:')) {
    return Buffer.from(value.slice(6), 'base64').toString('utf8')
  }
  return value
}

interface DiskAccount extends Omit<Account, 'accessToken' | 'refreshToken'> {
  accessToken: string
  refreshToken?: string
}

function defaultData(): Persisted {
  const id = 'default'
  const settings = defaultSettings()
  return {
    accounts: [],
    activeAccountId: '',
    instances: [
      {
        id,
        name: 'Lunar Revamped',
        minecraftVersion: '1.8.9',
        createdAt: new Date().toISOString(),
        settings: {}
      }
    ],
    activeInstanceId: id,
    settings,
    installedClientVersion: '',
    previousClientVersion: ''
  }
}

let cache: Persisted | null = null
let disk: Store<Persisted> | null = null

function db(): Store<Persisted> {
  if (!disk) {
    disk = new Store<Persisted>({
      cwd: folders.root(),
      name: 'settings',
      defaults: defaultData()
    })
  }
  return disk
}

function shouldAdoptDefaultJava(current: string, bundled: string): boolean {
  if (!current) return true
  if (!bundled) return false
  if (path.normalize(current) === path.normalize(bundled)) return false
  // Migrate off over-tuned Zulu/Java21/25 kits onto GraalVM CE 17.
  if (/zulu-25|mc-pvp-java25|mc-pvp-java21|java25-pvp|zulu-21|[\\/]java25[\\/]/i.test(current)) {
    return true
  }
  if (current.includes(`${path.sep}runtimes${path.sep}temurin-21`)) return true
  if (current.includes(`${path.sep}runtimes${path.sep}graalvm-ce-21`)) return true
  if (current.includes(`${path.sep}runtimes${path.sep}zulu-25`)) return true
  return false
}

export function loadStore(): Persisted {
  if (cache) return cache
  const raw = structuredClone(db().store)
  raw.accounts = (raw.accounts as DiskAccount[]).map((account) => ({
    ...account,
    accessToken: open(account.accessToken),
    refreshToken: open(account.refreshToken)
  }))
  const defaults = defaultSettings()
  raw.settings = { ...defaults, ...raw.settings }
  let migrated = false
  if (isStockLauncherRam(raw.settings.minRamMb, raw.settings.maxRamMb)) {
    const ram = optimalGameRamMb(Math.round(os.totalmem() / (1024 * 1024)))
    raw.settings.minRamMb = ram
    raw.settings.maxRamMb = ram
    migrated = true
  }
  const currentJava = (raw.settings.javaPath || '').trim()
  const bundled = resolveDefaultJava()
  const targetJava = path.join(folders.runtimes(), PVP_JAVA_DIR, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  if (shouldAdoptDefaultJava(currentJava, bundled || targetJava)) {
    raw.settings.javaPath = bundled || targetJava
    raw.settings.pvpKitPath = ''
    raw.settings.jvmPreset = 'default'
    migrated = true
  }
  cache = raw
  if (migrated) saveStore()
  return raw
}

export function saveStore(): void {
  if (!cache) return
  const sealed: Persisted = {
    ...cache,
    accounts: cache.accounts.map((account) => ({
      ...account,
      accessToken: seal(account.accessToken),
      refreshToken: account.refreshToken ? seal(account.refreshToken) : ''
    }))
  }
  db().store = sealed
}

export function updateStore(mutator: (data: Persisted) => void): Persisted {
  const data = loadStore()
  mutator(data)
  saveStore()
  return data
}
