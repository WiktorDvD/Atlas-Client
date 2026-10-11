import fs from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'

function tags(): string[] {
  if (process.platform === 'win32') return ['windows', 'win']
  if (process.platform === 'darwin') return ['macos', 'osx', 'darwin', 'mac']
  return ['linux']
}

function lwjglMarker(): string {
  if (process.platform === 'win32') return 'lwjgl64.dll'
  if (process.platform === 'darwin') return 'liblwjgl.dylib'
  return 'liblwjgl64.so'
}

export function extractNatives(runtime: string, outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true })
  const nativesDir = path.join(runtime, 'libs', 'natives')
  const marker = lwjglMarker()
  if (!fs.existsSync(path.join(outDir, marker))) {
    extractNativeZips(nativesDir, outDir, marker)
  }
  // Genesis looks for <webosrDir>/resources/icudt67l.dat. webosrDir is this
  // natives folder. Copy even when the DLLs were extracted earlier, or an
  // already-launched instance keeps crashing after the marker file exists.
  copyUltralightResources(nativesDir, outDir)
}

function extractNativeZips(nativesDir: string, outDir: string, marker: string): void {
  const wanted = tags()
  if (!fs.existsSync(nativesDir)) {
    throw new Error('No natives folder in the client runtime.')
  }
  const zips = fs
    .readdirSync(nativesDir)
    .filter((name) => name.endsWith('.zip') && wanted.some((tag) => name.toLowerCase().includes(tag)))
  if (zips.length === 0) throw new Error('No native zips for this operating system.')
  for (const name of zips) {
    const zip = new AdmZip(path.join(nativesDir, name))
    zip.extractAllTo(outDir, true)
  }
  if (!fs.existsSync(path.join(outDir, marker)) && process.platform === 'win32') {
    const nested = findFile(outDir, marker)
    if (nested) fs.copyFileSync(nested, path.join(outDir, marker))
  }
  if (process.platform === 'win32' && !fs.existsSync(path.join(outDir, 'lwjgl64.dll'))) {
    throw new Error('natives dir missing lwjgl64.dll after extract.')
  }
}

function copyUltralightResources(nativesDir: string, outDir: string): void {
  const dest = path.join(outDir, 'resources')
  const icu = path.join(dest, 'icudt67l.dat')
  if (fs.existsSync(icu)) return
  const resources = path.join(nativesDir, 'resources')
  if (!fs.existsSync(resources)) {
    throw new Error('Ultralight resources are missing from the client runtime (expected libs/natives/resources/icudt67l.dat).')
  }
  copyTree(resources, dest)
  if (!fs.existsSync(icu)) {
    throw new Error('Did not place Ultralight resources at natives/resources/icudt67l.dat.')
  }
}

function copyTree(from: string, to: string): void {
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) copyTree(src, dest)
    else if (entry.isFile()) fs.copyFileSync(src, dest)
  }
}

function findFile(dir: string, name: string): string | null {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const found = findFile(full, name)
      if (found) return found
    } else if (entry.name === name) return full
  }
  return null
}
