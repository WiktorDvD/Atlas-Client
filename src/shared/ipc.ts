export const IpcChannel = {
  snapshot: 'app:snapshot',
  toast: 'app:toast',
  console: 'launch:console',
  progress: 'download:progress',
  authProgress: 'auth:progress',
  launchState: 'launch:state',
  clientStatus: 'client:status',
  updater: 'updater:status'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]
