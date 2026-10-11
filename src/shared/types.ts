export type AccountKind = 'microsoft' | 'offline'

export interface Account {
  id: string
  username: string
  uuid: string
  kind: AccountKind
  accessToken: string
  /** Encrypted at rest. Present only in the main process store. */
  refreshToken?: string
  expiresAt?: string
}

export type AccountPublic = Omit<Account, 'accessToken' | 'refreshToken'> & {
  hasToken: boolean
}

export interface MicrosoftLoginState {
  state: 'idle' | 'starting' | 'waiting' | 'success' | 'error'
  code: string
  url: string
  username: string
  message: string
}

export type JvmPreset = 'default' | 'aikar' | 'low' | 'zgc' | 'pvp' | 'custom'

export type OnLaunchBehavior = 'minimize' | 'tray' | 'stay'

export interface LaunchSettings {
  minRamMb: number
  maxRamMb: number
  jvmArgs: string
  jvmPreset: JvmPreset
  gameArgs: string
  width: number
  height: number
  fullscreen: boolean
  borderless: boolean
  rememberSize: boolean
  gameDir: string
  env: { key: string; value: string }[]
  preLaunch: string
  postExit: string
  wrapper: string
  closeOnLaunch: boolean
  showConsole: boolean
  keepOpen: boolean
  onLaunch: OnLaunchBehavior
  javaPath: string
  /** Optional timer-agent folder when not using the launcher-bundled PVP Java forwarder. */
  pvpKitPath: string
  theme: 'dark' | 'light'
  accent: string
  devRuntime: string
}

export interface Instance {
  id: string
  name: string
  minecraftVersion: '1.8.9'
  createdAt: string
  settings: Partial<LaunchSettings>
}

export interface JavaRuntime {
  path: string
  version: string
  major: number
  arch: string
  source: 'bundled' | 'detected' | 'custom'
}

export interface DownloadProgress {
  file: string
  received: number
  total: number
  speedBps: number
  etaSeconds: number
  overallReceived: number
  overallTotal: number
  label: string
}

export type ClientStatusKind =
  | 'missing'
  | 'ready'
  | 'downloading'
  | 'update'
  | 'error'

export interface ClientStatus {
  kind: ClientStatusKind
  installedVersion: string
  remoteVersion: string
  message: string
  runtimeRoot: string
  changelog: string
}

export interface ModEntry {
  name: string
  fileName: string
  enabled: boolean
  size: number
}

export interface ServerEntry {
  id: string
  name: string
  address: string
}

export interface SkinInfo {
  username: string
  uuid: string
  localPath: string
  remoteUrl: string
}

export interface ConsoleLine {
  stream: 'out' | 'err' | 'launcher'
  text: string
  at: number
}

export interface LaunchState {
  running: boolean
  pid: number | null
  startedAt: number | null
  exitCode: number | null
  crashReport: string
}

export interface MemoryInfo {
  totalMb: number
  freeMb: number
}

export interface CommandPreview {
  command: string
  warnings: string[]
}

export interface NewsItem {
  title: string
  body: string
  url: string
  publishedAt: string
}

export type UpdaterPhase =
  | 'idle'
  | 'checking'
  | 'current'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'error'

export interface UpdaterState {
  status: string
  version: string
  phase: UpdaterPhase
  latestVersion: string
  percent: number
  packaged: boolean
  seq: number
  notify: boolean
}

export interface AppSnapshot {
  accounts: AccountPublic[]
  activeAccountId: string
  instances: Instance[]
  activeInstanceId: string
  settings: LaunchSettings
  client: ClientStatus
  launch: LaunchState
  memory: MemoryInfo
  news: NewsItem[]
  updater: UpdaterState
}
