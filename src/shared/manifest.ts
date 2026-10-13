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

/**
 * Game client zip + Optic installer publish to WiktorDvD/Atlas-Client.
 * Play checks this repo and downloads newer client builds before launch.
 */
export const CLIENT_OWNER = 'WiktorDvD'
export const CLIENT_REPO = 'Atlas-Client'

/** @deprecated use CLIENT_OWNER — kept for older imports */
export const GITHUB_OWNER = CLIENT_OWNER

/** Launcher installer + electron-updater feed (Optic.exe). */
export const LAUNCHER_OWNER = 'WiktorDvD'
export const LAUNCHER_REPO = 'Atlas-Client'

export const MC_VERSION = '1.8.9'
/** Official Minecraft launcher client. Sign-in is Minecraft's, and the account is stored only in this app. */
export const MS_CLIENT_ID = '00000000402b5328'
