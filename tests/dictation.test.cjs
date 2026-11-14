'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'granola-voice-test-'));
process.env.XDG_RUNTIME_DIR = tmp;
const bridge = require('../src/dictation-linux.cjs');
after(() => { bridge.tapDestroy(); fs.rmSync(tmp, { recursive: true, force: true }); });

test('private socket delivers only allowed shortcut edges', async () => {
  const events = [];
  bridge.tapCreate(event => events.push(event));
  const socket = path.join(tmp, 'omarchy-granola/dictation.sock');
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(fs.statSync(socket).mode & 0o777, 0o600);
  assert.equal(fs.statSync(path.dirname(socket)).mode & 0o777, 0o700);
  await new Promise((resolve, reject) => {
    const client = net.connect(socket, () => client.end('Fn down\nFn down\nFn up\nKeyA down\ncommand anything\n'));
    client.on('error', reject);
    client.on('close', resolve);
  });
  assert.deepEqual(events.map(x => [x.type, x.keyCode]), [['keyDown', 63], ['keyUp', 63]]);
  assert.ok(events.every(x => !x.autorepeat && x.timestamp > 0));
  bridge.tapDestroy();
  assert.equal(fs.existsSync(socket), false);
});

test('dictated text goes to wtype stdin, not arguments or clipboard', async () => {
  const bin = path.join(tmp, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'wtype'), '#!/usr/bin/env node\nlet s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>require("fs").writeFileSync(process.env.CAPTURE,JSON.stringify({args:process.argv.slice(2),text:s})));\n', { mode: 0o700 });
  const old = process.env.PATH;
  process.env.PATH = `${bin}:${old}`;
  process.env.CAPTURE = path.join(tmp, 'capture.json');
  const text = '--synthetic test; Unicode: café\nsecond line';
  assert.deepEqual(await bridge.pasteText(text), { success: true });
  assert.deepEqual(JSON.parse(fs.readFileSync(process.env.CAPTURE)), { args: ['-'], text });
  fs.writeFileSync(path.join(bin, 'wtype'), '#!/bin/sh\nexit 1\n');
  assert.deepEqual(await bridge.pasteText('test'), { success: false, reason: 'paste_failed' });
  process.env.PATH = old;
});
