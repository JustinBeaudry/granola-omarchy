# omarchy-granola

Run the **actual Granola desktop app** on Omarchy, with automatic updates to
maintainer-approved compatible versions. Not a clone, web wrapper, or alternative.
Unofficial; not affiliated with or supported by Granola Labs.

Granola only distributes macOS and Windows builds. This integration downloads
its official macOS image, uses matching Linux Electron, and rebuilds Granola's
SQLite module. No Granola binaries, icons, notes, or credentials are distributed.
You need your own Granola account. Audio sent by Granola is processed by its
services; this is **not** an offline/private transcription tool. Obtain meeting
participants' consent before recording.

## Install (Omarchy / x86-64 Arch)

Requires Python 3.11+, Node ^22.22.2 / ^24.15.0 / >=26, npm, g++ >=11,
7-Zip >=21.02, curl, make, a working Electron desktop, and systemd user services.
Omarchy normally provides the desktop/runtime libraries and PipeWire.

```sh
omarchy pkg add base-devel python nodejs npm curl 7zip desktop-file-utils xdg-utils wtype
git clone https://github.com/JustinBeaudry/omarchy-granola.git ~/Work/omarchy-granola
cd ~/Work/omarchy-granola
./bin/install
```

Keep the checkout in place: launchers and the update service reference it.
The install is per-user, never needs root, and does not change Hyprland settings
or files in `/usr/share/omarchy`. The dependency command may need administrator
authorization. Initial download/build can take several minutes.

Launch **Granola** from Super+Space or run `granola`. Sign in through your
browser; the installer registers the `granola://` callback with this app.
Existing Granola notes/session under `~/.config/Granola` are reused, not deleted.

## Voice Typing — left Fn

Granola's original Voice Typing UI, audio capture, transcription and rewriting
are retained. A small Linux JavaScript module replaces its macOS-only shortcut
and text-insertion helper; it does not substitute a different dictation service.

The installer adds an Omarchy `o.bind_hold("XF86Fn", …)` binding. On Apple SPI
keyboards, this is the **left Fn** key. Enable Voice Typing in Granola's settings
and keep its hold shortcut set to **Fn**:

- **Hold Fn** for at least 300 ms, speak, then **release** to finish and insert.
- **Double-tap Fn** for hands-free; press Fn again to finish.
- Focus the intended text field **before** recording. Text is inserted with
  `wtype` over Wayland, not copied through clipboard history.

To use a different physical shortcut, with Granola's internal shortcut still Fn:

```sh
./bin/install-voice-shortcut 'SUPER + ALT + V'
./bin/granola-voice-key status  # listener health and configured-edge count only
```

Check for existing bindings before choosing a custom chord. The installer
refuses to overwrite another Fn action. Fn may not reach the compositor on other
keyboard models. Granola's displayed **Fn+Space** default is not wired by this
bridge; use double-tap Fn instead. Arbitrary shortcuts recorded in Granola's UI
are not automatically registered with Hyprland.

Only configured key edges cross a private per-user Unix socket. No root access,
input-device permissions, global raw key listener, screen reading or accessibility
text collection is used. Rich-text insertion, edit observation/automatic word
learning and native screen context are not implemented on Linux. Linux does not
check the focused field for secure/password input: choose the target carefully.
Audio/transcripts still go to Granola's services under its policies.

To upgrade an existing installation: **quit Granola completely**, update this
checkout and rerun `./bin/install`. A hidden tray process is still running;
merely closing its window is not enough. Startup and native-helper/Wayland typing
have been tested; final microphone-to-transcript-to-insertion verification
requires speaking into a test field on your machine.

## Updates and rollback

A systemd user timer checks daily (with up to an hour of jitter). It fetches
`manifest.json` from this repository's **latest GitHub release**, validates the
version and SHA-256, then builds using the locally installed compatibility code.
Only this repository's maintainers choose approved versions; the vendor's latest
release is **not automatically assumed compatible**. The initial approved
version is **7.726.2**; later bundles reportedly omit required native source.

