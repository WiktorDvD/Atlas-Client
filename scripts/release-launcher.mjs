/**
 * Bump launcher version, commit, tag, and push so CI publishes LunarRevampedSetup.exe.
 *
 *   node scripts/release-launcher.mjs --version 1.0.7 --push
 *   node scripts/release-launcher.mjs --version 1.0.7          # bump only
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const version = (() => {
  const i = args.indexOf('--version')
  return i >= 0 ? args[i + 1] : ''
})()
const push = args.includes('--push')

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/release-launcher.mjs --version X.Y.Z [--push]')
  process.exit(1)
}

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: 'inherit',
    // Avoid cmd.exe for git -m "Release X.Y.Z." (period gets treated as a pathspec).
    shell: false,
    windowsHide: true,
    ...opts
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

/** npm.cmd needs a shell on Windows; git must not. */
function runNpm(cmdArgs) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const r = spawnSync(npm, cmdArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    windowsHide: true
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const pkgPath = path.join(root, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
pkg.version = version
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

runNpm(['install', '--package-lock-only', '--ignore-scripts'])

if (!push) {
  console.log(`Bumped package.json to ${version}. Re-run with --push to commit, tag, and push.`)
  process.exit(0)
}

run('git', ['add', 'package.json', 'package-lock.json'])
run('git', ['commit', '-m', `Release ${version}.`])
run('git', ['tag', `v${version}`])
run('git', ['push', 'origin', 'HEAD'])
run('git', ['push', 'origin', `v${version}`])
console.log(`Pushed v${version}. CI should publish LunarRevampedSetup.exe.`)
