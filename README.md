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
omarchy pkg add base-devel python nodejs npm curl 7zip desktop-file-utils xdg-utils
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
shim. That does **not** prove sign-in, calendar sync, transcription, summarizing,
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

To remove integration (close Granola first):

```sh
omarchy-granola updates off
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
