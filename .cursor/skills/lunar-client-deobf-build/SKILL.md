---
name: lunar-client-deobf-build
description: >-
  Compile the LunarClientremake deobf MCP/Lunar Java tree (mvn/gradle, fast_green,
  quarantine). Use for compile errors, jarWithDependencies, or moving sources
  out of reference/java. Not for runtime localpatches jars.
---

# Client deobf build

Root: `F:\Projects\LunarClientremake-main` · JDK via `tools/java_env.sh`.

**Play path uses vendored `libs/multiver-full\*.jar`, not `target\*.jar`.** Deobf build is for source recovery / editing Lunar sources.

## Common commands

```bash
# Full Maven package (skip tests)
mvn -Dmaven.test.skip=true clean package

# Gradle
gradle compileLunar
gradle jarWithDependencies

# Faster green loops
bash tools/fast_green.sh
bash tools/verify.sh
bash tools/build_until_green.sh
```

Outputs under `target\` (e.g. `lunar-client-deobf-1.8.9*.jar`).

## Source layout

- Active: `src/main/java/net/minecraft`, `src/main/java/com/moonsworth`
- Quarantine: `src/reference/java` — do not compile; rescue back carefully
- Error helpers: `tools/analyze_compile_errors.py`, `tools/classify_errors.py`
- Renames: `tools/renames/`, `bash tools/apply_renames.sh`

## Do not confuse with

- `bash tools/build_localpatches.sh` → runtime override jar (skill: `build-runtime-patches`)
- Packaging zip for GitHub (skill: `release-lunar-revamped`)
