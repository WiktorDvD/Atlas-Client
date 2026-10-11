---
name: create-lunar-client-module
description: >-
  Add a new Lunar Revamped in-game client module (AbstractFeature). Use when
  the user asks for a new mod, HUD, mechanic, or Lunar feature — not Forge/Fabric.
---

# Create a Lunar Revamped client module

Canonical copy also lives at
`C:\Users\kmkjk\.cursor\skills\create-lunar-client-module\SKILL.md`.
Keep both in sync.

Root: `F:\Projects\LunarClientremake-main`. **Not** Forge or Fabric. Do not add loaders or new dependencies.

This is a **client** end-build (`lunar-revamped-client` / `lunar-localpatches.jar`). Do not release the launcher. Stay off `mod/skyblock/**` unless the user explicitly asks for Skyblock.

## Two trees (always)

| Tree | Path | Role |
|------|------|------|
| Reference (deobf names) | `src/reference/java/com/moonsworth/lunar/client/mod/<category>/<id>/` | Readable design. **Does not compile** into Play. |
| Runtime (obfuscated AF) | `tools/localpatches/src/com/moonsworth/lunar/client/mod/<category>/<id>/` | What Play loads via `lunar-localpatches.jar` first on the classpath. |

Ship both. Reference = contract / docs. Localpatches = real feature + hooks.

Categories: `combat`, `hud`, `misc`, `movement`, `player`, `render`.

Templates: `Hitbox`, `ReachDisplay`, `Ping`, `PvPOptimizer` (best template for sub-options + ASM).

## Placement (must appear in the module list)

1. **Reference register** — add `new YourMod()` in reference `ModsSettings.method1()` next to the same category (combat near Combo / PvpInfo). Persistence is `mods.json`.
2. **Runtime feature class** — localpatches class extending obfuscated `AbstractFeature`:
   - `com.moonsworth.lunar.client.CRICCOOHHHCHOORCICOCOHIHOIRHOO.RCIRROCCCIIHCIHCCRHHCCHOHHHCHH`
3. **ModsSettings ASM** — `tools/localpatches/tools/ModsSettingsPatcher.java` injects `new YourMod()` into the runtime feature set:
   - Class: `…HICRRICCHCCROOHHCHOCOCCHOIHHOC/RIOOCHICIHRHOHCCCCCHOCCCOHCRHI/IHIRRIIORRHORHRORIHOROIRCORCOO`
   - Method: `ICIHIOHHOCHRCIOIHCICIIOHOHHRIO` → `()Ljava/util/Set`
   - Grow the feature array (`bipush` size, e.g. 77→78) and `aastore` the new instance before the set is sealed.
4. **Bake cache** — Genesis loads `libs/multiver-full/cache/**/bake.zip` **over** jar overrides. If ModsSettings inside bake.zip is unpatched, the mod never shows. `BakeCachePatcher` (run by `build_localpatches.sh`) must rewrite every bake.zip. Also copy `lunar-localpatches.jar` → `libs/multiver-full/`.
5. **Optional bootstrap** — `ProfileData` / hooks can bind the feature early, but **list visibility** still needs steps 2–4.

If the mod is missing from the UI: check bake.zip first (most common), then localpatches jar on classpath, then ModsSettings inject size/index.

## Master toggle vs sub-features

- The mod’s own enable switch (`isEnabled()` / `super(false)`) is a **gate only** — it must **not** force every sub-option on.
- Sub-features are separate OptionFactory options (toggles / integers / …), each with its own default (usually **off**).
- Sync pattern (see PvPOptimizer):
  - On enable / tick: `config.enabled = isEnabled()` then copy each option → runtime config.
  - On disable callback: set `config.enabled = false` (leave sub-option values alone for next enable).
- Hooks should check `config.enabled && config.someSubFeature` before doing work.

User expectation: open the module settings page → see named sub-toggles → flip only what they want.

## Sub-options (settings page)

### Reference tree

```java
// fields
private final ToggleOption inputOptimizer = (ToggleOption) OptionFactory.method7("inputOptimizer").method31();
private final IntegerOption framePacerFps = … OptionFactory.method4("framePacerFps") …;

public void method2(RootSettingsBuilder builder) {
    builder.method9(new ClientOption[] { this.inputOptimizer, this.framePacerFps, … });
}
```

Also: `method29(enableCb)`, `method30(disableCb)`, `handle(EventTick…)`, optional HUD via `ModTraits` + `TypedHudRenderer`, `method20()` → `ModDetails` + `Calculator2Handler` (`field6` mechanic, `field4` hud).

### Runtime tree (obfuscated names that matter)

