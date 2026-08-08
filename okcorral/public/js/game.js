// Client game loop: screens, input, and the bridge between the sensor and the ring.

import { connect } from './net.js';
import { createOrientation, requestPermission, needsPermission } from './orientation.js';
import { createScene } from './scene.js';
import { CONFIG, DEG, wrapPi, seatPos, seatBaseYaw, bearing } from './config.js';

const $ = (id) => document.getElementById(id);
const show = (id) => {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
};

const orient = createOrientation();
const S = orient.state;

let net = null;
let scene = null;
let me = { id: null, seat: 0, role: null, alive: true };
let ring = [];
let playerCount = 8;
let visible = [];
let endsAt = 0;
let canFireAt = 0;
let aliveCount = 0;
let locked = null;      // id of the player currently under the crosshair
let usingSensors = false;
let manualYaw = 0;
let manualPitch = 0;
let hostId = null;
let myName = '';

// ---------------------------------------------------------------------------
// Join / lobby
// ---------------------------------------------------------------------------

$('btnJoin').addEventListener('click', () => {
  myName = ($('name').value || '').trim() || 'stranger';
  const room = ($('room').value || 'CORRAL').trim().toUpperCase() || 'CORRAL';
  net = connect({
    onOpen: () => net.send({ t: 'join', name: myName, room }),
    onMessage: handle,
    onClose: () => note('lost the connection'),
  });
});

$('name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btnJoin').click(); });
$('room').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btnJoin').click(); });

$('btnBot').addEventListener('click', () => net.send({ t: 'addBot' }));
$('btnStart').addEventListener('click', () => net.send({ t: 'start' }));
$('btnAgain').addEventListener('click', () => net.send({ t: 'again' }));

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function handle(msg) {
  switch (msg.t) {
    case 'welcome':
      me.id = msg.id;
      show('sLobby');
      $('lobbyCode').textContent = msg.room;
      break;

    case 'lobby': {
      hostId = msg.hostId;
      show(msg.phase === 'lobby' ? 'sLobby' : 'sLobby');
      $('lobbyList').innerHTML = msg.players.map((p) => `
        <li><span>${esc(p.name)}${p.id === me.id ? ' <span class="tag">you</span>' : ''}</span>
        <span class="tag">${p.bot ? 'bot' : p.id === msg.hostId ? 'host' : ''}</span></li>`).join('');
      const isHost = msg.hostId === me.id;
      $('hostBtns').hidden = !isHost;
      $('lobbyHint').textContent = isHost
        ? 'You are the host. Start when everyone is in.'
        : 'Waiting for the host to call it.';
      break;
    }

    case 'begin':
      startRound(msg);
      break;

    case 'state':
      visible = msg.visible;
      endsAt = msg.endsAt;
      aliveCount = msg.aliveCount;
      canFireAt = msg.you.canFireAt;
      if (me.alive && !msg.you.alive) died();
      me.alive = msg.you.alive;
      break;

    case 'shot':
      bang();
      break;

    // Only sent to players who had the shooter on screen. This is the entire information
    // economy of the game in one message.
    case 'witness': {
      if (scene) scene.flash(msg.shooterId, performance.now());
      const shooter = nameOf(msg.shooterId);
      note(msg.victimId
        ? `${shooter} shot ${nameOf(msg.victimId)}`
        : `${shooter} fired and missed`, true);
      break;
    }

    case 'youFired':
      note(msg.victimId ? `you got ${nameOf(msg.victimId)}` : 'you missed', !!msg.victimId);
      break;

    case 'death':
      if (scene) scene.kill(msg.id);
      if (msg.id !== me.id) note(`${nameOf(msg.id)} fell`);
      break;

    case 'over':
      roundOver(msg);
      break;

    case 'error':
      note(msg.message);
      break;

    default:
      break;
  }
}

