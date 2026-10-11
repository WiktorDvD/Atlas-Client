---
name: dev-launch-lunar-revamped
description: >-
  Run and debug the Lunar Revamped Electron launcher against the local remake
  tree. Use for npm run dev, Play, dev runtime, LUNAR_REVAMPED_RUNTIME, or
  launcher not finding the client.
---

# Dev launch Lunar Revamped

## Start launcher

```bash
cd F:/Projects/lunar-revamped-launcher
npm install   # once
npm run dev   # build:main + Vite :5173 + ELECTRON_DEV=1 electron .
npm run typecheck
```

## Client tree Play uses

1. Settings **Dev runtime** (default when folder exists): `F:\Projects\LunarClientremake-main`
2. Else env `LUNAR_REVAMPED_RUNTIME`
3. Else installed `%APPDATA%\.lunar-revamped\versions\<version>\`

Runtime must contain `libs\` (multiver-full, vanilla, natives, jars).

## Instance dirs

`%APPDATA%\.lunar-revamped\instances\<id>\`
- `game\` — MC gameDir / natives / crash-reports
- `lunarclient\` — dataDir, UI, `settings\game\accounts.json`
- `logs\` — `ichor-boot.log`, fake-launcher/backend logs

## Default Java

Bundled PVP Java installs on boot into:
`%APPDATA%\.lunar-revamped\runtimes\mc-pvp-java17\bin\java.exe`
(Java 17+ required; Genesis is class file 61.)

## Quick checks

- Dev runtime path set and `libs\multiver-full\genesis-*.jar` exists
- `libs\lunar-localpatches.jar` present after patch rebuilds
- Preview command in Settings shows Genesis + `--uiDir` + FakeLauncher ports
