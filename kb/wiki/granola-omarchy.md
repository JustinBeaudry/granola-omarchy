---
title: Granola Omarchy integration
type: entity
created: 2026-11-13
updated: 2026-11-13
tags:
  - project/granola
  - omarchy/integration
source: "https://github.com/JustinBeaudry/granola-omarchy/tree/49c61172b2ae305fff002cfa3a826bf14890a4da"
aliases:
  - omarchy-granola
---

# Granola Omarchy integration

## Purpose and naming

Run the actual proprietary Granola desktop application on Omarchy, not a clone,
alternative recorder or web wrapper. The public repository is
[JustinBeaudry/granola-omarchy](https://github.com/JustinBeaudry/granola-omarchy).
It was renamed from `omarchy-granola` on 2026-11-13 to match `spark-omarchy`.

The installed management command remains `omarchy-granola`. Existing service,
socket and XDG data/cache names remain unchanged deliberately; the repository
rename does not migrate account data or installed runtime directories. Generated
launchers, service checkout paths and the Fn helper must reference the renamed
checkout. GitHub releases/tags survive the repository rename.

## Architecture

- `bin/install`: per-user installation, desktop entry, `granola://` OAuth handler,
  systemd user timer and optional-use Fn integration.
- `bin/omarchy-granola`: install/update/open/status/rollback management. The
  `granola` launcher invokes its `open` command.
- `vendor/granola-linux`: Apache-2.0 builder pinned to upstream commit
  `1ae3d637e5b0868a95156e00eabc5c6856b93626`; local changes support build-only staging.
- Official Granola DMG plus matching Linux Electron; rebuild the bundled encrypted
  SQLite source for Linux. Do not redistribute proprietary app code, icons or DMGs.
- `bin/patch-voice-typing`, `src/dictation-linux.cjs` and compositor helper scripts
  provide the [[voice-typing-compatibility|Voice Typing compatibility bridge]].
- Approved versions and staging/rollback follow
  [[approved-updates|Approved Granola updates]].

## Verification and limitations

At v0.2.1, Granola 7.726.2 / Electron 44.4.2 build and launch on the tested host.
Encrypted SQLite, update hooks and the Wayland drag shim pass native smoke tests.
The user confirmed successful sign-in and existing chats visible. OAuth-handler
registration and the systemd user timer were checked. Five Python and two Node
regression tests passed locally at this point.

These observations do **not** verify calendar sync, meeting microphone/system
capture, generated notes/summaries, meeting detection or global shortcut parity.
The user reported empty Voice Typing results and turned that feature off. Do not
promote a visible recording indicator or a passing synthetic typing test into an
end-to-end dictation claim.

Machine-specific microphone/driver diagnosis is tracked in the user's private
root KB, not this public vault. Its root cause is still unproven; preserve the
separation between project compatibility limitations and host audio problems.

## Source evidence

- [v0.1.0](https://github.com/JustinBeaudry/granola-omarchy/releases/tag/v0.1.0):
  initial app integration and approved-version updater.
- [v0.2.0](https://github.com/JustinBeaudry/granola-omarchy/releases/tag/v0.2.0):
  Linux Voice Typing bridge and Wayland insertion tests.
- [v0.2.1](https://github.com/JustinBeaudry/granola-omarchy/releases/tag/v0.2.1):
  frameless indicator, physical Fn receipt and unresolved empty results.
- Current `README.md`, `CHANGELOG.md`, `manifest.json` and tests remain the
  executable/documentary checks for later changes; reverify before reusing fixes.

## Backlinks

- [[voice-typing-compatibility|Voice Typing compatibility bridge]] — app context and verification boundary.
- [[approved-updates|Approved Granola updates]] — integration ownership and installation lifecycle.
