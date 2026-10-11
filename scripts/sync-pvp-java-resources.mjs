/**
 * Copy a built mc-pvp-java25 kit into resources/ for electron-builder extraResources.
 *
 * Usage:
 *   node scripts/sync-pvp-java-resources.mjs
 *   node scripts/sync-pvp-java-resources.mjs --from C:\Users\...\mc-pvp-java25
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fromArg = process.argv.find((a, i, arr) => arr[i - 1] === '--from')
const src = fromArg || path.join(process.env.USERPROFILE || '', 'mc-pvp-java25')
const dest = path.join(root, 'resources', 'mc-pvp-java25')

if (!fs.existsSync(path.join(src, 'bin', 'java.exe'))) {
  console.error(`Kit not found: ${src}`)
  process.exit(1)
}

fs.mkdirSync(path.join(dest, 'bin'), { recursive: true })
for (const name of ['timer-agent.jar', 'timer-agent.dll', 'pvp-client.args']) {
  fs.copyFileSync(path.join(src, name), path.join(dest, name))
}
for (const name of ['java.exe', 'javaw.exe']) {
  fs.copyFileSync(path.join(src, 'bin', name), path.join(dest, 'bin', name))
}
fs.writeFileSync(path.join(dest, 'graalvm.path'), 'USE_LAUNCHER_RUNTIME', 'utf8')
console.log(`Synced PVP kit → ${dest}`)
