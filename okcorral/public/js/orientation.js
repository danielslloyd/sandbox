// Device orientation, expressed as a camera quaternion plus a zeroed yaw/pitch.
//
// Two things here are easy to get wrong in ways that fail silently, so they are done
// deliberately:
//
// 1. We never use alpha/beta/gamma directly. Those Euler angles hit gimbal lock exactly
//    where this game lives — a phone held upright, pointing at the horizon, sits at
//    beta ~ 90. We convert to a quaternion first, then read the camera's forward vector.
//
// 2. We listen to plain `deviceorientation`, not `deviceorientationabsolute`. Seats in
//    this game are abstract, so no phone needs to agree with any other about where real
//    north is — each only needs its own rotation to be self-consistent. That lets us skip
//    the magnetometer entirely, which is the noisiest sensor indoors.

const HALF = 0.5;

function quatFromEulerYXZ(x, y, z) {
  // three.js 'YXZ' order, matching DeviceOrientationControls.
  const c1 = Math.cos(x * HALF), s1 = Math.sin(x * HALF);
  const c2 = Math.cos(y * HALF), s2 = Math.sin(y * HALF);
  const c3 = Math.cos(z * HALF), s3 = Math.sin(z * HALF);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 - s1 * s2 * c3,
    w: c1 * c2 * c3 + s1 * s2 * s3,
  };
}

function quatMul(a, b) {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y + a.y * b.w + a.z * b.x - a.x * b.z,
    z: a.w * b.z + a.z * b.w + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

function quatFromAxisAngle(ax, ay, az, angle) {
  const s = Math.sin(angle * HALF);
  return { x: ax * s, y: ay * s, z: az * s, w: Math.cos(angle * HALF) };
}

function applyQuat(q, v) {
  // t = 2 * cross(q.xyz, v); v' = v + q.w * t + cross(q.xyz, t)
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + q.y * tz - q.z * ty,
    y: v.y + q.w * ty + q.z * tx - q.x * tz,
    z: v.z + q.w * tz + q.x * ty - q.y * tx,
  };
}

// -PI/2 about X, so the camera looks out the back of the phone rather than out the top.
const Q_SCREEN_TO_CAMERA = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };

export function wrapPi(a) {
  a = (a + Math.PI) % (2 * Math.PI);
  if (a <= 0) a += 2 * Math.PI;
  return a - Math.PI;
}

function screenAngleRad() {
  const deg = (screen.orientation && screen.orientation.angle)
    || window.orientation
    || 0;
  return (deg * Math.PI) / 180;
}

export function isSupported() {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

export function needsPermission() {
  return typeof DeviceOrientationEvent !== 'undefined'
    && typeof DeviceOrientationEvent.requestPermission === 'function';
}

// iOS requires this to be called from inside a real user gesture, over HTTPS.
export async function requestPermission() {
  if (!needsPermission()) return 'granted';
  try {
    return await DeviceOrientationEvent.requestPermission();
  } catch {
    return 'denied';
  }
}

export function createOrientation() {
  const state = {
    supported: isSupported(),
    receiving: false,
    /** Raw event angles, for diagnostics only. */
    raw: { alpha: 0, beta: 0, gamma: 0 },
    /** Camera-space quaternion, feed straight into a three.js camera. */
    quat: { x: 0, y: 0, z: 0, w: 1 },
    /** Heading and elevation before zeroing, radians. */
    rawYaw: 0,
    pitch: 0,
    /** Heading after subtracting the zero offset. This is what the game uses. */
    yaw: 0,
    yawOffset: 0,
    /** Rolling estimate of event rate, Hz. */
    hz: 0,
    lastEventAt: 0,
    samples: 0,
  };

  let hzAccum = 0;
  let hzCount = 0;

  function onEvent(e) {
    if (e.alpha === null && e.beta === null && e.gamma === null) return;

    const now = performance.now();
    if (state.lastEventAt) {
      hzAccum += now - state.lastEventAt;
      hzCount++;
      if (hzCount >= 10) {
        state.hz = 1000 / (hzAccum / hzCount);
        hzAccum = 0;
        hzCount = 0;
      }
    }
    state.lastEventAt = now;
    state.receiving = true;
    state.samples++;

    const alpha = ((e.alpha || 0) * Math.PI) / 180;
    const beta = ((e.beta || 0) * Math.PI) / 180;
    const gamma = ((e.gamma || 0) * Math.PI) / 180;
    state.raw = { alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 };

    let q = quatFromEulerYXZ(beta, alpha, -gamma);
    q = quatMul(q, Q_SCREEN_TO_CAMERA);
    q = quatMul(q, quatFromAxisAngle(0, 0, 1, -screenAngleRad()));
    state.quat = q;

    // A camera with identity rotation looks along -Z, so its forward vector after
    // rotation gives both heading and elevation without touching Euler angles again.
    const f = applyQuat(q, { x: 0, y: 0, z: -1 });
    state.rawYaw = Math.atan2(-f.x, -f.z);
    state.pitch = Math.asin(Math.max(-1, Math.min(1, f.y)));
    state.yaw = wrapPi(state.rawYaw - state.yawOffset);
  }

  return {
    state,
    start() {
      window.addEventListener('deviceorientation', onEvent, true);
    },
    stop() {
      window.removeEventListener('deviceorientation', onEvent, true);
    },
    /** Treat the current heading as straight ahead. */
    zero() {
      state.yawOffset = state.rawYaw;
      state.yaw = 0;
    },
    /** Manual heading override, for desktop testing with no sensors. */
    setYaw(y) {
      state.rawYaw = y;
      state.yaw = wrapPi(y - state.yawOffset);
    },
    setPitch(p) {
      state.pitch = p;
    },
  };
}

export const _math = { quatFromEulerYXZ, quatMul, quatFromAxisAngle, applyQuat };
