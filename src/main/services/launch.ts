import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { parseArgs, presetArgs } from '../../shared/jvm'
import { IpcChannel } from '../../shared/ipc'
import type {
  CommandPreview,
  ConsoleLine,
  JavaRuntime,
  LaunchSettings,
  LaunchState
} from '../../shared/types'
import { emit } from '../bus'
import { instanceRoot } from '../paths'
import { loadStore } from '../store'
import { activeAccount, writeGameAccounts } from './auth'
import { ensureVanilla, runtimeRoot } from './download'
import { ensureJava } from './java'
import { extractNatives } from './natives'
import { startLocalServices } from './fakeServices'
import { applyPvpFeelProfile } from './pvpFeel'
import { applyLethalgensPack } from './lethalgensPack'

const VANILLA_LIBS = [
  'oshi-project/oshi-core/1.1/oshi-core-1.1.jar',
  'com/ibm/icu/icu4j-core-mojang/51.2/icu4j-core-mojang-51.2.jar',
  'net/sf/jopt-simple/jopt-simple/4.6/jopt-simple-4.6.jar',
  'com/paulscode/codecjorbis/20101023/codecjorbis-20101023.jar',
  'com/paulscode/codecwav/20101023/codecwav-20101023.jar',
  'com/paulscode/libraryjavasound/20101123/libraryjavasound-20101123.jar',
  'com/paulscode/librarylwjglopenal/20100824/librarylwjglopenal-20100824.jar',
  'com/paulscode/soundsystem/20120107/soundsystem-20120107.jar',
  'io/netty/netty-all/4.0.23.Final/netty-all-4.0.23.Final.jar',
  'com/google/guava/guava/17.0/guava-17.0.jar',
  'org/apache/commons/commons-lang3/3.3.2/commons-lang3-3.3.2.jar',
  'commons-io/commons-io/2.4/commons-io-2.4.jar',
  'commons-codec/commons-codec/1.9/commons-codec-1.9.jar',
  'net/java/jinput/jinput/2.0.5/jinput-2.0.5.jar',
  'net/java/jutils/jutils/1.0.0/jutils-1.0.0.jar',
  'com/google/code/gson/gson/2.2.4/gson-2.2.4.jar',
  'com/mojang/authlib/1.5.21/authlib-1.5.21.jar',
  'com/mojang/realms/1.7.59/realms-1.7.59.jar',
  'org/apache/commons/commons-compress/1.8.1/commons-compress-1.8.1.jar',
  'org/apache/httpcomponents/httpclient/4.3.3/httpclient-4.3.3.jar',
  'commons-logging/commons-logging/1.1.3/commons-logging-1.1.3.jar',
  'org/apache/httpcomponents/httpcore/4.3.2/httpcore-4.3.2.jar',
  'org/lwjgl/lwjgl/lwjgl/2.9.4-nightly-20150209/lwjgl-2.9.4-nightly-20150209.jar',
  'org/lwjgl/lwjgl/lwjgl_util/2.9.4-nightly-20150209/lwjgl_util-2.9.4-nightly-20150209.jar',
  'org/lwjgl/lwjgl/lwjgl-platform/2.9.4-nightly-20150209/lwjgl-platform-2.9.4-nightly-20150209.jar',
  'tv/twitch/twitch/6.5/twitch-6.5.jar',
  'org/apache/logging/log4j/log4j-api/2.22.1/log4j-api-2.22.1.jar',
  'org/apache/logging/log4j/log4j-core/2.22.1/log4j-core-2.22.1.jar',
  'org/apache/logging/log4j/log4j-slf4j-impl/2.22.1/log4j-slf4j-impl-2.22.1.jar'
]

const MODULES = [
  'lunar.jar',
  'common-0.1.0-SNAPSHOT-all-nomappings.jar',
  'legacy-0.1.0-SNAPSHOT-all-nomappings.jar',
  'optifine-0.1.0-SNAPSHOT-all.jar',
  'lunar-platform-mappings-v1_8.jar',
  'OptiFine_v1_8.jar',
  'lunar-lang.jar'
]

