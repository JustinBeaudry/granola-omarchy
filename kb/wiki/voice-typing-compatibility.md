---
title: Voice Typing compatibility bridge
type: concept
created: 2026-11-13
updated: 2026-11-13
tags:
  - granola/voice-typing
  - linux/wayland
source: "https://github.com/JustinBeaudry/granola-omarchy/commit/f325f27"
---

# Voice Typing compatibility bridge

## Why it exists

The original [[granola-omarchy|Granola Omarchy integration]] launched the app but
did not include Granola's macOS `native/dictation_utils.node` helper. Granola's
utility process depends on that helper for shortcut events and text insertion.
Changing a shortcut preference alone could not provide those native functions.

`bin/patch-voice-typing` performs length-preserving ASAR substitutions: load
`dictation_utils.cjs` instead of the macOS module and use Fn as the non-Windows
default. Patching is idempotent, preserves archive offsets, and refuses an
upstream build whose expected loader/default patterns no longer match. A local
pre-patch ASAR backup is retained; it must never be committed or redistributed.

## Linux implementation

- Granola keeps its own audio capture, transcription, rewriting and history code.
- The JavaScript helper implements the native interface expected by Granola's
  dictation utility; it is not another speech-to-text service.
- Omarchy `o.bind_hold("XF86Fn", …)` forwards press/release events for left Fn on
  the tested Apple SPI keyboard. Internal Granola hold shortcut stays Fn.
- Hold for at least 300 ms and release to finish; double-tap Fn for hands-free,
  then press Fn again to finish. Fn+Space shown in Granola's UI is not wired.
- `bin/install-voice-shortcut 'SUPER + ALT + V'` can change the physical chord;
  this still maps to Fn inside Granola. Arbitrary shortcuts recorded in Granola's
  settings are not automatically registered with the compositor.
- A private per-user Unix socket carries only allowed key edges and health/count
  queries. There is no root/raw keyboard listener or global input-device access.
- `wtype -` receives dictated text on stdin, keeping it out of process arguments
  and clipboard history. It types into the currently focused field.
- A `class=granola`, `title=Nub` rule makes only the recording pill floating,
  borderless, undecorated and shadowless; the main window keeps its normal style.

## Verified and unresolved

The native utility stayed alive, Granola settings displayed Fn, physical Fn
receipt and `voice_typing_started` events were observed, and Unicode text was
inserted into a disposable real Wayland GTK test window. Tests cover the private
socket, allowed edges, stdin insertion, failure handling and ASAR idempotency.

Actual user attempts finished with `outcome: empty` and zero characters. The user
disabled Granola Voice Typing. No end-to-end spoken transcription fix is claimed.
The host microphone path is being investigated separately in the root KB.

Unsupported Linux-native functionality includes screen context/accessibility text
collection, rich-text insertion, edit observation/automatic word learning and
secure/password-field detection. Users must focus the intended field themselves.
Granola still sends audio to its own services; this bridge is not offline ASR.

## Lifecycle

Changes to compatibility code require an explicit reviewed checkout update and
complete app exit before reinstallation. A hidden tray instance is still running;
closing its window does not guarantee exit. Do not clear the user's account data
to apply a bridge change. New approved app builds are patched before activation
under [[approved-updates|Approved Granola updates]].

## Backlinks

- [[granola-omarchy|Granola Omarchy integration]] — architecture and app behavior.
- [[approved-updates|Approved Granola updates]] — per-build patching and compatibility gates.
