---
name: debug-client-launch
description: >-
  Triage Lunar Revamped launch failures: crashes, Connecting stuck, ports,
  FakeLauncher/FakeBackend, ichor logs. Use when Play fails or the game exits
  immediately.
---

# Debug client launch

## Log locations

**Launcher instance** `%APPDATA%\.lunar-revamped\instances\<id>\`:
- `logs\ichor-boot.log`
- `logs\fake-launcher.log` / `fake-backend.log`
- `game\crash-reports\`
- `lunarclient\settings\game\accounts.json`

**Harness** `F:\Projects\LunarClientremake-main\`:
- `run\logs\`, `run\game\crash-reports\`, `.ichor\genesis.log`

## Checklist (cheap first)

1. Java 17+? (`UnsupportedClassVersionError` → not Java 8)
2. Runtime has `libs\`? Dev runtime vs `%APPDATA%\.lunar-revamped\versions\`
3. `lunar-localpatches.jar` + genesis jar exist
4. Ports from **28190** free? Kill stale `FakeLauncher` / `FakeBackend` / old game
5. UI dir has `index.html` (`--uiDir`)
6. Offline username empty/invalid → launcher should block; check accounts.json
7. Settings → Preview command — confirm main + overrides

## Harness vs launcher

- Launcher: Electron Play → `launch.ts`
- Remake only: `bash tools/run-lunar.sh` or `gradle runLunar`

Natives: extracted into `game\natives` (launcher) or via `tools/extract_natives.py`.