let game: ChildProcess | null = null
let helpers: ChildProcess[] = []
let state: LaunchState = { running: false, pid: null, startedAt: null, exitCode: null, crashReport: '' }
const lines: ConsoleLine[] = []

export function launchState(): LaunchState {
  return state
}

export function consoleLines(): ConsoleLine[] {
  return lines.slice(-400)
}

function pushLine(stream: ConsoleLine['stream'], text: string): void {
  const line: ConsoleLine = { stream, text, at: Date.now() }
  lines.push(line)
  if (lines.length > 2000) lines.splice(0, lines.length - 1500)
  emit(IpcChannel.console, line)
}

function setState(next: Partial<LaunchState>): void {
  state = { ...state, ...next }
  emit(IpcChannel.launchState, state)
}

function mergedSettings(): LaunchSettings {
  const data = loadStore()
  const instance = data.instances.find((item) => item.id === data.activeInstanceId)
  return { ...data.settings, ...instance?.settings }
}

function portListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port })
    const finish = (ok: boolean) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(100)
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.once('timeout', () => finish(false))
  })
}

async function waitForLocalPorts(ports: number[], timeoutMs = 800): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ready = await Promise.all(ports.map(portListening))
    if (ready.every(Boolean)) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

function tryBindPort(port: number): Promise<number | null> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.unref()
    server.once('error', () => resolve(null))
    server.listen(port, '127.0.0.1', () => {
      const address = server.address()
      const bound = typeof address === 'object' && address ? address.port : port
      server.close(() => resolve(bound))
    })
  })
}

/** Prefer ports near `start`; fall back to an OS-assigned ephemeral port. */
async function freePort(start: number, attempts = 300): Promise<number> {
  for (let i = 0; i < attempts; i++) {
    const port = await tryBindPort(start + i)
    if (port != null) return port
  }
  const ephemeral = await tryBindPort(0)
  if (ephemeral != null) return ephemeral
  throw new Error('No free port')
}

/**
 * Previous launches leave FakeLauncher/FakeBackend detached; they fill 28190+
 * and surface as "No free port". Reclaim listeners in the launcher IPC band.
 */
function reclaimStaleIpcPorts(from = 28190, to = 28500): void {
  if (process.platform !== 'win32') return
  try {
    const out = execFileSync('netstat', ['-ano'], { encoding: 'utf8', windowsHide: true })
    const pids = new Set<number>()
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^\s*TCP\s+127\.0\.0\.1:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i)
      if (!m) continue
      const port = Number(m[1])
      const pid = Number(m[2])
      if (port >= from && port <= to && pid > 0) pids.add(pid)
    }
    for (const pid of pids) {
      try {
        process.kill(pid)
      } catch {
        /* already gone / access denied */
      }
    }
  } catch {
    /* netstat unavailable */
  }
}

function findUi(dataDir: string, runtime: string): string {
  const roots = [path.join(dataDir, 'ui-local'), path.join(dataDir, 'ui'), path.join(runtime, 'libs', 'lunar-assets', 'ui')]
  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    for (const entry of fs.readdirSync(root)) {
      const dir = path.join(root, entry)
      if (fs.existsSync(path.join(dir, 'index.html'))) return dir
    }
    if (fs.existsSync(path.join(root, 'index.html'))) return root
  }
  return path.join(dataDir, 'ui')
}

function linkDir(target: string, linkPath: string): void {
  if (!fs.existsSync(target) || fs.existsSync(linkPath)) return
  fs.mkdirSync(path.dirname(linkPath), { recursive: true })
  const type = process.platform === 'win32' ? 'junction' : 'dir'
  fs.symlinkSync(target, linkPath, type)
}

export async function previewCommand(): Promise<CommandPreview> {
  const built = await buildPlan(false)
  return { command: built.display, warnings: built.warnings }
}

