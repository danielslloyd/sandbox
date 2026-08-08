// The 3D ring. Everything here exists to make one thing legible: which way each of the
// other gunfighters is looking. That is the whole game, so the head, the hat brim and the
// pale face plate all point the same way and are the highest-contrast thing on screen.

import * as THREE from 'three';
import { CONFIG, DEG, seatPos, seatBaseYaw } from './config.js';

const DUST = 0xc9a878;
const SKY_TOP = 0x2c4a6b;
const SKY_BOT = 0xe8b579;

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd9b88a, 40, 190);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);

  buildSky(scene);
  buildGround(scene);
  buildLandmarks(scene);
  buildLighting(scene);

  const avatars = new Map(); // id -> { group, head, flash, light, nameSprite, alive }
  let playerCount = 8;
  let mySeat = 0;

  // -------------------------------------------------------------------------

  function setRing(ring, seat) {
    playerCount = ring.length;
    mySeat = seat;

    for (const a of avatars.values()) scene.remove(a.group);
    avatars.clear();

    for (const p of ring) {
      if (p.seat === seat) continue;
      const a = buildAvatar(p.name, p.seat, playerCount);
      scene.add(a.group);
      avatars.set(p.id, a);
    }

    const me = seatPos(seat, playerCount);
    camera.position.set(me.x, CONFIG.EYE_HEIGHT, me.z);
  }

  // Anyone the server did not send us this tick is outside our awareness cone. Hide
  // rather than delete, so they fade back in with their last known pose instead of popping.
  function update(visible, myYaw, myPitch, now) {
    const seen = new Set();
    for (const v of visible) {
      const a = avatars.get(v.id);
      if (!a) continue;
      seen.add(v.id);
      a.group.visible = true;

      a.head.rotation.y = v.yaw;
      a.head.rotation.x = Math.max(-0.6, Math.min(0.6, v.pitch));

      if (a.alive && !v.alive) dropAvatar(a);
      a.alive = v.alive;
    }
    for (const [id, a] of avatars) if (!seen.has(id)) a.group.visible = false;

    for (const a of avatars.values()) {
      const t = a.flashUntil - now;
      const on = t > 0;
      a.flash.visible = on;
      a.light.visible = on;
      if (on) {
        const k = t / CONFIG.FLASH_MS;
        a.flash.material.opacity = k;
        a.light.intensity = k * 14;
      }
    }

    camera.rotation.order = 'YXZ';
    camera.rotation.y = seatBaseYaw(mySeat, playerCount) + myYaw;
    camera.rotation.x = myPitch;
    camera.rotation.z = 0; // horizon stays level; roll would only cause nausea and
                           // make aiming harder without adding anything

    renderer.render(scene, camera);
  }

  function flash(id, now) {
    const a = avatars.get(id);
    if (a) a.flashUntil = now + CONFIG.FLASH_MS;
  }

  function kill(id) {
    const a = avatars.get(id);
    if (a && a.alive) { dropAvatar(a); a.alive = false; }
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // CONFIG.HFOV_DEG is the authoritative horizontal cone the server uses for
    // witnessing, so we derive the vertical FOV from it rather than the other way round.
    const hfov = CONFIG.HFOV_DEG * DEG;
    const vfov = 2 * Math.atan(Math.tan(hfov / 2) / camera.aspect);
    camera.fov = Math.max(15, Math.min(80, vfov / DEG));
    camera.updateProjectionMatrix();
  }

  return { update, setRing, flash, kill, resize, scene, camera };
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

const COAT_COLORS = [0x6b4a3a, 0x4a4a52, 0x7a5a3c, 0x53433a, 0x6a5340, 0x45525a,
  0x7a4a42, 0x5c4c62, 0x6e5a48, 0x3f4a44, 0x74563e, 0x4f4038];

function buildAvatar(name, seat, n) {
  const group = new THREE.Group();
  const pos = seatPos(seat, n);
  group.position.set(pos.x, 0, pos.z);
  // The body stands still, facing the centre of the ring. Only the head turns.
  group.rotation.y = seatBaseYaw(seat, n);

  const coat = new THREE.MeshLambertMaterial({ color: COAT_COLORS[seat % COAT_COLORS.length] });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2b2320 });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc9a082 });
  const pale = new THREE.MeshLambertMaterial({ color: 0xf0dcc0 });

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.20, 0.85, 8), dark);
  legs.position.y = 0.43;
  group.add(legs);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.33, 0.75, 10), coat);
  torso.position.y = 1.19;
  group.add(torso);

  // Shoulders are wider than deep, which gives the body an unambiguous facing even in
  // silhouette against a bright sky.
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.30), coat);
  shoulders.position.y = 1.5;
  group.add(shoulders);

  const head = new THREE.Group();
  head.position.y = 1.62;
  head.rotation.order = 'YXZ';
  group.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), skin);
  head.add(skull);

  // Face plate on -Z, the direction the head "looks". This is the single most important
  // visual in the game — it is how you read where someone's attention is.
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.105, 12), pale);
  face.position.z = -0.115;
  head.add(face);

  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.025, 14), dark);
  brim.position.y = 0.11;
  head.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.15, 0.20, 12), dark);
  crown.position.y = 0.21;
  head.add(crown);

  // Muzzle flash sits in front of the chest and is parented to the head, so it appears
  // wherever the shooter was aiming.
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffd88a, transparent: true, opacity: 0 }),
  );
  flash.position.set(0.16, -0.45, -0.42);
  flash.visible = false;
  head.add(flash);

  const light = new THREE.PointLight(0xffc266, 0, 7);
  light.position.copy(flash.position);
  light.visible = false;
  head.add(light);

  const nameSprite = makeNameSprite(name);
  nameSprite.position.y = 2.25;
  group.add(nameSprite);

  return { group, head, flash, light, nameSprite, alive: true, flashUntil: 0 };
}

