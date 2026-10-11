---
name: genesis-ichor-launch-contract
description: >-
  Genesis/Ichor launch contract for Lunar Revamped: main class, classpath,
  ichor flags, UI dir, Java 17. Use for launch args, WebOSR, ichor-boot, or
  UnsupportedClassVersionError.
---

# Genesis / Ichor launch contract

Canonical launcher builder: `F:\Projects\lunar-revamped-launcher\src\main\services\launch.ts`
Harness: `F:\Projects\LunarClientremake-main\tools\run-lunar.sh`

## Hard rules

- Main: `com.moonsworth.lunar.genesis.Genesis`
- Java **17+** (class file 61). Java 8 / old `mc-pvp-java` wrap cannot run it.
- Prefer launcher PVP Java (Graal CE 21 kit) or any JDK 17+.

## Key jars (runtime `libs\`)

- `lunar-localpatches.jar` (first)
- `multiver-full\genesis-0.1.0-SNAPSHOT-all.jar`
- `multiver-full\` modules (lunar, common, legacy, optifine, …)
- `fake-launcher.jar` (helper process, not on Genesis CP)
- `sentry-off.jar`, `vanilla\`, `natives\`

## Flags (names to preserve)

- `--ichorClassPath` — module list string
- `--classpathDir` — `libs/multiver-full`
- `--uiDir` — dir with `index.html` (prefer patched `ui-local` / hashed UI)
- `-Dlunar.a.low` / dataDir under instance `lunarclient\`
- `serviceOverrideAuthenticator` / `serviceOverrideAssetServer` → FakeBackend
- `-Dichor.filteredGenesisSentries=.*lcqt.*`

## Logs / cache

- Launcher: `%APPDATA%\.lunar-revamped\instances\<id>\logs\ichor-boot.log`
- Remake harness: `F:\Projects\LunarClientremake-main\run\logs\`
- Ichor cache: `F:\Projects\LunarClientremake-main\.ichor\`

Ports start at **28190** (IPC / asset / auth helpers).