interface Plan {
  java: string
  args: string[]
  display: string
  warnings: string[]
  gameDir: string
  logFile: string
  env: NodeJS.ProcessEnv
  pre: string
  post: string
  wrapper: string
  ipc: number
  auth: number
  asset: number
  runtime: string
  dataDir: string
}

async function buildPlan(prepare: boolean): Promise<Plan> {
  const settings = mergedSettings()
  const runtime = runtimeRoot()
  if (!fs.existsSync(path.join(runtime, 'libs'))) {
    throw new Error('Client runtime is not installed. Download it from Play, or set a dev runtime in Settings.')
  }
  if (prepare) await ensureVanilla(runtime)
  const java = await ensureJava(settings.javaPath)
  const data = loadStore()
  const home = instanceRoot(data.activeInstanceId)
  const gameDir = settings.gameDir || path.join(home, 'game')
  const dataDir = path.join(home, 'lunarclient')
  const logs = path.join(home, 'logs')
  fs.mkdirSync(gameDir, { recursive: true })
  fs.mkdirSync(dataDir, { recursive: true })
  fs.mkdirSync(logs, { recursive: true })
  fs.mkdirSync(path.join(dataDir, 'profiles', '1.8', 'mods'), { recursive: true })
  applyPvpFeelProfile(gameDir, dataDir)
  applyLethalgensPack()
  const launcherCache = path.join(dataDir, 'launcher-cache')
  fs.mkdirSync(launcherCache, { recursive: true })
  fs.writeFileSync(path.join(launcherCache, 'installation-id'), 'lunar-revamped')
  const mc = path.join(runtime, 'libs', 'vanilla')
  const assets = path.join(mc, 'assets')
  if (fs.existsSync(assets)) linkDir(assets, path.join(gameDir, 'assets'))
  const textures = path.join(runtime, 'libs', 'lunar-assets', 'textures')
  if (fs.existsSync(textures)) linkDir(textures, path.join(dataDir, 'textures'))
  const natives = path.join(gameDir, 'natives')
  if (prepare) extractNatives(runtime, natives)
  const sep = path.delimiter
  const mv = path.join(runtime, 'libs', 'multiver-full')
  const cp: string[] = [path.join(mc, 'versions', '1.8.9', '1.8.9.jar')]
  const localPatch = path.join(runtime, 'libs', 'lunar-localpatches.jar')
  if (fs.existsSync(localPatch)) cp.push(localPatch)
  const genesis = path.join(mv, 'genesis-0.1.0-SNAPSHOT-all.jar')
  if (fs.existsSync(genesis)) cp.push(genesis)
  for (const jar of MODULES) {
    const file = path.join(mv, jar)
    if (fs.existsSync(file)) cp.push(file)
  }
  for (const rel of VANILLA_LIBS) {
    const file = path.join(mc, 'libraries', rel)
    if (fs.existsSync(file)) cp.push(file)
  }
  const sentry = path.join(runtime, 'libs', 'sentry-off.jar')
  if (fs.existsSync(sentry)) cp.push(sentry)

  const account = activeAccount()
  const username = account?.username || 'Player'
  const uuid = account?.uuid || '00000000000000000000000000000000'
  const token = account?.accessToken || '0'
  const preset = presetArgs(settings.jvmPreset, java.major)
  const jvmRaw = settings.jvmPreset === 'custom' ? settings.jvmArgs : `${preset} ${settings.jvmArgs}`.trim()
  const jvm = parseArgs(jvmRaw)
  if (jvm.error) throw new Error(jvm.error)
  const gameArgs = parseArgs(settings.gameArgs)
  if (gameArgs.error) throw new Error(gameArgs.error)
  const warnings = [...jvm.warnings, ...gameArgs.warnings]
  const pvpExtras = pvpLaunchArgs(settings.pvpKitPath, java)
  warnings.push(...pvpExtras.warnings)
  jvm.args = [...pvpExtras.args, ...jvm.args]
  if (settings.maxRamMb > 8192 && java.arch !== 'x64' && !java.arch.includes('64')) {
    warnings.push('Max RAM is high for a 32-bit Java.')
  }

  if (prepare) reclaimStaleIpcPorts()
  const ipc = prepare ? await freePort(28190) : 28190
  const asset = prepare ? await freePort(ipc + 1) : ipc + 1
  const auth = prepare ? await freePort(asset + 1) : asset + 1
  const ui = findUi(dataDir, runtime)
  const logConfig = path.join(logs, 'config.xml')
  if (!fs.existsSync(logConfig)) {
    fs.writeFileSync(
      logConfig,
      `<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN"><Appenders><Console name="SysOut" target="SYSTEM_OUT">
<PatternLayout pattern="[%d{HH:mm:ss}] [%t/%level]: %msg%n"/>
</Console></Appenders><Loggers><Root level="info"><AppenderRef ref="SysOut"/></Root></Loggers></Configuration>`
    )
  }
  const logUri = `file:///${logConfig.replace(/\\/g, '/')}`
  const sys = [
    '-Dlog4j2.formatMsgNoLookups=true',
    '-Dichor.filteredGenesisSentries=.*lcqt.*',
    `-Dlunar.dataDir=${dataDir}`,
    `-Dichor.fabric.localModPath=${path.join(dataDir, 'profiles', '1.8', 'mods')}`,
    '-Dichor.usingIsolatedProfiles=true',
    `-Dichor.logsFile=${path.join(logs, 'ichor-boot.log')}`,
    `-Djava.library.path=${natives}`,
    `-Dlog4j.configurationFile=${logUri}`,
    `-DserviceOverrideAuthenticator=ws://127.0.0.1:${auth}`,
    `-DserviceOverrideAssetServer=ws://127.0.0.1:${asset}`,
    '-DserviceOverrideApi=http://127.0.0.1:9',
    '-DserviceOverrideThirdPartyCache=http://127.0.0.1:9',
    '-DserviceOverrideSkins=http://127.0.0.1:9',
    '-DserviceOverrideStyngr=http://127.0.0.1:9'
  ]
  if (process.platform !== 'linux') sys.push('-DLWJGL_DISABLE_XRANDR=true')
  const heapMb = Math.max(settings.minRamMb, settings.maxRamMb)
  const commitHeap =
    isPvpKitForwarder(java.path) ||
    /graal|zulu|azul/i.test(java.version) ||
    /graal|zulu|java25/i.test(java.path)
  const mem = commitHeap
    ? [`-Xms${heapMb}M`, `-Xmx${heapMb}M`]
    : [`-Xms${settings.minRamMb}M`, `-Xmx${settings.maxRamMb}M`]
  const ichorCp =
    'lunar-localpatches.jar,sentry-off.jar,lunar.jar,common-0.1.0-SNAPSHOT-all-nomappings.jar,legacy-0.1.0-SNAPSHOT-all-nomappings.jar,optifine-0.1.0-SNAPSHOT-all.jar,genesis-0.1.0-SNAPSHOT-all.jar,lunar-lang.jar'
  const ichorExternal =
    'OptiFine_v1_8.jar,kill-sound-chat-patterns.json,vanilla_capes.json,waypoint-patterns.json,user-message-patterns.json,tier-tagger.json'
  const args = [
    ...mem,
    ...jvm.args,
    ...sys,
    '-cp',
    cp.join(sep),
    'com.moonsworth.lunar.genesis.Genesis',
    '--version',
    '1.8.9',
    '--classpathDir',
    mv,
    '--workingDirectory',
    gameDir,
    '--texturesDir',
    path.join(dataDir, 'textures'),
    '--webosrDir',
    natives,
    '--jitDir',
    path.join(dataDir, 'jit'),
    '--uiDir',
    ui,
    '--ipcPort',
    String(ipc),
    '--ichorClassPath',
    ichorCp,
    '--ichorExternalFiles',
    ichorExternal,
    '--installationId',
    'lunar-revamped',
    '--gameDir',
    gameDir,
    '--assetsDir',
    path.join(gameDir, 'assets'),
    '--assetIndex',
    '1.8',
    '--username',
    username,
    '--uuid',
    uuid,
    '--accessToken',
    token,
    '--userType',
    'legacy',
    '--width',
    String(settings.width),
    '--height',
    String(settings.height),
    ...gameArgs.args
  ]
  if (settings.fullscreen) args.push('--fullscreen')
  const display = [settings.wrapper, `"${java.path}"`, ...args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg))]
    .filter(Boolean)
    .join(' ')
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const pair of settings.env) {
    if (pair.key) env[pair.key] = pair.value
  }
  return {
    java: java.path,
    args,
    display,
    warnings,
    gameDir,
    logFile: path.join(logs, 'game.log'),
    env,
    pre: settings.preLaunch,
    post: settings.postExit,
    wrapper: settings.wrapper,
    ipc,
    auth,
    asset,
    runtime,
    dataDir
  }
}

