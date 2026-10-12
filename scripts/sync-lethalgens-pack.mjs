/**
 * Copy Wiktor's live PvP overlay (localpatches + Lunar Icons) into
 * resources/lethalgens-pvp for electron-builder.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dest = path.join(root, 'resources', 'lethalgens-pvp')

const appData = process.env.APPDATA || ''
const libs = path.join(appData, '.lunar-remake', 'versions', '1.0.12', 'libs')
const patchJar = path.join(libs, 'lunar-localpatches.jar')
const badgeSrc = path.join(libs, 'lunar-assets', 'textures', 'assets', 'lunar')
const fallbackBadges = path.join(
  root,
  '..',
  'client-patches',
  'assets',
  'lunar-icons'
)

function copyFile(src, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.copyFileSync(src, out)
  console.log('+', path.relative(root, out))
}

if (!fs.existsSync(patchJar)) {
  console.error('Missing patched jar:', patchJar)
  console.error('Run client-patches\\build.ps1 first, then launch Lunar Remake once.')
  process.exit(1)
}

fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })

copyFile(patchJar, path.join(dest, 'lunar-localpatches.jar'))

const badgeDir = fs.existsSync(path.join(badgeSrc, 'badges.json')) ? badgeSrc : null
const iconDir = fs.existsSync(path.join(fallbackBadges, 'badges-slim.json'))
  ? fallbackBadges
  : null

if (badgeDir) {
  copyFile(path.join(badgeDir, 'badges.json'), path.join(dest, 'textures', 'badges.json'))
  for (const n of ['owner.webp', 'partner.webp', 'user.webp']) {
    const p = path.join(badgeDir, 'badges', n)
    if (fs.existsSync(p)) copyFile(p, path.join(dest, 'textures', 'badges', n))
  }
} else if (iconDir) {
  copyFile(path.join(iconDir, 'badges-slim.json'), path.join(dest, 'textures', 'badges.json'))
  for (const n of ['owner.webp', 'partner.webp', 'user.webp']) {
    const p = path.join(iconDir, n)
    if (fs.existsSync(p)) copyFile(p, path.join(dest, 'textures', 'badges', n))
  }
}

fs.writeFileSync(
  path.join(dest, 'pack.json'),
  JSON.stringify(
    {
      id: 'lethalgens-pvp',
      name: 'LethalGens PvP',
      version: '1.0.5',
      builtAt: new Date().toISOString(),
      includes: [
        'Butter AttackScheduler (absolute 50ms grid)',
        'Sticky WASD + mods menu last-mod memory',
        'Soft 2-tick visual KB / hurt-cam',
        'Lunar Icons (Owner/Partner/User)',
        'PvP Optimizer defaults (freshRaycast)'
      ]
    },
    null,
    2
  ),
  'utf8'
)

console.log('LethalGens pack synced ->', dest)
