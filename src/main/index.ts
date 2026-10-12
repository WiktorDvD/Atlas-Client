import { app } from 'electron'
import { registerIpc } from './ipc'
import { loadStore } from './store'
import { bootBundledPvpJava } from './services/java'
import { bootAutoUpdate } from './services/updater'
import { createWindow, ensureTray, getWindow, markQuitting } from './window'

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

app.whenReady().then(() => {
  try {
    loadStore()
  } catch (error) {
    console.error('[Atlas] loadStore failed, using empty defaults', error)
  }
  registerIpc()
  createWindow()
  try {
    if (loadStore().settings.onLaunch === 'tray') ensureTray()
  } catch {
    /* ignore */
  }
  void bootBundledPvpJava()
  void bootAutoUpdate()
})

app.on('before-quit', () => markQuitting())
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && loadStore().settings.onLaunch !== 'tray') app.quit()
})
app.on('second-instance', () => {
  getWindow()?.show()
})