function dropAvatar(a) {
  a.group.rotation.x = -Math.PI / 2.2;
  a.group.position.y = 0.28;
  a.nameSprite.material.opacity = 0.35;
  a.head.rotation.set(0, 0, 0);
}

function makeNameSprite(name) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.font = 'bold 34px ui-monospace, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 6;
  g.strokeStyle = 'rgba(20,14,10,0.85)';
  g.strokeText(name, 128, 34);
  g.fillStyle = '#f3e6ce';
  g.fillText(name, 128, 34);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(1.6, 0.4, 1);
  return sprite;
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

function buildSky(scene) {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#' + SKY_TOP.toString(16).padStart(6, '0'));
  grad.addColorStop(0.62, '#c98f5e');
  grad.addColorStop(1, '#' + SKY_BOT.toString(16).padStart(6, '0'));
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 24, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }),
  );
  scene.add(sky);
}

function buildGround(scene) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(260, 48),
    new THREE.MeshLambertMaterial({ color: DUST }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // A scuffed circle in the dirt marks the ring itself, so you can tell at a glance
  // whether you are looking across the corral or off into the desert.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(CONFIG.RING_RADIUS - 0.35, CONFIG.RING_RADIUS + 0.35, 64),
    new THREE.MeshLambertMaterial({ color: 0xb08f66 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);
}

// Distinct silhouettes all the way around the horizon. These are not decoration: without
// landmarks a narrow view feels unmoored when you turn, and they give players a shared
// vocabulary for pointing ("he's over by the water tower") that the app never has to provide.
function buildLandmarks(scene) {
  const wood = new THREE.MeshLambertMaterial({ color: 0x6b5138 });
  const plank = new THREE.MeshLambertMaterial({ color: 0x8a6b4a });
  const rock = new THREE.MeshLambertMaterial({ color: 0x9a6f52 });
  const cactusMat = new THREE.MeshLambertMaterial({ color: 0x4a6b45 });

  const place = (obj, angleDeg, dist) => {
    const a = angleDeg * DEG;
    obj.position.x = Math.sin(a) * dist;
    obj.position.z = Math.cos(a) * dist;
    obj.rotation.y = a;
    scene.add(obj);
  };

  // Saloon facade
  const saloon = new THREE.Group();
  const front = new THREE.Mesh(new THREE.BoxGeometry(11, 7, 0.6), plank);
  front.position.y = 3.5;
  saloon.add(front);
  const gable = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.5, 1.2), wood);
  gable.position.y = 7.4;
  saloon.add(gable);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3, 0.9), wood);
  door.position.set(0, 1.5, 0.1);
  saloon.add(door);
  place(saloon, 0, 34);

  // Water tower
  const tower = new THREE.Group();
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4.6, 14), wood);
  tank.position.y = 12;
  tower.add(tank);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.8, 14), plank);
  cap.position.y = 15.2;
  tower.add(cap);
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 10, 6), wood);
    leg.position.set(dx, 5, dz);
    tower.add(leg);
  }
  place(tower, 72, 46);

  // Mesa
  const mesa = new THREE.Mesh(new THREE.CylinderGeometry(20, 26, 24, 7), rock);
  mesa.position.y = 12;
  place(mesa, 144, 130);

  // Butte, smaller and further, on the opposite side
  const butte = new THREE.Mesh(new THREE.CylinderGeometry(9, 14, 30, 6), rock);
  butte.position.y = 15;
  place(butte, 205, 155);

  // Windmill
  const mill = new THREE.Group();
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.6, 13, 6), wood);
  mast.position.y = 6.5;
  mill.add(mast);
  const blades = new THREE.Mesh(new THREE.CircleGeometry(2.4, 10), plank);
  blades.position.set(0, 13, 0.4);
  mill.add(blades);
  place(mill, 252, 40);

  // Wagon
  const wagon = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 2.4), wood);
  bed.position.y = 1.5;
  wagon.add(bed);
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4.6, 10, 1, true, 0, Math.PI), plank);
  canopy.rotation.z = Math.PI / 2;
  canopy.position.y = 2.4;
  wagon.add(canopy);
  place(wagon, 300, 26);

  // Cacti scattered mid-distance, for parallax while turning
  const cactusAngles = [22, 48, 96, 118, 170, 190, 228, 275, 328, 350];
  cactusAngles.forEach((ang, i) => {
    const cac = new THREE.Group();
    const h = 3 + (i % 3);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, h, 8), cactusMat);
    trunk.position.y = h / 2;
    cac.add(trunk);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, h * 0.45, 6), cactusMat);
    arm.position.set(i % 2 ? 0.6 : -0.6, h * 0.65, 0);
    cac.add(arm);
    place(cac, ang, 20 + (i % 4) * 7);
  });

  // Campfire in the middle of the ring — a shared reference point everyone can see
  // by looking straight across.
  const fire = new THREE.Group();
  const stones = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.22, 6, 14), rock);
  stones.rotation.x = Math.PI / 2;
  stones.position.y = 0.2;
  fire.add(stones);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.1, 8),
    new THREE.MeshBasicMaterial({ color: 0xe8863a }),
  );
  flame.position.y = 0.7;
  fire.add(flame);
  const firelight = new THREE.PointLight(0xff9a44, 2.2, 16);
  firelight.position.y = 1;
  fire.add(firelight);
  scene.add(fire);
}

function buildLighting(scene) {
  scene.add(new THREE.HemisphereLight(0xffd9a8, 0x6b5030, 1.5));
  const sun = new THREE.DirectionalLight(0xffe0b0, 1.4);
  sun.position.set(-30, 26, 18);
  scene.add(sun);
}
