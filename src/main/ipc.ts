import { app, dialog, ipcMain, shell } from 'electron'
import fs from 'node:fs'
import { IpcChannel } from '../shared/ipc'
import type { AppSnapshot, LaunchSettings, LaunchState } from '../shared/types'
import { emit } from './bus'
import {
  activeAccount,
  addOffline,
  microsoftStatus,
  publicAccounts,
  removeAccount,
  selectAccount,
  startMicrosoftLogin
} from './services/auth'
import {
  cachedNews,
  ensureClientBeforePlay,
  installLatestClient,
  localClientStatus,
  rollbackClient,
  scheduleClientStatusRefresh
} from './services/download'
import { createInstance, deleteInstance, listInstances, patchInstanceSettings, selectInstance } from './services/instances'
import { listJava, memoryMb, testJava } from './services/java'
import { consoleLines, launchState, previewCommand, startGame, stopGame } from './services/launch'
import { listMods, setModEnabled } from './services/mods'
import { addServer, listServers, removeServer } from './services/servers'
import { chooseSkin, skinInfo } from './services/skins'
import { checkLauncherUpdate, installLauncherUpdate, openUpdateDownload, updaterState } from './services/updater'
import { loadStore, updateStore } from './store'
import { applyLaunchBehavior, markQuitting, windowAction } from './window'

async function snapshot(): Promise<AppSnapshot> {
  const data = loadStore()
  const accounts = publicAccounts()
  const instances = listInstances()
  scheduleClientStatusRefresh()
  return {
    accounts: accounts.accounts,
    activeAccountId: accounts.activeAccountId,
    instances: instances.instances,
    activeInstanceId: instances.activeInstanceId,
    settings: data.settings,
    client: localClientStatus(),
    launch: launchState(),
    memory: memoryMb(),
    news: cachedNews(),
    updater: updaterState()
  }
}

function wrap<T>(fn: () => Promise<T> | T): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  return Promise.resolve()
    .then(fn)
    .then((data) => ({ ok: true as const, data }))
    .catch((error: unknown) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : 'Something went wrong.'
    }))
}

let launchTask: Promise<LaunchState> | null = null

function startLaunch(): Promise<LaunchState> {
  if (launchTask) return launchTask
  launchTask = runLaunch().finally(() => {
    launchTask = null
  })
  return launchTask
}

async function runLaunch(): Promise<LaunchState> {
  const prepared = await ensureClientBeforePlay()
  if (prepared.warning) emit(IpcChannel.toast, prepared.warning)
  const state = await startGame()
  const settings = loadStore().settings
  if (settings.closeOnLaunch && !settings.keepOpen) {
    markQuitting()
    setTimeout(() => app.quit(), 500)
  } else if (settings.onLaunch !== 'stay') applyLaunchBehavior()
  if (settings.showConsole) emit(IpcChannel.console, { stream: 'launcher', text: 'Console attached.', at: Date.now() })
  return state
}

export function registerIpc(): void {
  ipcMain.handle('window:action', (_event, action: 'minimize' | 'maximize' | 'close') => {
    windowAction(action)
  })
  ipcMain.handle('app:snapshot', () => wrap(() => snapshot()))
  ipcMain.handle('auth:addOffline', (_e, username: string) => wrap(() => addOffline(username)))
  ipcMain.handle('auth:select', (_e, id: string) => wrap(() => selectAccount(id)))
  ipcMain.handle('auth:remove', (_e, id: string) => wrap(() => removeAccount(id)))
  ipcMain.handle('auth:startMicrosoft', () => wrap(() => startMicrosoftLogin()))
  ipcMain.handle('auth:status', () => wrap(() => microsoftStatus()))
  ipcMain.handle('settings:save', (_e, settings: LaunchSettings) =>
    wrap(() => {
      updateStore((data) => {
        data.settings = { ...data.settings, ...settings }
      })
      return loadStore().settings
    })
  )
  ipcMain.handle('settings:instance', (_e, id: string, settings: Partial<LaunchSettings>) =>
    wrap(() => patchInstanceSettings(id, settings))
  )
  ipcMain.handle('java:list', () => wrap(() => listJava()))
  ipcMain.handle('java:test', (_e, javaPath: string) => wrap(() => testJava(javaPath)))
  ipcMain.handle('java:browse', () =>
    wrap(async () => {
      const result = await dialog.showOpenDialog({ properties: ['openFile'] })
      return result.filePaths[0] ?? ''
    })
  )
  ipcMain.handle('client:install', () => wrap(() => installLatestClient()))
  ipcMain.handle('client:rollback', () => wrap(() => rollbackClient()))
  ipcMain.handle('launch:preview', () => wrap(() => previewCommand()))
  ipcMain.handle('launch:start', () => wrap(() => startLaunch()))
  ipcMain.handle('launch:stop', () => wrap(() => stopGame()))
  ipcMain.handle('launch:log', () => wrap(() => consoleLines()))
  ipcMain.handle('launch:copyCrash', () =>
    wrap(() => {
      const crash = launchState().crashReport
      if (!crash || !fs.existsSync(crash)) throw new Error('No crash report yet.')
      return fs.readFileSync(crash, 'utf8')
    })
  )
  ipcMain.handle('launch:openCrash', () =>
    wrap(async () => {
      const crash = launchState().crashReport
      if (!crash) throw new Error('No crash report yet.')
      await shell.openPath(crash)
      return crash
    })
  )
  ipcMain.handle('instances:create', (_e, name: string) => wrap(() => createInstance(name)))
  ipcMain.handle('instances:delete', (_e, id: string) => wrap(() => deleteInstance(id)))
  ipcMain.handle('instances:select', (_e, id: string) => wrap(() => selectInstance(id)))
  ipcMain.handle('mods:list', () => wrap(() => listMods()))
  ipcMain.handle('mods:toggle', (_e, fileName: string, enabled: boolean) => wrap(() => setModEnabled(fileName, enabled)))
  ipcMain.handle('servers:list', () => wrap(() => listServers()))
  ipcMain.handle('servers:add', (_e, name: string, address: string) => wrap(() => addServer(name, address)))
  ipcMain.handle('servers:remove', (_e, id: string) => wrap(() => removeServer(id)))
  ipcMain.handle('skins:info', () => wrap(() => skinInfo()))
  ipcMain.handle('skins:choose', () => wrap(() => chooseSkin()))
  ipcMain.handle('updater:check', () => wrap(() => checkLauncherUpdate(true)))
  ipcMain.handle('updater:install', () => wrap(() => installLauncherUpdate()))
  ipcMain.handle('updater:open', () => wrap(() => openUpdateDownload()))
  ipcMain.handle('account:active', () => wrap(() => activeAccount()?.username ?? ''))
}
