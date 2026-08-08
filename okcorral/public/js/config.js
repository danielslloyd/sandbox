// Single source of truth for tuning. Imported by both the server (authority) and
// the client (rendering), so the two can never disagree about what "visible" means.

export const CONFIG = {
  // Horizontal field of view, degrees. This is BOTH what the client renders and what
  // the server treats as the witness cone: if a shooter is on your screen, you see the
  // muzzle flash.
  //
  // The FOV-to-player-count ratio is the main balance knob. Note the geometry is not the
  // obvious 360/N: seen from a seat on the circle, the other seats are spaced 180/N apart
  // and the entire ring subtends only ~135 deg at N=8 (the inscribed angle theorem). So
  // at 8 players seats are 22.5 deg apart and a 20 deg view holds about one person — but
  // a player only has to sweep ~135 deg, not 360, to check on everybody. Measured in
  // test/protocol.test.mjs and by sweeping the live client.
  HFOV_DEG: 20,

  // Wider cone used only for deciding whose heading data the server sends you. The margin
  // over HFOV keeps avatars from popping in at the screen edge, and keeps a cheating
  // client from reconstructing a top-down radar of who is watching whom.
  AWARENESS_DEG: 44,

  // How close to centred a target must be to be hit.
  HIT_CONE_DEG: 3.5,

  RELOAD_MS: 2500,
  ROUND_MS: 4 * 60 * 1000,

  // How long a muzzle flash stays lit on an avatar, client-side.
  FLASH_MS: 260,

  RING_RADIUS: 9,
  EYE_HEIGHT: 1.6,

  TICK_HZ: 20, // server broadcast rate
  LOOK_HZ: 20, // client heading send rate

  // Three is the real floor: with two players the single outlaw already has parity with
  // the single townsperson, so the round would end on the tick it started. Bots count,
  // so one human plus bots is a valid ring for testing.
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 12,
};

export const DEG = Math.PI / 180;

// Wrap to (-PI, PI].
export function wrapPi(a) {
  a = (a + Math.PI) % (2 * Math.PI);
  if (a <= 0) a += 2 * Math.PI;
  return a - Math.PI;
}

// Seat `i` of `n` sits on a circle of radius R. Yaw convention throughout the project:
// a heading of theta points along (-sin theta, -cos theta), matching a three.js camera
// that looks down -Z at theta = 0.
export function seatPos(seat, n, radius = CONFIG.RING_RADIUS) {
  const a = (2 * Math.PI * seat) / n;
  return { x: radius * Math.sin(a), z: radius * Math.cos(a) };
}

// The world heading a player faces when their own zeroed heading is 0: straight at the
// centre of the ring. Seats are abstract, so this offset is arbitrary but convenient.
export function seatBaseYaw(seat, n) {
  return (2 * Math.PI * seat) / n;
}

// Heading you would need to face to look from `from` to `to`.
export function bearing(from, to) {
  return Math.atan2(-(to.x - from.x), -(to.z - from.z));
}