function spawnJava(java: string, args: string[], env: NodeJS.ProcessEnv, logFile: string): ChildProcess {
  const log = fs.openSync(logFile, 'a')
  const child = spawn(java, args, {
    detached: true,
    env,
    stdio: ['ignore', log, log],
    windowsHide: false
  })
  child.unref()
  if (child.pid) raiseWindowsPriority(child.pid)
  return child
}

/** High priority so 1ms timer + attack/place packets aren't delayed by desktop scheduling. */
function raiseWindowsPriority(pid: number): void {
  if (process.platform !== 'win32' || !Number.isInteger(pid) || pid <= 0) return
  execFile(
    'powershell.exe',
    [
      '-NoProfile',
      '-WindowStyle',
      'Hidden',
      '-Command',
      `try { (Get-Process -Id ${pid}).PriorityClass = 'High' } catch { }`
    ],
    { windowsHide: true },
    () => undefined
  )
}

function watchLog(file: string): void {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '')
  let position = fs.statSync(file).size
  const timer = setInterval(() => {
    if (!state.running && !game) {
      clearInterval(timer)
      return
    }
    const size = fs.statSync(file).size
    if (size < position) position = 0
    if (size === position) return
    const fd = fs.openSync(file, 'r')
    const length = size - position
    const buffer = Buffer.alloc(length)
    fs.readSync(fd, buffer, 0, length, position)
    fs.closeSync(fd)
    position = size
    for (const text of buffer.toString('utf8').split(/\r?\n/)) {
      if (text) pushLine('out', text)
    }
  }, 400)
}