function nameOf(id) {
  const p = ring.find((r) => r.id === id);
  return p ? p.name : 'someone';
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------------------------------------------------------------------------
// Round
// ---------------------------------------------------------------------------

function startRound(msg) {
  me = { id: msg.you.id, seat: msg.you.seat, role: msg.you.role, alive: true };
  ring = msg.ring;
  playerCount = msg.playerCount;
  endsAt = msg.endsAt;
  visible = [];

  show('sGame');
  if (!scene) {
    scene = createScene($('view'));
    window.addEventListener('resize', () => scene.resize());
  }
  scene.setRing(ring, me.seat);
  scene.resize();

  $('hRole').textContent = msg.you.role === 'outlaw' ? 'OUTLAW' : 'TOWN';
  $('hRole').style.color = msg.you.role === 'outlaw' ? 'var(--blood)' : 'var(--good)';
  $('ghost').classList.remove('on');
  $('fire').classList.remove('dead');
  $('log').innerHTML = '';

  const card = $('roleCard');
  card.hidden = false;
  card.className = msg.you.role;
  $('roleName').textContent = msg.you.role === 'outlaw' ? 'OUTLAW' : 'TOWNSFOLK';
  const partners = (msg.you.partners || []).map((p) => p.name);
  $('roleDesc').innerHTML = msg.you.role === 'outlaw'
    ? `Kill the townsfolk before the clock runs out. Fire when no one has you on screen.${
      partners.length ? `<br><br>Riding with you: <b>${esc(partners.join(', '))}</b>.` : ''}`
    : 'Find the outlaws and shoot them. Watch each other — an outlaw will not fire while '
      + 'someone is looking. Shoot an innocent and you have done their work for them.';
}

// The role card doubles as the calibration ritual: the tap that dismisses it is also the
// user gesture iOS demands before it will release the motion sensors, and it zeroes your
// heading. Whatever you happen to be pointing at becomes "straight ahead" — which is fine,
// because seats are abstract and nobody else's frame has to agree with yours.
$('btnReady').addEventListener('click', async () => {
  const res = needsPermission() ? await requestPermission() : 'granted';
  if (res === 'granted') {
    orient.start();
    setTimeout(() => {
      usingSensors = S.receiving;
      orient.zero();
      if (!usingSensors) note('no motion sensors — drag to look');
    }, 350);
  } else {
    note('motion denied — drag to look');
  }
  $('roleCard').hidden = true;
});

function died() {
  $('ghost').classList.add('on');
  $('fire').classList.add('dead');
  const h = $('hurt');
  h.style.transition = 'none';
  h.style.opacity = '1';
  requestAnimationFrame(() => {
    h.style.transition = 'opacity 2.4s ease-out';
    h.style.opacity = '0';
  });
  note('you are dead');
}

function roundOver(msg) {
  show('sOver');
  const won = (msg.winner === 'outlaws') === (me.role === 'outlaw');
  $('overWinner').textContent = msg.winner === 'outlaws' ? 'The outlaws took it.' : 'The town held.';
  $('overSub').textContent = won ? 'You were on the winning side.' : 'You were not.';
  $('overList').innerHTML = msg.roles.map((p) => `
    <li class="${p.role}${p.alive ? '' : ' dead'}">
      <span>${esc(p.name)}</span>
      <span class="tag">${p.role}${p.alive ? '' : ' · dead'}</span>
    </li>`).join('');
  $('btnAgain').disabled = hostId !== me.id;
  $('btnAgain').textContent = hostId === me.id ? 'Back to the lobby' : 'Waiting for the host';
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

function note(text, hit = false) {
  const d = document.createElement('div');
  if (hit) d.className = 'hit';
  d.textContent = text;
  $('log').appendChild(d);
  setTimeout(() => d.remove(), 5600);
}

let audio = null;
function bang() {
  // Every phone plays this at the same instant, so the real room leaks no direction —
  // the only directional information in the game comes through the screen.
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    const n = audio.createBufferSource();
    const len = Math.floor(audio.sampleRate * 0.28);
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    n.buffer = buf;
    const lp = audio.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2200, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.26);
    const g = audio.createGain();
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    n.connect(lp).connect(g).connect(audio.destination);
    n.start(t);
  } catch { /* audio is a nicety, never a blocker */ }

  if (navigator.vibrate) navigator.vibrate(35);

  const f = $('flashOverlay');
  f.style.transition = 'none';
  f.style.opacity = '0.16';
  requestAnimationFrame(() => {
    f.style.transition = 'opacity 220ms ease-out';
    f.style.opacity = '0';
  });
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

function tryFire() {
  if (!net || !me.alive) return;
  if (Date.now() < canFireAt) return;
  net.send({ t: 'fire' });
}

$('fire').addEventListener('pointerdown', (e) => { e.preventDefault(); tryFire(); });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && $('sGame').classList.contains('on')) { e.preventDefault(); tryFire(); }
});

