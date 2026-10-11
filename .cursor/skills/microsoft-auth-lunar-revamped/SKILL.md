---
name: microsoft-auth-lunar-revamped
description: >-
  Microsoft device-code login and game accounts.json for Lunar Revamped.
  Use for Xbox/MSA errors, offline accounts, device code, or FakeBackend auth.
---

# Microsoft auth (Lunar Revamped)

## Launcher

- Code: `F:\Projects\lunar-revamped-launcher\src\main\services\auth.ts`
- Client id: `MS_CLIENT_ID` in `src/shared/manifest.ts` (official MC launcher id)
- Flow: device code → live.com token → XBL → XSTS → Minecraft services profile
- UI should open `microsoft.com/link` and copy the user code
- Progress: IPC auth progress channel

Tokens stored encrypted in `%APPDATA%\.lunar-revamped\` settings (electron-store + safeStorage).

## Game-facing accounts

On launch, launcher writes:
`%APPDATA%\.lunar-revamped\instances\<id>\lunarclient\settings\game\accounts.json`

Harness helper: `F:\Projects\LunarClientremake-main\tools\active_account.py`
Same relative path under `run/lunarclient/settings/game/`.

## Offline

Offline username accounts are local-only. Validate non-empty username in UI; do not throw from account lookup (return null / block launch).

## FakeBackend

Genesis uses `serviceOverrideAuthenticator` pointing at local FakeBackend — not Lunar production relay. Auth failures after MSA success → check fake-backend log + accounts.json shape.
