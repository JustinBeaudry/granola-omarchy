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
