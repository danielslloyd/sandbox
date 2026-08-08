// Authoritative game state. Knows nothing about sockets — server.js supplies a `send`
// function per player and drives the tick.

import {
  CONFIG, DEG, wrapPi, seatPos, seatBaseYaw, bearing,
} from '../public/js/config.js';

let nextId = 1;

export function makePlayer({ name, send, bot = false }) {
  return {
    id: 'p' + nextId++,
    name: name || 'stranger',
    send,                 // (msg) => void ; no-op for bots
    bot,
    seat: -1,
    yaw: 0,               // player's own zeroed heading, radians
    pitch: 0,
    role: null,           // 'town' | 'outlaw'
    alive: true,
    lastFireAt: -Infinity,
    // Bot sweep parameters, unused for humans.
    sweepPhase: Math.random() * Math.PI * 2,
    sweepSpeed: 0.25 + Math.random() * 0.45,
    sweepWidth: 0.9 + Math.random() * 1.6,
  };
}

export function makeRoom(code) {
  return {
    code,
    players: [],
    hostId: null,
    phase: 'lobby',       // 'lobby' | 'playing' | 'over'
    startedAt: 0,
    endsAt: 0,
    result: null,
  };
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

// A player's heading in world space: their seat's base orientation plus how far they
// have physically turned since zeroing.
function worldYaw(p, n) {
  return seatBaseYaw(p.seat, n) + p.yaw;
}

// Angular offset of `target` from the centre of `viewer`'s view. Zero means dead centre.
function offAxis(viewer, target, n) {
  const from = seatPos(viewer.seat, n);
  const to = seatPos(target.seat, n);
  return Math.abs(wrapPi(bearing(from, to) - worldYaw(viewer, n)));
}

function canSee(viewer, target, n, halfConeRad) {
  if (viewer === target) return false;
  return offAxis(viewer, target, n) <= halfConeRad;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function startRound(room) {
  const n = room.players.length;
  if (n < CONFIG.MIN_PLAYERS) return { ok: false, error: `need at least ${CONFIG.MIN_PLAYERS} players` };

  // Shuffle seats so the ring order does not leak join order.
  const seats = [...Array(n).keys()];
  for (let i = seats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seats[i], seats[j]] = [seats[j], seats[i]];
  }

  const outlawCount = Math.max(1, Math.floor(n / 4));
  const roles = room.players.map((_, i) => (i < outlawCount ? 'outlaw' : 'town'));
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  room.players.forEach((p, i) => {
    p.seat = seats[i];
    p.role = roles[i];
    p.alive = true;
    p.yaw = 0;
    p.pitch = 0;
    p.lastFireAt = -Infinity;
  });

  room.phase = 'playing';
  room.startedAt = Date.now();
  room.endsAt = room.startedAt + CONFIG.ROUND_MS;
  room.result = null;

  for (const p of room.players) {
    // Outlaws know each other. Without this they shoot their own partners and the
    // conspiracy half of the game never gets off the ground.
    const partners = p.role === 'outlaw'
      ? room.players.filter((q) => q.role === 'outlaw' && q !== p).map((q) => ({ id: q.id, name: q.name }))
      : [];
    p.send({
      t: 'begin',
      you: { id: p.id, seat: p.seat, role: p.role, partners },
      playerCount: n,
      endsAt: room.endsAt,
      config: CONFIG,
      // Names and seats are public — you can see who is in the ring and where.
      ring: room.players.map((q) => ({ id: q.id, name: q.name, seat: q.seat })),
    });
  }
  return { ok: true };
}

export function setLook(room, player, yaw, pitch) {
  if (room.phase !== 'playing' || !player.alive) return;
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) return;
  player.yaw = wrapPi(yaw);
  player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

// ---------------------------------------------------------------------------
// Firing
// ---------------------------------------------------------------------------

export function fire(room, shooter) {
  const now = Date.now();
  if (room.phase !== 'playing' || !shooter.alive) return;
  if (now - shooter.lastFireAt < CONFIG.RELOAD_MS) return;
  shooter.lastFireAt = now;

  const n = room.players.length;
  const alive = room.players.filter((p) => p.alive && p !== shooter);

  // Nearest living player to the centre of the shooter's view, within the hit cone.
  let victim = null;
  let best = CONFIG.HIT_CONE_DEG * DEG;
  for (const p of alive) {
    const d = offAxis(shooter, p, n);
    if (d < best) { best = d; victim = p; }
  }

  // Everyone hears the bang, on every phone at once, so the real room leaks no direction.
  // A miss is just as loud as a hit — which makes deliberately missing a usable bluff.
  broadcast(room, { t: 'shot', at: now });

  // You learn who fired only by looking at them. The victim is no exception: if they
  // were facing elsewhere, they never find out who got them.
  const witnessCone = (CONFIG.HFOV_DEG / 2) * DEG;
  for (const p of room.players) {
    if (p === shooter || p.bot) continue;
    if (!p.alive) continue;
    if (canSee(p, shooter, n, witnessCone)) {
      p.send({ t: 'witness', shooterId: shooter.id, victimId: victim ? victim.id : null, at: now });
    }
  }
  if (!shooter.bot) {
    shooter.send({ t: 'youFired', victimId: victim ? victim.id : null, at: now });
  }

  if (victim) {
    victim.alive = false;
    broadcast(room, { t: 'death', id: victim.id, at: now });
  }
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

export function tick(room) {
  if (room.phase !== 'playing') return;
  const n = room.players.length;
  const now = Date.now();

  updateBots(room, now);

  const awareness = (CONFIG.AWARENESS_DEG / 2) * DEG;

  for (const viewer of room.players) {
    if (viewer.bot) continue;

    // Dead players become ghosts: they keep watching, and they see everything. Nothing
    // they learn can reach the living except by talking, which is the point.
    const omniscient = !viewer.alive;

    const visible = [];
    for (const p of room.players) {
      if (p === viewer) continue;
      const inView = omniscient || canSee(viewer, p, n, awareness);
      if (!inView) continue;
      visible.push({
        id: p.id,
        seat: p.seat,
        yaw: p.yaw,      // drives which way their avatar's head is turned
        pitch: p.pitch,
        alive: p.alive,
      });
    }

    viewer.send({
      t: 'state',
      now,
      endsAt: room.endsAt,
      you: {
        alive: viewer.alive,
        canFireAt: viewer.lastFireAt + CONFIG.RELOAD_MS,
      },
      aliveCount: room.players.filter((p) => p.alive).length,
      visible,
    });
  }

  checkEnd(room, now);
}

function checkEnd(room, now) {
  const alive = room.players.filter((p) => p.alive);
  const outlaws = alive.filter((p) => p.role === 'outlaw').length;
  const town = alive.length - outlaws;

  let winner = null;
  if (outlaws === 0) winner = 'town';
  else if (outlaws >= town) winner = 'outlaws';
  else if (now >= room.endsAt) winner = 'town'; // surviving the clock is a town win —
                                                // this is what forces the outlaws to act

  if (!winner) return;
  room.phase = 'over';
  room.result = winner;
  broadcast(room, {
    t: 'over',
    winner,
    roles: room.players.map((p) => ({ id: p.id, name: p.name, role: p.role, alive: p.alive })),
  });
}

// Bots sweep their heading back and forth so the ring has something to watch and be
// watched by while there are not eight humans in the room. They do not shoot.
function updateBots(room, now) {
  const t = (now - room.startedAt) / 1000;
  for (const p of room.players) {
    if (!p.bot || !p.alive) continue;
    p.yaw = Math.sin(t * p.sweepSpeed + p.sweepPhase) * p.sweepWidth;
    p.pitch = Math.sin(t * p.sweepSpeed * 0.4 + p.sweepPhase) * 0.08;
  }
}

export function broadcast(room, msg) {
  for (const p of room.players) if (!p.bot) p.send(msg);
}

export function lobbyState(room) {
  return {
    t: 'lobby',
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: room.players.map((p) => ({ id: p.id, name: p.name, bot: p.bot })),
  };
}
