import { dialog } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { SkinInfo } from '../../shared/types'
import { folders, instanceRoot } from '../paths'
import { loadStore } from '../store'
import { activeAccount } from './auth'

export function skinInfo(): SkinInfo {
  const account = activeAccount()
  const username = account?.username ?? 'Player'
  const uuid = account?.uuid ?? ''
  const local = path.join(folders.accounts(), `${uuid || 'offline'}.png`)
  return {
    username,
    uuid,
    localPath: fs.existsSync(local) ? local : '',
    remoteUrl: uuid ? `https://mc-heads.net/avatar/${uuid}/128` : ''
  }
}

export async function chooseSkin(): Promise<SkinInfo> {
  const picked = await dialog.showOpenDialog({
    title: 'Choose a skin PNG',
    filters: [{ name: 'PNG', extensions: ['png'] }],
    properties: ['openFile']
  })
  const source = picked.filePaths[0]
  if (!source) return skinInfo()
  const info = skinInfo()
  const data = loadStore()
  const dest = path.join(instanceRoot(data.activeInstanceId), 'skins')
  fs.mkdirSync(dest, { recursive: true })
  const target = path.join(folders.accounts(), `${info.uuid || 'offline'}.png`)
  fs.copyFileSync(source, target)
  fs.copyFileSync(source, path.join(dest, 'skin.png'))
  return skinInfo()
}
