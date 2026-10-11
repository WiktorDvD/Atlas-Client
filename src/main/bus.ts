import { BrowserWindow } from 'electron'
import { IpcChannel, type IpcChannelName } from '../shared/ipc'

export function emit(channel: IpcChannelName, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
}