async function runShell(command: string, cwd: string): Promise<void> {
  if (!command.trim()) return
  await new Promise<void>((resolve, reject) => {
    const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash'
    const args = process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-lc', command]
    const child = spawn(shell, args, { cwd, windowsHide: true })
    child.on('exit', (code) => {
      if (code && code !== 0) reject(new Error(`Command failed (${code}): ${command}`))
      else resolve()
    })
    child.on('error', reject)
  })
}

export async function startGame(): Promise<LaunchState> {
  if (state.running) throw new Error('The game is already running.')
  let plan: Plan | null = null
  try {
    plan = await buildPlan(true)
    await runShell(plan.pre, plan.gameDir)
    const accounts = path.join(plan.dataDir, 'settings', 'game', 'accounts.json')
    writeGameAccounts(accounts)
    const logs = path.dirname(plan.logFile)
    const discovery =
      [path.join(plan.runtime, 'tools', 'fake-launcher', 'discovery.json'), path.join(plan.runtime, 'discovery.json')].find(
        (file) => fs.existsSync(file)
      ) ?? ''
    const fake = startLocalServices({
      java: plan.java,
      runtime: plan.runtime,
      ipc: plan.ipc,
      asset: plan.asset,
      auth: plan.auth,
      accountsFile: accounts,
      logsDir: logs,
      discovery,
      env: plan.env
    })
    helpers = fake
    await waitForLocalPorts([plan.ipc, plan.asset, plan.auth], 3000)
    const javaBin = plan.wrapper ? plan.wrapper : plan.java
    const javaArgs = plan.wrapper ? [plan.java, ...plan.args] : plan.args
    fs.writeFileSync(plan.logFile, '')
    game = spawnJava(javaBin, javaArgs, plan.env, plan.logFile)
    setState({ running: true, pid: game.pid ?? null, startedAt: Date.now(), exitCode: null, crashReport: '' })
    pushLine('launcher', `Genesis started (pid ${game.pid ?? '?'})`)
    watchLog(plan.logFile)
    const pid = game.pid
    const poll = setInterval(() => {
      if (!pid) return
      try {
        process.kill(pid, 0)
      } catch {
        clearInterval(poll)
        for (const helper of helpers) {
          if (helper.pid) {
            try {
              process.kill(helper.pid)
            } catch {
              /* already gone */
            }
          }
        }
        helpers = []
        const crash = findCrash(plan!.gameDir)
        setState({ running: false, exitCode: 0, crashReport: crash })
        pushLine('launcher', crash ? `Game exited. Crash report: ${crash}` : 'Game exited.')
        void runShell(plan!.post, plan!.gameDir).catch((error: unknown) => {
          pushLine('err', error instanceof Error ? error.message : 'Post-exit command failed')
        })
        game = null
      }
    }, 1500)
    return state
  } catch (error) {
    for (const helper of helpers) {
      if (helper.pid) {
        try {
          process.kill(helper.pid)
        } catch {
          /* already gone */
        }
      }
    }
    helpers = []
    game = null
    setState({ running: false })
    throw error
  }
}