// Desktop / no-sensor fallback: drag to look. Keeps the whole game testable in a browser
// against bots before any phone is involved.
let dragging = false;
let lastX = 0;
let lastY = 0;
$('view').addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging || usingSensors) return;
  manualYaw = wrapPi(manualYaw + (e.clientX - lastX) * 0.004);
  manualPitch = Math.max(-0.9, Math.min(0.9, manualPitch - (e.clientY - lastY) * 0.004));
  lastX = e.clientX;
  lastY = e.clientY;
});

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

function myYaw() { return usingSensors ? S.yaw : manualYaw; }
function myPitch() { return usingSensors ? S.pitch : manualPitch; }

// Reporting your heading is kept off the render loop on purpose. requestAnimationFrame
// stops when the page is backgrounded — a phone that locks or gets switched away from
// would silently stop telling the server where it is looking, and the game would think
// you were still staring wherever you left off.
function inputTick() {
  if (!$('sGame').classList.contains('on')) return;
  if (!usingSensors && S.receiving) { usingSensors = true; orient.zero(); }

  const yaw = myYaw();
  if (net) net.send({ t: 'look', yaw, pitch: myPitch() });
  updateLock(yaw);
  updateHud();
}
setInterval(inputTick, 1000 / CONFIG.LOOK_HZ);

function frame(t) {
  requestAnimationFrame(frame);
  if (!scene || !$('sGame').classList.contains('on')) return;
  scene.update(visible, myYaw(), myPitch(), t);
}
requestAnimationFrame(frame);

// Highlight the crosshair when a living player is inside the hit cone. This reveals
// nothing you cannot already see — they are on your screen — and without it, aiming at a
// 20 degree field of view is guesswork.
function updateLock(yaw) {
  const worldYaw = seatBaseYaw(me.seat, playerCount) + yaw;
  const from = seatPos(me.seat, playerCount);
  locked = null;
  let best = CONFIG.HIT_CONE_DEG * DEG;
  for (const v of visible) {
    if (!v.alive) continue;
    const d = Math.abs(wrapPi(bearing(from, seatPos(v.seat, playerCount)) - worldYaw));
    if (d < best) { best = d; locked = v.id; }
  }
  $('cross').classList.toggle('locked', locked !== null && me.alive);
}

function updateHud() {
  const now = Date.now();
  const left = Math.max(0, endsAt - now);
  $('hClock').textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
  $('hAlive').textContent = aliveCount || '—';

  const cool = canFireAt - now;
  const btn = $('fire');
  if (!me.alive) {
    $('reloadBar').style.width = '0%';
  } else if (cool > 0) {
    btn.classList.add('reloading');
    btn.textContent = '···';
    $('reloadBar').style.width = `${(1 - cool / CONFIG.RELOAD_MS) * 100}%`;
  } else {
    btn.classList.remove('reloading');
    btn.textContent = 'FIRE';
    $('reloadBar').style.width = '100%';
  }
}
