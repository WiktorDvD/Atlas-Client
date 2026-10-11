import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
function flag(name, fallback) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}

const runtime = path.resolve(flag('--runtime', 'F:/Projects/LunarClientremake-main'))
const version = flag('--version', '1.0.0')
const outDir = path.resolve(flag('--out', 'release-client'))
const publish = args.includes('--publish')

const include = [
  'libs/multiver-full',
  'libs/vanilla',
  'libs/natives',
  'libs/fake-launcher.jar',
  'libs/lunar-localpatches.jar',
  'libs/sentry-off.jar',
  'libs/lunar-assets',
  'tools/fake-launcher/discovery.json'
]

const stage = path.join(outDir, `lunar-revamped-${version}`)
fs.rmSync(stage, { recursive: true, force: true })
fs.mkdirSync(stage, { recursive: true })

const files = []
for (const rel of include) {
  const from = path.join(runtime, rel)
  if (!fs.existsSync(from)) {
    console.warn('missing', rel)
    continue
  }
  const dest = path.join(stage, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(from, dest, { recursive: true })
}

const patchedUi = path.join(runtime, 'run', 'lunarclient', 'ui-local')
const stagedUi = path.join(stage, 'libs', 'lunar-assets', 'ui')
if (fs.existsSync(patchedUi)) {
  fs.mkdirSync(path.dirname(stagedUi), { recursive: true })
  fs.cpSync(patchedUi, stagedUi, { recursive: true })
  console.log('overlaid patched ui-local onto libs/lunar-assets/ui')
} else {
  console.warn('patched ui-local missing; shipping stock lunar-assets/ui')
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else {
      const data = fs.readFileSync(full)
      files.push({
        path: path.relative(stage, full).replace(/\\/g, '/'),
        sha256: createHash('sha256').update(data).digest('hex'),
        size: data.length
      })
    }
  }
}
walk(stage)
const manifest = { version, minecraft: '1.8.9', files }
fs.writeFileSync(path.join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2))

const zip = path.join(outDir, `lunar-revamped-client-${version}.zip`)
const packed = spawnSync('powershell', [
  '-NoProfile',
  '-Command',
  `Compress-Archive -Path '${stage}\\*' -DestinationPath '${zip}' -Force`
], { stdio: 'inherit' })
if (packed.status !== 0) process.exit(packed.status ?? 1)
console.log('wrote', zip)

if (publish) {
  const created = spawnSync(
    'gh',
    ['release', 'create', `v${version}`, zip, '--repo', 'Josheyerr/lunar-revamped-client', '--title', `Client ${version}`, '--notes', `Lunar Revamped ${version}`],
    { stdio: 'inherit' }
  )
  process.exit(created.status ?? 1)
}
