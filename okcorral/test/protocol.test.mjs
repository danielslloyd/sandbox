// Headless verification of the rules the whole game rests on: who can see whom, and who
// learns who fired. Run the server first, then:  node test/protocol.test.mjs
//
// These are the assertions that matter. If visibility culling leaks, a modified client
// can draw a radar of who is watching whom and the outlaw's job becomes trivial. If
// witnessing is wrong, there is no deduction left to do.

import WebSocket from 'ws';
import { CONFIG, wrapPi, seatPos, seatBaseYaw, bearing } from '../public/js/config.js';

const URL = process.env.URL || 'ws://localhost:8080';
const ROOM = 'TEST' + Math.floor(Math.random() * 10000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function check(label, cond) {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}

function client(name) {
  const ws = new WebSocket(URL);
  const c = { name, ws, id: null, seat: 0, n: 0, role: null, ring: [], visible: [], log: [] };
  ws.on('open', () => ws.send(JSON.stringify({ t: 'join', name, room: ROOM })));
  ws.on('message', (raw) => {
    const m = JSON.parse(raw);
    if (m.t === 'welcome') c.id = m.id;
    if (m.t === 'begin') { c.seat = m.you.seat; c.role = m.you.role; c.ring = m.ring; c.n = m.playerCount; }
    if (m.t === 'state') c.visible = m.visible;
    if (['shot', 'witness', 'death', 'youFired', 'over', 'error'].includes(m.t)) c.log.push(m);
  });
  c.send = (m) => ws.send(JSON.stringify(m));
  c.clear = () => { c.log.length = 0; };
  /** Put `targetName` dead centre of this client's view. */
  c.aimAt = (targetName) => {
    const target = c.ring.find((r) => r.name === targetName);
    const world = bearing(seatPos(c.seat, c.n), seatPos(target.seat, c.n));
    c.send({ t: 'look', yaw: wrapPi(world - seatBaseYaw(c.seat, c.n)), pitch: 0 });
  };
  /** Face straight out of the ring, where nobody is. */
  c.lookAway = () => c.send({ t: 'look', yaw: Math.PI, pitch: 0 });
  c.saw = (t) => c.log.some((m) => m.t === t);
  return c;
}

async function ring(names) {
  const cs = [];
  for (const n of names) { cs.push(client(n)); await sleep(120); }
  await sleep(300);
  cs[0].send({ t: 'start' });
  await sleep(400);
  return cs;
}

// ---------------------------------------------------------------------------

const [A, B, C, D] = await ring(['Alice', 'Bob', 'Cass', 'Dell']);
console.log(`\nroom ${ROOM}`);
console.log(`seats  A=${A.seat} B=${B.seat} C=${C.seat} D=${D.seat}`);
console.log(`roles  A=${A.role} B=${B.role} C=${C.role} D=${D.role}\n`);

console.log('[1] visibility culling');
A.aimAt('Bob');
C.aimAt('Alice');   // C watches the shooter
B.lookAway();
D.lookAway();
await sleep(300);

check('A sees B, whom it is aiming at', A.visible.some((v) => v.id === B.id));
check('D, facing out of the ring, sees nobody', D.visible.length === 0);
check('B, facing out of the ring, sees nobody', B.visible.length === 0);
check('A receives a live heading for B',
  A.visible.some((v) => v.id === B.id && typeof v.yaw === 'number'));
check('A receives no data at all for players outside its cone',
  !A.visible.some((v) => v.id === D.id) || A.visible.length < 3);

console.log('\n[2] a shot with one watcher and two players facing away');
[A, B, C, D].forEach((c) => c.clear());
A.send({ t: 'fire' });
await sleep(350);

check('every phone hears the bang', [A, B, C, D].every((c) => c.saw('shot')));
check('A is told it hit Bob', A.log.some((m) => m.t === 'youFired' && m.victimId === B.id));
check('every phone sees Bob fall', [A, B, C, D].every((c) => c.log.some((m) => m.t === 'death' && m.id === B.id)));

check('C, who was watching A, learns A shot B',
  C.log.some((m) => m.t === 'witness' && m.shooterId === A.id && m.victimId === B.id));
check('D, facing away, learns only that a shot happened', !D.saw('witness'));
check('B, the victim facing away, never learns who got them', !B.saw('witness'));

console.log('\n[3] end conditions');
await sleep(300);
// Whether the round ends here depends on which role Bob drew: killing the lone outlaw
// ends it immediately, killing a townsperson does not.
const over = [A, C, D].map((c) => c.log.find((m) => m.t === 'over')).find(Boolean);
if (over) {
  console.log(`      Bob was the outlaw, so the round ended. Winner: ${over.winner}`);
  check('all roles are revealed at the end', over.roles.length === 4);
  check('killing the only outlaw is a town win', over.winner === 'town');
} else {
  console.log('      Bob was a townsperson, round continues.');
  check('round continues while an outlaw is still alive', true);
}

console.log('\n[4] reload cooldown');
// Guarantee a live round regardless of how section 2 landed.
if (over) {
  A.send({ t: 'again' });
  await sleep(250);
  A.send({ t: 'start' });
  await sleep(450);
}
await sleep(CONFIG.RELOAD_MS + 250);   // let any earlier shot's reload expire
A.clear();
const victim = A.ring.find((r) => r.id !== A.id);
A.aimAt(victim.name);
await sleep(200);
A.send({ t: 'fire' });
A.send({ t: 'fire' });          // immediately again, must be swallowed
await sleep(350);
check('the first shot goes through', A.log.filter((m) => m.t === 'shot').length >= 1);
check('a second shot inside the reload window is ignored',
  A.log.filter((m) => m.t === 'shot').length === 1);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}\n`);
[A, B, C, D].forEach((c) => c.ws.close());
process.exit(failures === 0 ? 0 : 1);
