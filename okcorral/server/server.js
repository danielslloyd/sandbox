// Static file server + websocket game host.
//
// Serves over HTTPS when certs/key.pem and certs/cert.pem exist, otherwise HTTP.
// Phone sensors require HTTPS on iOS, so for real playtests you want the certs —
// see README.md.

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

import { CONFIG } from '../public/js/config.js';
import {
  makeRoom, makePlayer, startRound, setLook, fire, tick, lobbyState, broadcast,
} from './game.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const THREE_BUILD = path.join(ROOT, 'node_modules', 'three', 'build');

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  }),
);
const PORT = Number(args.get('port') || process.env.PORT || 8443);
const BOT_COUNT = Number(args.get('bots') || 0);

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(data);
  });
}

function handleRequest(req, res) {
  const url = new URL(req.url, 'http://x');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';

  // three.js is vendored out of node_modules so playtests do not need internet access.
  if (pathname === '/vendor/three.module.js') {
    return serveFile(res, path.join(THREE_BUILD, 'three.module.js'));
  }

  const filePath = path.join(PUBLIC, pathname);
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    return res.end('forbidden');
  }
  return serveFile(res, filePath);
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const certDir = path.join(ROOT, 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');
const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);

const server = hasCerts
  ? https.createServer(
    { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
    handleRequest,
  )
  : http.createServer(handleRequest);

const wss = new WebSocketServer({ server });

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

const rooms = new Map();

function getRoom(code) {
  const key = (code || 'CORRAL').toUpperCase().slice(0, 8);
  if (!rooms.has(key)) rooms.set(key, makeRoom(key));
  return rooms.get(key);
}

function sendTo(ws) {
  return (msg) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };
}

wss.on('connection', (ws) => {
  let room = null;
  let player = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.t === 'join') {
      if (player) return;
      room = getRoom(msg.room);
      if (room.players.filter((p) => !p.bot).length >= CONFIG.MAX_PLAYERS) {
        sendTo(ws)({ t: 'error', message: 'room is full' });
        return;
      }
      if (room.phase !== 'lobby') {
        sendTo(ws)({ t: 'error', message: 'round already in progress' });
        return;
      }
      player = makePlayer({ name: String(msg.name || '').slice(0, 16), send: sendTo(ws) });
      room.players.push(player);
      if (!room.hostId || !room.players.some((p) => p.id === room.hostId && !p.bot)) {
        room.hostId = player.id;
      }
      player.send({ t: 'welcome', id: player.id, room: room.code });
      broadcast(room, lobbyState(room));
      return;
    }

    if (!room || !player) return;

    switch (msg.t) {
      case 'addBot': {
        if (player.id !== room.hostId || room.phase !== 'lobby') return;
        if (room.players.length >= CONFIG.MAX_PLAYERS) return;
        room.players.push(makePlayer({
          name: BOT_NAMES[room.players.length % BOT_NAMES.length],
          send: () => {},
          bot: true,
        }));
        broadcast(room, lobbyState(room));
        break;
      }
      case 'start': {
        if (player.id !== room.hostId || room.phase !== 'lobby') return;
        const r = startRound(room);
        if (!r.ok) player.send({ t: 'error', message: r.error });
        break;
      }
      case 'look':
        setLook(room, player, msg.yaw, msg.pitch);
        break;
      case 'fire':
        fire(room, player);
        break;
      case 'again': {
        if (player.id !== room.hostId || room.phase !== 'over') return;
        room.phase = 'lobby';
        broadcast(room, lobbyState(room));
        break;
      }
      default:
        break;
    }
  });

  ws.on('close', () => {
    if (!room || !player) return;
    room.players = room.players.filter((p) => p !== player);
    if (room.hostId === player.id) {
      const nextHost = room.players.find((p) => !p.bot);
      room.hostId = nextHost ? nextHost.id : null;
    }
    if (room.players.filter((p) => !p.bot).length === 0) {
      rooms.delete(room.code);
    } else {
      broadcast(room, lobbyState(room));
    }
  });
});

const BOT_NAMES = ['Doc', 'Ike', 'Curly', 'Ringo', 'Virgil', 'Morgan', 'Frank', 'Billy', 'Wyatt', 'Bat'];

setInterval(() => {
  for (const room of rooms.values()) tick(room);
}, 1000 / CONFIG.TICK_HZ);

if (BOT_COUNT > 0) {
  const room = getRoom('CORRAL');
  for (let i = 0; i < BOT_COUNT; i++) {
    room.players.push(makePlayer({ name: BOT_NAMES[i % BOT_NAMES.length], send: () => {}, bot: true }));
  }
}

function lanAddress() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}

server.listen(PORT, () => {
  const scheme = hasCerts ? 'https' : 'http';
  console.log(`\n  OK Corral`);
  console.log(`  local   ${scheme}://localhost:${PORT}/`);
  console.log(`  phones  ${scheme}://${lanAddress()}:${PORT}/`);
  console.log(`  sensors ${scheme}://${lanAddress()}:${PORT}/diag.html`);
  if (!hasCerts) {
    console.log('\n  No certs/ found, serving plain HTTP.');
    console.log('  iOS will refuse motion sensors without HTTPS — see README.md.');
  }
  if (BOT_COUNT > 0) console.log(`\n  ${BOT_COUNT} bots waiting in room CORRAL.`);
  console.log('');
});