function findCrash(gameDir: string): string {
  const dir = path.join(gameDir, 'crash-reports')
  if (!fs.existsSync(dir)) return ''
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.txt')).sort()
  const latest = files[files.length - 1]
  return latest ? path.join(dir, latest) : ''
}

/** True when javaPath is the mc-pvp-java* forwarder (sibling graalvm.path). */
function isPvpKitForwarder(javaPath: string): boolean {
  const dir = path.dirname(javaPath)
  const root = path.basename(dir).toLowerCase() === 'bin' ? path.dirname(dir) : dir
  return fs.existsSync(path.join(root, 'graalvm.path'))
}

/**
 * Light kit extras for GraalVM 17:
 * - timer-agent when using a manual kit folder
 * - forwarder already injects timer-agent + light pvp-client.args (do not double-stack heavy G1)
 */
function pvpLaunchArgs(
  kitPath: string,
  java: JavaRuntime
): { args: string[]; warnings: string[] } {
  const args: string[] = []
  const warnings: string[] = []
  const kitForwarder = isPvpKitForwarder(java.path)
  if (kitForwarder) {
    // Forwarder already injects timer-agent + light pvp-client.args — do not stack more.
    return { args, warnings }
  }
  const kit = kitPath.trim()
  if (kit) {
    const agentJar = path.join(kit, 'timer-agent.jar')
    const agentDll = path.join(kit, 'timer-agent.dll')
    if (fs.existsSync(agentJar) && fs.existsSync(agentDll)) {
      args.push(`-javaagent:${agentJar}`)
    } else if (fs.existsSync(agentJar) || fs.existsSync(agentDll)) {
      warnings.push('PVP kit is incomplete (need both timer-agent.jar and timer-agent.dll).')
    } else if (fs.existsSync(kit)) {
      warnings.push('PVP kit folder has no timer-agent; timings agent not loaded.')
    }
  }
  return { args, warnings }
}

export function stopGame(): void {
  if (game?.pid) {
    try {
      process.kill(game.pid)
    } catch {
      /* already gone */
    }
  }
  for (const helper of helpers) {
    if (helper.pid) {
      try {
        process.kill(helper.pid)
      } catch {
        /* already gone */
      }
    }
  }
  helpers = []
  game = null
  setState({ running: false })
}
