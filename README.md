# Optic

Optic is the default launcher for [WiktorDvD/Atlas-Client](https://github.com/WiktorDvD/Atlas-Client).

**Install:** download [`Optic.exe`](https://github.com/WiktorDvD/Atlas-Client/releases/latest/download/Optic.exe) from the latest GitHub release.

**Play updates:** pressing Play checks this repo and downloads newer game client builds (`Atlas-Client-*.zip`) before launch. The Optic hitreg / visual pack is applied automatically.

**Launcher updates:** installed copies check this repo for newer `Optic.exe` builds.

## Dev

```bash
npm install
npm run sync:optic
npm run sync:pvp-java
npm run dev
```

## Release launcher

```bash
node scripts/release-launcher.mjs --version X.Y.Z --push
```

CI builds and publishes `Optic.exe` on tag `vX.Y.Z`.
