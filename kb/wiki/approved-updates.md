---
title: Approved Granola updates
type: concept
created: 2026-11-13
updated: 2026-11-13
tags:
  - granola/updates
  - security/supply-chain
source: "https://github.com/JustinBeaudry/granola-omarchy/blob/49c61172b2ae305fff002cfa3a826bf14890a4da/bin/omarchy-granola"
---

# Approved Granola updates

## Approved version versus vendor latest

The [[granola-omarchy|Granola Omarchy integration]] initially approves Granola
**7.726.2** with **Electron 44.4.2**. The vendor latest observed during development
was 7.786.3, but later bundles reportedly omit SQLite sources needed by this
builder. That report is a compatibility warning, not proof that every newer
version fails. Do not automatically adopt vendor latest without qualification.

The approved DMG is downloaded directly from Granola's release host. Its SHA-256
in `manifest.json` is:

```text
ba388e640688f07d9273690842ac13183dfbe71d9ce7d67c9208cdaf96654c8c
```

Electron is checked against its published release checksums. Granola binaries,
images and account state never belong in the public repo or KB.

## Application and recovery

A systemd user timer checks daily with up to one hour of jitter, using the latest
GitHub release's `manifest.json`. It validates the schema, numeric version and
checksum, fetches the official image, and builds in staging on the install
filesystem. Native encrypted-SQLite/update-hook/Wayland smoke tests and the
[[voice-typing-compatibility|Voice Typing compatibility bridge]] patches must pass
before activation. `current` is switched by atomic symlink replacement.

Updates serialize on a lock, defer while Granola runs, and do not restart it.
The old runtime is retained through `previous` for explicit rollback; older
builds/cache are not automatically pruned. Account data remains separate.

The launcher lock is close-on-exec, avoiding inheritance into Chromium's crash
reporter. Running detection counts Granola executables, not orphaned crashpad
helpers. Downgrades through ordinary install/update are refused; rollback is an
explicit operation. Disable updates after rollback if the previous version must
remain selected.

## Trust and operational commands

Trust is HTTPS plus control of this repository's GitHub release account.
**Manifests are not cryptographically signed.** This is deliberately distinct
from Spark's signed approval design; do not describe Granola's updater as signed.
Only the version/hash is accepted from the manifest, not an arbitrary download
URL. Compatibility code does not silently self-update: review changes, pull the
checkout, completely exit Granola and rerun `bin/install`.

```sh
omarchy-granola status
omarchy-granola update
omarchy-granola updates off
omarchy-granola rollback
omarchy-granola updates on
systemctl --user list-timers omarchy-granola-update.timer
journalctl --user -u omarchy-granola-update.service
```

Before approving an app version, verify its required native source and build,
then test sign-in, mic and system-audio transcription, sync and notes. Current
microphone/meeting limitations remain open; build success is not qualification
for real meetings. Preserve this distinction in release notes.

## Backlinks

- [[granola-omarchy|Granola Omarchy integration]] — installation and releases.
- [[voice-typing-compatibility|Voice Typing compatibility bridge]] — compatibility-code lifecycle.