| Role | Obfuscated name |
|------|-----------------|
| AbstractFeature | `CRICCOOHHHCHOORCICOCOHIHOIRHOO.RCIRROCCCIIHCIHCCRHHCCHOHHHCHH` |
| Feature iface (ModsSettings array) | `CRICCOOHHHCHOORCICOCOHIHOIRHOO.IRCIIHHICIHRCOCRROCOICRIHHCCHH` |
| OptionFactory | `HHRIICOIOORCHCOIICOOIHIRHHICRI.IOHHOIIOCRHCHHCRORICCOHOHROOIH` |
| Toggle factory | `CHCHHCCOHHIIHICCHCCICHIOCHOCOC(String)` |
| Integer factory | `CHOCHCOCIIICCORORHHOCRIIIHOHHR(String)` |
| Toggle type | `HICHRCOHCCRHOHCICOOCHOIHCCHIRI` |
| Integer type | `OHHRIOHROOIHOROCIRHCHORIHRRRRI` |
| Option base (array element) | `HCHRIROHHHCORIOCROOCHRCIOROOCI` |
| Default / range builders | `RICIORHICRROHOCHRRCRIHCROOCIIC(Z)`, `RCIICICHIIRIIRHHROCOOOHRROOIIC(I)`, `OCIROOIHIHRHOCCHIIIROOCRIIOCRR(II)` |
| Build option | `CHCROCIHRRCHHCIHIICOCOCIIHCCOO()` |
| Enable / disable callbacks | `RRCRRCORICCHOHHIRCHIROOHIIOHCO(Runnable)`, `RIOOCHICIHRHOHCCCCCHOCCCOHCRHI(Runnable)` |
| Display name | `IICHOOIOHOOOHOIROCHHIOCCRRCRRR()` |
| Category / details bridge | `IOHRRIHCHOCOROCCHIRHORCRICRHRR()` → call `HHRCIHOCOCHOHIOIIORRRIIRRIIIIO()` (Lombok synthetic parent) |
| Root settings override | `RCIRROCCCIIHCIHCCRHHCCHOHHHCHH(RootSettingsBuilder)` |
| Register options on page | builder.`CRRRICCRROCOHHOHIICIHORCOORRRH(HCHRIRO…[])` |
| RootSettingsBuilder FQCN | `…HHRIICO….HHCCIRHCCCIIRHCROHIORHIRHHIORH.IRCIIHHICIHRCOCRROCOICRIHHCCHH.IRCIIHHICIHRCOCRROCOICRIHHCCHH` |

### javac cannot name RootSettingsBuilder

`HHCCIRHCCCIIRHCROHIORHIRHHIORH` is both a **class** and a **package** in `lunar.jar`. Writing the RootSettingsBuilder FQCN fails with “ambiguous” / package-class clash (same class of problem as `AccountsPatcher`).

**Required pattern (PvPOptimizer):**

1. Implement `registerRootSettings(Object builder)` in Java — reflectively find `CRRRICCRROCOHHOHIICIHORCOORRRH(option[])` and pass the option fields.
2. After `javac`, run `PvPOptimizerSettingsPatcher` (ASM) to inject:

```
public void RCIRROCCCIIHCIHCCRHHCCHOHHHCHH(L…/IRCIIHH…/IRCIIHH…;)V
  → aload_0; aload_1; invokevirtual registerRootSettings(Object); return
```

3. Wire the patcher into `tools/build_localpatches.sh` next to the other ASM tools.

Do **not** try to put helper sources inside the clashing package — javac rejects that package declaration too.

Reference for settings-only UI: stock `showGlint` in `lunar.jar` (registers toggles via `CRRRIC…`).

## Hooks / runtime behavior

Prefer Lunar bridges + existing events. Add mixins only when needed (`MinecraftEventMixin`, `v1_8`). MCP edits under `src/main/java/net/minecraft` help the deobf tree; Play still needs localpatches.

Optional sidecar config (e.g. `pvpoptimizer.properties` in `tools/localpatches/resources/`) when hooks need file persistence beyond `mods.json`.

No packet forging, reordering, or extra sends unless the user explicitly wants a non-legit combat cheat and the request is otherwise allowed.

Compile notes: Zulu/Temurin **21** via `tools/java_env.sh`; localpatches `--release 17`; LWJGL on classpath for GL hooks. Prefer `java.util.logging` over log4j in localpatches.

## Build checklist

```bash
# from LunarClientremake-main (Git Bash on Windows)
tools/build_localpatches.sh
# → libs/lunar-localpatches.jar
# → copy into libs/multiver-full/
# → ModsSettings + settings override + bake.zip patched
```

Skill: `build-runtime-patches`. Do not run full `mvn package` unless rescuing into `src/main/java`.

## Afterward

Restart Play (or reinstall/update client zip). Verify: mod in list → open settings → sub-toggles visible → master enable alone does not turn every sub-feature on.

Do not start a client GitHub release unless asked (batch same end-build). When releasing: skill `release-lunar-revamped` → `Josheyerr/lunar-revamped-client`.

## Minimal new-module file set

```
src/reference/java/.../mod/<cat>/<id>/YourMod.java          # deobf API sketch
tools/localpatches/src/.../mod/<cat>/<id>/YourMod.java      # runtime AF + options
tools/localpatches/src/.../mod/<cat>/<id>/*Hooks.java       # optional behavior
tools/localpatches/tools/ModsSettingsPatcher.java           # grow feature array (+1)
tools/localpatches/tools/YourModSettingsPatcher.java        # if settings override needed
tools/build_localpatches.sh                                 # compile + run patchers + bake
```
