---
name: release-lunar-revamped
description: >-
  Release or push Lunar Revamped launcher and/or client GitHub builds.
  Use when the user says release, publish, push update, ship, tag, or upload
  LunarRevampedSetup / lunar-revamped-client.
---

# Release Lunar Revamped

Canonical copy also lives at
`F:\Projects\lunar-revamped-launcher\.cursor\skills\release-lunar-revamped\SKILL.md`.
Prefer that file if both exist (keep them in sync).

Repos: `F:\Projects\lunar-revamped-launcher` · `F:\Projects\LunarClientremake-main`.

**Batch:** finish all tasks for the same end-build, then one release. Launcher ≠ client.

Commit/tag/push allowed when the user asked to release. Do not rediscover steps — run the commands below.

## Versions

```bash
gh release list --repo Josheyerr/lunar-revamped-launcher --limit 1
gh release list --repo Josheyerr/lunar-revamped-client --limit 1
```

## Launcher

```bash
cd F:/Projects/lunar-revamped-launcher
# if PVP kit binaries changed:
node scripts/sync-pvp-java-resources.mjs
node scripts/release-launcher.mjs --version X.Y.Z --push
gh run list --repo Josheyerr/lunar-revamped-launcher --limit 3
```

Local fallback: `npm run dist` then `gh release create|upload vX.Y.Z release/LunarRevampedSetup.exe release/latest.yml --repo Josheyerr/lunar-revamped-launcher` (`--clobber` on upload).

## Client

```bash
cd F:/Projects/lunar-revamped-launcher
node scripts/package-client.mjs --runtime F:/Projects/LunarClientremake-main --version X.Y.Z --publish
# if tag exists:
gh release upload vX.Y.Z release-client/lunar-revamped-client-X.Y.Z.zip --repo Josheyerr/lunar-revamped-client --clobber
```

## Done

Return release URLs for what was shipped.
