# Lunar Remake Launcher

Fork of **Lunar Revamped** with default **Azul Zulu Java 25** PVP kit for Minecraft **1.8.9**.

## Setup

```bash
npm install
```

## Dev

```bash
npm run dev
```

Settings → Dev runtime can point at a client remake checkout so Play works before a client release is published.

## Build

```bash
npm run dist
```

Output: `release/LunarRemakeSetup.exe`

## Data

`%APPDATA%\.lunar-remake\`

## Java

Ships `resources/mc-pvp-java25` (timer agent + forwarder). On first launch it installs **Zulu 25** into:

`%APPDATA%\.lunar-remake\runtimes\zulu-25\`

If `Desktop\Wikky\Javaas\java25` already exists, that copy is used (no download).

Default JVM preset is **pvp** (G1 low-pause). Use preset **zgc** only if you want ZGC instead.
