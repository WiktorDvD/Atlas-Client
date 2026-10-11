import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  AccountPublic,
  AppSnapshot,
  ClientStatus,
  CommandPreview,
  ConsoleLine,
  Instance,
  JavaRuntime,
  LaunchSettings,
  LaunchState,
  MicrosoftLoginState,
  ModEntry,
  ServerEntry,
  SkinInfo,
  UpdaterState
} from '../shared/types'

const IpcChannel = {
  snapshot: 'app:snapshot',
  toast: 'app:toast',
  console: 'launch:console',
  progress: 'download:progress',
  authProgress: 'auth:progress',
  launchState: 'launch:state',
  clientStatus: 'client:status',
  updater: 'updater:status'
} as const

export interface LunarApi {
  windowAction: (action: 'minimize' | 'maximize' | 'close') => Promise<void>
  snapshot: () => Promise<AppSnapshot>
  addOffline: (username: string) => Promise<AccountPublic>
  selectAccount: (id: string) => Promise<void>
  removeAccount: (id: string) => Promise<void>
  startMicrosoft: () => Promise<void>
  microsoftStatus: () => Promise<MicrosoftLoginState>
  saveSettings: (settings: LaunchSettings) => Promise<LaunchSettings>
  saveInstanceSettings: (id: string, settings: Partial<LaunchSettings>) => Promise<void>
  listJava: () => Promise<JavaRuntime[]>
  testJava: (javaPath: string) => Promise<JavaRuntime>
  browseJava: () => Promise<string>
  installClient: () => Promise<ClientStatus>
  rollbackClient: () => Promise<ClientStatus>
  preview: () => Promise<CommandPreview>
  startGame: () => Promise<LaunchState>
  stopGame: () => Promise<void>
  consoleLog: () => Promise<ConsoleLine[]>
  copyCrash: () => Promise<string>
  openCrash: () => Promise<string>
  createInstance: (name: string) => Promise<Instance>
  deleteInstance: (id: string) => Promise<void>
  selectInstance: (id: string) => Promise<void>
  listMods: () => Promise<ModEntry[]>
  toggleMod: (fileName: string, enabled: boolean) => Promise<ModEntry[]>
  listServers: () => Promise<ServerEntry[]>
  addServer: (name: string, address: string) => Promise<ServerEntry[]>
  removeServer: (id: string) => Promise<ServerEntry[]>
  skinInfo: () => Promise<SkinInfo>
  chooseSkin: () => Promise<SkinInfo>
  checkUpdate: () => Promise<UpdaterState>
  installUpdate: () => Promise<UpdaterState>
  openUpdateDownload: () => Promise<void>
  on: (channel: string, listener: (payload: unknown) => void) => () => void
}

async function call<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, ...args)) as { ok: boolean; data?: T; error?: string }
  if (!result.ok) throw new Error(result.error || 'Request failed')
  return result.data as T
}

const api: LunarApi = {
  windowAction: (action) => ipcRenderer.invoke('window:action', action),
  snapshot: () => call('app:snapshot'),
  addOffline: (username) => call('auth:addOffline', username),
  selectAccount: (id) => call('auth:select', id),
  removeAccount: (id) => call('auth:remove', id),
  startMicrosoft: () => call('auth:startMicrosoft'),
  microsoftStatus: () => call('auth:status'),
  saveSettings: (settings) => call('settings:save', settings),
  saveInstanceSettings: (id, settings) => call('settings:instance', id, settings),
  listJava: () => call('java:list'),
  testJava: (javaPath) => call('java:test', javaPath),
  browseJava: () => call('java:browse'),
  installClient: () => call('client:install'),
  rollbackClient: () => call('client:rollback'),
  preview: () => call('launch:preview'),
  startGame: () => call('launch:start'),
  stopGame: () => call('launch:stop'),
  consoleLog: () => call('launch:log'),
  copyCrash: () => call('launch:copyCrash'),
  openCrash: () => call('launch:openCrash'),
  createInstance: (name) => call('instances:create', name),
  deleteInstance: (id) => call('instances:delete', id),
  selectInstance: (id) => call('instances:select', id),
  listMods: () => call('mods:list'),
  toggleMod: (fileName, enabled) => call('mods:toggle', fileName, enabled),
  listServers: () => call('servers:list'),
  addServer: (name, address) => call('servers:add', name, address),
  removeServer: (id) => call('servers:remove', id),
  skinInfo: () => call('skins:info'),
  chooseSkin: () => call('skins:choose'),
  checkUpdate: () => call('updater:check'),
  installUpdate: () => call('updater:install'),
  openUpdateDownload: () => call('updater:open'),
  on: (channel, listener) => {
    const wrapped = (_event: IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  }
}

contextBridge.exposeInMainWorld('lunar', api)

export const channels = IpcChannel
