export interface ManifestFile {
  path: string
  sha256: string
  size: number
}

export interface ClientManifest {
  version: string
  minecraft: '1.8.9'
  files: ManifestFile[]
}

/** Client zip releases (upstream). */
export const GITHUB_OWNER = 'Josheyerr'
export const CLIENT_REPO = 'lunar-revamped-client'
/** Launcher auto-update + Atlas Client Setup.exe releases. */
export const LAUNCHER_OWNER = 'WiktorDvD'
export const LAUNCHER_REPO = 'lunar-remake1'
export const MC_VERSION = '1.8.9'
/** Official Minecraft launcher client. Sign-in is Minecraft's, and the account is stored only in this app. */
export const MS_CLIENT_ID = '00000000402b5328'