Downloads come directly from Granola. The manifest pins the DMG checksum;
Electron is checked against its published checksums. The SQLite/native smoke
test must pass before activation. Failed builds leave the current build intact.
Updates defer while Granola runs, retain old builds, and do not restart the app.

```sh
omarchy-granola status
omarchy-granola update                 # check/apply an approved release now
omarchy-granola updates off            # disable automatic application
omarchy-granola rollback               # close Granola first
omarchy-granola updates on
journalctl --user -u omarchy-granola-update.service
systemctl --user list-timers omarchy-granola-update.timer
```

Trust model: HTTPS plus the GitHub release account is the update trust root.
Manifests are **not cryptographically signed**. Anyone controlling this repo's
releases could approve a malicious app. No arbitrary manifest download URL is
accepted. Compatibility code does not silently self-update: review changes,
`git pull --ff-only`, and rerun `./bin/install` when a release requires new
patches. Turning updates off is recommended after rollback to avoid reapplying
the approved version. Old builds/downloads are retained; monitor disk usage.

## Verify before real meetings

Installation smoke-tests encrypted SQLite, update hooks, and the Wayland drag
shim, then installs the length-preserving Voice Typing patches. The dictation
utility has been observed staying alive, and real Unicode text insertion into
a disposable Wayland GTK window has been verified. That does **not** prove sign-in, calendar sync, transcription, summarizing,
or system-audio capture work on your machine. After signing in, start a test note,
speak into the microphone, play system audio, and verify **both** appear in the
transcript and generated notes. Portal/PipeWire loopback behavior can vary.
Meeting auto-detection and global shortcuts are not guaranteed. No separate
recorder or fallback service is installed.

Do not disable Chromium's sandbox to work around launch failures. If the build
reports restricted user namespaces, review the vendor script's instructions
rather than granting broad privileges to this integration.

## Files and removal

- `~/.local/share/omarchy-granola/releases/`: per-version runtime/builds
- `~/.local/share/omarchy-granola/current`, `previous`: atomic build selectors
- `~/.cache/omarchy-granola/`: downloaded images and build cache
- `~/.config/Granola/`: **Granola's own private account and notes data**
- `~/.config/systemd/user/omarchy-granola-update.*`: update service/timer
- `~/.config/hypr/granola-voice.lua`: compositor shortcut, loaded from `bindings.lua`

To remove integration (close Granola first):

```sh
omarchy-granola updates off
# Remove require("granola-voice") from ~/.config/hypr/bindings.lua first.
rm ~/.config/hypr/granola-voice.lua
hyprctl reload
hyprctl configerrors
rm ~/.config/systemd/user/omarchy-granola-update.{service,timer}
systemctl --user daemon-reload
rm ~/.local/bin/{granola,granola-omarchy,omarchy-granola}
rm ~/.local/share/applications/omarchy-granola.desktop
update-desktop-database ~/.local/share/applications
# Optional: remove runtimes/cache only, NOT account data:
rm -rf ~/.local/share/omarchy-granola ~/.cache/omarchy-granola
```

Paths above assume default XDG directories. Restore another `granola://` handler
with `xdg-mime` if applicable. Account data is intentionally kept.

## Development and releases

```sh
python3 -m unittest discover -s tests -v
node --test tests/dictation.test.cjs
bash -n bin/install vendor/granola-linux
```

Before approving a new version: download from Granola, record its SHA-256,
verify native sources remain present, build in an isolated XDG data/cache root,
and manually test authentication, microphone **and** system audio, sync and notes.
Update `manifest.json`, document results, commit, tag, then attach the manifest:

```sh
gh release create vX.Y.Z manifest.json --title vX.Y.Z --notes-file CHANGELOG.md
```

Never upload DMGs, extracted apps, or user data. Integration source is Apache-2.0.
The vendored builder is from [cacarico/granola-linux](https://github.com/cacarico/granola-linux)
at `1ae3d637e5b0868a95156e00eabc5c6856b93626` (Apache-2.0); see
[`vendor/NOTICE`](vendor/NOTICE). Local changes disable desktop registration during
staged builds and make optional test-extension copying explicit. Granola remains
proprietary and governed by its own terms, which reportedly restrict reverse
engineering; review those terms before using this compatibility integration.
