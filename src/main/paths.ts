import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export function appDataRoot(): string {
  const root = path.join(app.getPath('appData'), '.lunar-remake')
  fs.mkdirSync(root, { recursive: true })
  return root
}

export function ensureDir(dir: string): string {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export const folders = {
  root: () => appDataRoot(),
  instances: () => ensureDir(path.join(appDataRoot(), 'instances')),
  runtimes: () => ensureDir(path.join(appDataRoot(), 'runtimes')),
  libraries: () => ensureDir(path.join(appDataRoot(), 'libraries')),
  assets: () => ensureDir(path.join(appDataRoot(), 'assets')),
  versions: () => ensureDir(path.join(appDataRoot(), 'versions')),
  logs: () => ensureDir(path.join(appDataRoot(), 'logs')),
  cache: () => ensureDir(path.join(appDataRoot(), 'cache')),
  accounts: () => ensureDir(path.join(appDataRoot(), 'accounts'))
}

/** Installed under `%APPDATA%\.lunar-remake\runtimes\`. */
export const PVP_JAVA_DIR = 'mc-pvp-java17'
/** Real JDK home the forwarder points at (GraalVM CE 17). */
export const GRAAL_RUNTIME_DIR = 'graalvm-ce-17'
/** @deprecated alias — was Zulu 21 */
export const ZULU_RUNTIME_DIR = GRAAL_RUNTIME_DIR

export function bundledPvpJavaPath(): string {
  return path.join(folders.runtimes(), PVP_JAVA_DIR, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
}

export function instanceRoot(id: string): string {
  return ensureDir(path.join(folders.instances(), id))
}
