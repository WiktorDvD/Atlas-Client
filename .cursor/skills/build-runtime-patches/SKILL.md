---
name: build-runtime-patches
description: >-
  Rebuild Lunar Revamped runtime overrides: lunar-localpatches.jar, FakeLauncher,
  and patched UI. Use for branding, alt manager, accounts UI, FakeBackend, or
  ui-local changes.
---

# Build runtime patches

Root: `F:\Projects\LunarClientremake-main` (Git Bash / WSL for `.sh`).

## localpatches (classpath-first overrides)

```bash
bash tools/build_localpatches.sh
# → libs/lunar-localpatches.jar
```

Sources: `tools/localpatches/` · ASM patchers (Branding/Accounts) in that build.
Must stay **first** on the game classpath (launcher already prepends it).

## FakeLauncher / FakeBackend

```bash
bash tools/build_fakelauncher.sh
# → libs/fake-launcher.jar
```

Discovery: `tools/fake-launcher/discovery.json`.

## UI overlay

```bash
python tools/patch_ui.py --official libs/lunar-assets/ui --out run/lunarclient/ui-local
```

`package-client.mjs` copies `run/lunarclient/ui-local` → staged `libs/lunar-assets/ui`.

## After rebuilds

- Dev: restart Play (dev runtime reads `libs\` live).
- Ship: use `release-lunar-revamped` / `package-client.mjs --publish`.

Do not rebuild full deobf (`mvn package`) for these jars — that is a different skill.
