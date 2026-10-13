import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { folders } from '../paths'

const PACK_ID = 'optic'
const MARKER = 'optic.version'

function packRoot(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, PACK_ID)
  }
  return path.join(app.getAppPath(), 'resources', PACK_ID)
}

function copyFile(src: string, dest: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function readPackVersion(root: string): string {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(root, 'pack.json'), 'utf8')) as {
      version?: string
      builtAt?: string
    }
    return meta.builtAt || meta.version || '0'
  } catch {
    return '0'
  }
}

/** Deploy Optic hitreg/visual pack into the installed Lunar Remake runtime. */
export function applyOpticPack(): void {
  const root = packRoot()
  const jarSrc = path.join(root, 'lunar-localpatches.jar')
  if (!fs.existsSync(jarSrc)) return

  const versionsRoot = folders.versions()
  if (!fs.existsSync(versionsRoot)) return

  const packVer = readPackVersion(root)
  let applied = 0

  for (const verName of fs.readdirSync(versionsRoot)) {
    const libs = path.join(versionsRoot, verName, 'libs')
    if (!fs.existsSync(libs)) continue

    const marker = path.join(libs, MARKER)
    const already = fs.existsSync(marker) && fs.readFileSync(marker, 'utf8').trim() === packVer

    const destA = path.join(libs, 'lunar-localpatches.jar')
    const destB = path.join(libs, 'multiver-full', 'lunar-localpatches.jar')
    if (!already || !fs.existsSync(destA)) {
      copyFile(jarSrc, destA)
      if (fs.existsSync(path.dirname(destB))) copyFile(jarSrc, destB)
      fs.writeFileSync(marker, packVer, 'utf8')
      applied++
    }

    const badgeJson = path.join(root, 'textures', 'badges.json')
    if (fs.existsSync(badgeJson)) {
      const assetDirs = [
        path.join(libs, 'lunar-assets', 'textures', 'assets', 'lunar'),
        path.join(folders.root(), 'instances', 'default', 'lunarclient', 'textures', 'assets', 'lunar')
      ]
      for (const dir of assetDirs) {
        fs.mkdirSync(path.join(dir, 'badges'), { recursive: true })
        copyFile(badgeJson, path.join(dir, 'badges.json'))
        for (const n of ['owner.webp', 'partner.webp', 'user.webp']) {
          const src = path.join(root, 'textures', 'badges', n)
          if (fs.existsSync(src)) copyFile(src, path.join(dir, 'badges', n))
        }
      }
    }
  }

  if (applied > 0) {
    console.log(`[Optic] applied PvP pack ${packVer} to ${applied} runtime(s)`)
  }
}
