# v0.2.0

Add Linux support for Granola's own Voice Typing.

- Replace the unavailable macOS dictation helper with a JavaScript Linux bridge.
- Keep Granola's audio, transcription, rewriting and dictation history intact.
- Bind left Fn via Hyprland for hold/release and double-tap hands-free gestures.
- Insert text through Wayland `wtype` using stdin, without clipboard-history exposure.
- Use a private Unix socket, without root privileges or raw input-device access.
- Add configurable compositor shortcut installation with conflict/config checks.
- Reapply length-preserving Voice Typing patches to new approved app builds.
- Fix update-lock inheritance and exclude orphaned crash reporters from app-running checks.
- Add patch idempotency/failure tests and shortcut/typing bridge tests.

Verified: user confirmed successful sign-in and existing chats; Granola's
shortcut utility remains alive, settings show Fn, Hyprland configuration is
valid, and real Unicode insertion into a disposable GTK Wayland window works.
Five Python tests and two Node tests pass. **Physical Fn triggering and a spoken
end-to-end dictation test still require user verification.** A synthetic Fn tap
sent through `wtype` did not trigger the compositor binding; direct bridge events
are tested separately. No spoken end-to-end dictation test was performed.

Linux limitations: no native screen context, rich-text insertion, edit observation,
or automatic focused-password-field detection. Fn+Space shown in Granola's UI
is not mapped; use double-tap Fn. Compatibility code updates remain explicit.

# v0.1.0

Initial Omarchy integration for the genuine Granola desktop application.

- Per-user installation of Granola 7.726.2 with Linux Electron 44.4.2.
- Official DMG pinned by SHA-256; no proprietary software redistributed.
- Encrypted SQLite rebuilt from bundled source; Wayland drag compatibility fix.
- Desktop launcher and `granola://` sign-in callback handler.
- Daily automatic application of maintainer-approved release manifests.
- Serialized updates, staged activation, retained previous builds and rollback.
- Updates defer while the app is running; no forced restart or sandbox disabling.

Verified on x86-64 Omarchy: native build, encrypted database/update-hook/Wayland
shim smoke tests, mapped Granola desktop window, OAuth handler registration,
and enabled systemd user timer. Manager unit tests and shell syntax checks pass.

**Not yet verified:** successful account sign-in, calendar sync, microphone or
system-audio transcription, generated summaries, meeting detection or global
shortcuts. Test with a disposable note before relying on this for meetings.

Automatic updates cover compatible Granola app versions, not integration code.
Manifests use HTTPS/GitHub account trust, not detached cryptographic signatures.
