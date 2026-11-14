// Linux implementation of the native surface Granola's own dictation utility uses.
// Audio capture, transcription and rewriting remain entirely Granola's code.
'use strict';
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { performance } = require('node:perf_hooks');

let server = null;
let callback = null;
let lastEvent = null;
let eventCount = 0;
const clients = new Set();
const directory = path.join(process.env.XDG_RUNTIME_DIR || `/run/user/${process.getuid()}`, 'omarchy-granola');
const socket = path.join(directory, 'dictation.sock');
// Granola's utility uses its macOS key-code table on non-Windows platforms.
const keys = { Fn: 63, Escape: 53, ControlRight: 62, AltRight: 61, Space: 49 };

function run(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let error = '';
    child.stderr.on('data', chunk => { error = (error + chunk).slice(-1024); });
    child.on('error', reject);
    child.stdin.on('error', () => {});
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`${command} timed out`)); }, 10000);
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${code}): ${error}`));
    });
    child.stdin.end(input);
  });
}

function event(line) {
  // This protocol can deliver only the configured keys; it cannot run commands
  // or receive arbitrary keyboard activity, transcripts or credentials.
  const match = /^(Fn|Escape|ControlRight|AltRight|Space) (down|up)$/.exec(line);
  if (!match || !callback) return;
  const [, key, edge] = match;
  if (lastEvent === line) return;
  lastEvent = line;
  eventCount += 1;
  callback({ type: edge === 'down' ? 'keyDown' : 'keyUp', keyCode: keys[key],
    flags: [], autorepeat: false, timestamp: performance.now() });
}

module.exports = {
  getDoubleClickIntervalMs: () => 400,
  getSecureInputState: () => ({ secureInput: false }),
  registerHotKeys() {},
  setFnActionDisabled() {},
  setFnHardwareFallbackEnabled() {},
  // Do not inspect other applications' text or screens on Linux.
  getScreenContext: async () => ({ appId: null, windowTitle: null, focusedField: null, nearbyText: null }),
  filterScreenKeyterms: async terms => terms,
  tapCreate(fn) {
    if (server) throw new Error('Dictation listener already active');
    callback = fn;
    lastEvent = null;
    eventCount = 0;
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    // Utility lifecycle is serialized by Granola; stale sockets survive a crash.
    try { fs.unlinkSync(socket); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    server = net.createServer(client => {
      clients.add(client);
      client.setEncoding('utf8');
      let buffer = '';
      client.on('data', data => {
        buffer += data;
        if (buffer.length > 256) { client.destroy(); return; }
        let end;
        while ((end = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, end);
          if (line === 'status') client.write(JSON.stringify({ listening: true, events: eventCount }) + '\n');
          else event(line);
          buffer = buffer.slice(end + 1);
        }
      });
      client.on('error', () => {});
      client.on('close', () => clients.delete(client));
    });
    server.on('error', error => { console.error('Granola Linux shortcut bridge:', error.message); });
    server.listen(socket, () => fs.chmodSync(socket, 0o600));
  },
  tapDestroy() {
    callback = null;
    for (const client of clients) client.destroy();
    clients.clear();
    if (server) { server.close(); server = null; }
    try { fs.unlinkSync(socket); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  },
  async pasteText(text) {
    try {
      // Stdin keeps dictated text out of process arguments and clipboard history.
      // wtype uses Wayland's virtual keyboard, without root or /dev/input access.
      await run('wtype', ['-'], String(text));
      return { success: true };
    } catch (error) {
      console.error('Granola Linux text insertion:', error.message);
      return { success: false, reason: 'paste_failed' };
    }
  },
};
