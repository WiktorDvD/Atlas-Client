import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

const FEEL_VERSION = '6'
const MARKER = 'pvp-feel.version'

const PVP_OPTIMIZER_PROPS = `# Lunar Remake PvP feel - vanilla packets unchanged (no reach/timer/KB cheats).
# Delay Fix (always on) zeros leftClickCounter every click for Badlion-like cadence.
# inputOptimizer OFF: Mouse.poll every frame desyncs LWJGL clicks
# freshRaycast ON: refresh mouseOver on click so connects feel full-reach
# framePacer/renderBudgeter OFF: avoid extra frame wait before clicks land
# glStateCache ON: fewer redundant GL state changes
# netNonBlockingCheck: TCP_NODELAY on client channel
enabled=true
inputOptimizer=false
freshRaycast=true
clickLatencyLog=false
framePacer=false
framePacerFps=0
renderBudgeter=false
renderBudgetMs=2
glStateCache=true
glDebugGetError=false
particleCull=false
entityCull=false
netNonBlockingCheck=true
debugOverlay=false
managedBy=lunar-remake-pvp-feel-${FEEL_VERSION}
`

/** OptiFine keys for Badlion-like hit/KB readability + light client. */
const OPTIFINE_PATCH: Record<string, string> = {
  ofSmoothWorld: 'false', // mushy entity/KB motion when on
  ofSmoothFps: 'false',
  ofFastRender: 'true',
  ofFastMath: 'true',
  ofRenderRegions: 'true',
  ofLazyChunkLoading: 'false',
  ofSmoothBiomes: 'false',
  // Async-ish chunk pipeline within OptiFine: multi updates, dynamic priority for nearby
  ofChunkUpdates: '5',
  ofChunkUpdatesDynamic: 'true',
  ofDynamicFov: 'false',
  ofSmartAnimations: 'false',
  ofAaLevel: '0',
  ofAfLevel: '1',
  ofSky: 'false',
  ofCustomEntityModels: 'false',
  ofCustomGuis: 'false',
  ofEmissiveTextures: 'false',
  ofAnimatedWater: '0',
  ofAnimatedLava: '0',
  ofVoidParticles: 'false',
  ofWaterParticles: 'false',
  ofPortalParticles: 'false',
  ofPotionParticles: 'false',
  ofFireworkParticles: 'false',
  ofDrippingWaterLava: 'false',
  ofRainSplash: 'false',
  // Keep fire/explosion cues for PvP readability
  ofAnimatedFire: 'true',
  ofAnimatedFlame: 'true',
  ofAnimatedExplosion: 'true'
}

const VANILLA_PATCH: Record<string, string> = {
  particles: '0',
  bobView: 'false',
  fancyGraphics: 'false',
  ao: '0',
  renderClouds: 'false',
  enableVsync: 'false',
  useVbo: 'true',
  useNativeTransport: 'true',
  entityShadows: 'false',
  mipmapLevels: '0',
  maxFps: '500',
  pauseOnLostFocus: 'false',
  renderDistance: '8'
}

const DISABLE_HEAVY_MODS = [
  'ITEM_PHYSICS',
  'MOTION_BLUR',
  '3D_SKINS',
  'COLOR_SATURATION',
  'MENU_BLUR',
  'MINIMAP'
] as const

function bundledPropsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'pvp-feel', 'pvpoptimizer.properties')
  }
  return path.join(app.getAppPath(), 'resources', 'pvp-feel', 'pvpoptimizer.properties')
}

function writeProps(destDir: string): void {
  fs.mkdirSync(destDir, { recursive: true })
  const bundled = bundledPropsPath()
  const body = fs.existsSync(bundled) ? fs.readFileSync(bundled, 'utf8') : PVP_OPTIMIZER_PROPS
  fs.writeFileSync(path.join(destDir, 'pvpoptimizer.properties'), body, 'utf8')
}

function patchKeyFile(file: string, patch: Record<string, string>, jsonStyle: boolean): void {
  if (!fs.existsSync(file)) return
  if (jsonStyle) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
      for (const [key, value] of Object.entries(patch)) data[key] = value
      fs.writeFileSync(file, JSON.stringify(data), 'utf8')
    } catch {
      /* leave user file alone if corrupt */
    }
    return
  }
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const seen = new Set<string>()
  const out = lines.map((line) => {
    const i = line.indexOf(':')
    if (i < 0) return line
    const key = line.slice(0, i)
    if (!(key in patch)) return line
    seen.add(key)
    return `${key}:${patch[key]}`
  })
  for (const [key, value] of Object.entries(patch)) {
    if (!seen.has(key)) out.push(`${key}:${value}`)
  }
  fs.writeFileSync(file, `${out.filter((l, idx) => l.length > 0 || idx < out.length - 1).join('\n').replace(/\n+$/, '')}\n`, 'utf8')
}

function patchModsJson(file: string): void {
  if (!fs.existsSync(file)) return
  try {
    const mods = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, Record<string, unknown>>
    const opt = { ...(mods.PVP_OPTIMIZER || {}), enabled: true, seen: true }
    mods.PVP_OPTIMIZER = opt
    mods.DELAY_FIX = { ...(mods.DELAY_FIX || {}), enabled: true, seen: true }
    for (const id of DISABLE_HEAVY_MODS) {
      if (mods[id]) mods[id] = { ...mods[id], enabled: false }
    }
    if (mods.ONE_SEVEN_VISUALS) {
      mods.ONE_SEVEN_VISUALS = { ...mods.ONE_SEVEN_VISUALS, enabled: true, seen: true }
    }
    if (mods.PARTICLE_CHANGER) {
      const options = {
        ...((mods.PARTICLE_CHANGER.options as Record<string, unknown>) || {}),
        hideBlockBreakParticles: true,
        alwaysEnchantStrikes: true
      }
      mods.PARTICLE_CHANGER = { ...mods.PARTICLE_CHANGER, enabled: true, options, seen: true }
    }
    fs.writeFileSync(file, JSON.stringify(mods), 'utf8')
  } catch {
    /* ignore */
  }
}

/**
 * Badlion-like PvP readability on a lighter Lunar Remake stack:
 * OptiFine smooth-world off, light video settings, PvPOptimizer on (legit).
 */
export function applyPvpFeelProfile(gameDir: string, dataDir: string): void {
  const marker = path.join(gameDir, MARKER)
  const already = fs.existsSync(marker) && fs.readFileSync(marker, 'utf8').trim() === FEEL_VERSION

  // Props must refresh every launch (cwd + gameDir) — bootstrap only writes if missing.
  writeProps(gameDir)
  writeProps(process.cwd())
  try {
    writeProps(path.dirname(process.execPath))
  } catch {
    /* ignore */
  }

  if (already) return

  patchKeyFile(path.join(gameDir, 'optionsof.txt'), OPTIFINE_PATCH, false)
  patchKeyFile(path.join(gameDir, 'options.txt'), VANILLA_PATCH, false)
  patchKeyFile(path.join(gameDir, 'optionsLC.txt'), VANILLA_PATCH, true)

  const settingsGame = path.join(dataDir, 'settings', 'game')
  for (const profile of ['Default', 'Arena PvP']) {
    patchModsJson(path.join(settingsGame, profile, 'mods.json'))
  }

  fs.writeFileSync(marker, FEEL_VERSION, 'utf8')
}
