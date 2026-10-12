import { app, BrowserWindow, shell, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { loadStore } from './store'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

export function getWindow(): BrowserWindow | null {
  return mainWindow
}

function appIcon(): ReturnType<typeof nativeImage.createEmpty> {
  const candidates = [
    path.join(process.resourcesPath, 'icon.png'),
    path.join(__dirname, '../../build/icon.ico'),
    path.join(__dirname, '../../build/icon.png'),
    path.join(app.getAppPath(), 'build', 'icon.ico'),
    path.join(app.getAppPath(), 'build', 'icon.png')
  ]
  for (const file of candidates) {
    const image = nativeImage.createFromPath(file)
    if (!image.isEmpty()) return image
  }
  return nativeImage.createEmpty()
}

export function createWindow(): BrowserWindow {
  const dev = process.env.ELECTRON_DEV === '1'
  const icon = appIcon()
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 560,
    frame: false,
    roundedCorners: true,
    backgroundColor: '#07090e',
    title: 'Atlas Client',
    icon: icon.isEmpty() ? undefined : icon,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  if (dev) void mainWindow.loadURL('http://127.0.0.1:5173')
  else void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.on('close', (event) => {
    const behavior = loadStore().settings.onLaunch
    if (behavior === 'tray' && mainWindow && !appIsQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
  return mainWindow
}

let appIsQuitting = false

export function markQuitting(): void {
  appIsQuitting = true
}

export function windowAction(action: 'minimize' | 'maximize' | 'close'): void {
  if (!mainWindow) return
  if (action === 'minimize') mainWindow.minimize()
  else if (action === 'maximize') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  } else if (loadStore().settings.onLaunch === 'tray') mainWindow.hide()
  else mainWindow.close()
}

export function applyLaunchBehavior(): void {
  const behavior = loadStore().settings.onLaunch
  if (!mainWindow) return
  if (behavior === 'minimize') mainWindow.minimize()
  else if (behavior === 'tray') {
    ensureTray()
    mainWindow.hide()
  }
}

export function ensureTray(): void {
  if (tray) return
  let image = appIcon()
  if (image.isEmpty()) {
    image = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAHElEQVQokWNgGAWjYBSMglEwCkbBKBgFgwMAAAD//2kBBx0l1m4AAAAASUVORK5CYII='
    )
  } else {
    image = image.resize({ width: 16, height: 16 })
  }
  tray = new Tray(image)
  tray.setToolTip('Atlas Client')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show', click: () => mainWindow?.show() },
      { label: 'Quit', click: () => app.quit() }
    ])
  )
  tray.on('click', () => mainWindow?.show())
}
