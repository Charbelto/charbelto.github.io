import * as THREE from 'three';
import { buildEngine, makeMaterials, glowMaterial, SIGNAL } from './machine.js';
import { buildGallery } from './artifacts.js';
import { KF, GALLERY_Y } from './keyframes.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/** Studio HDR built procedurally (no external files): dark hall + softboxes. */
function buildEnvironment(renderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(40, 28, 40),
    new THREE.MeshBasicMaterial({ color: 0x050508, side: THREE.BackSide }),
  );
  s.add(room);
  const panel = (w, h, pos, color, k, look = [0, 0, 0]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(...look);
    s.add(m);
  };
  panel(16, 10, [3, 13, 4], '#fff1e0', 7); // overhead key
  panel(3, 22, [-17, 2, 2], '#b9cfee', 3.2); // cool strip left (kept desaturated: pure blue read as plastic)
  panel(3, 22, [17, 0, 6], '#ff8a4a', 5); // warm strip right
  panel(26, 3, [0, 3, -19], '#ffffff', 3); // back rim
  panel(30, 30, [0, -13.5, 0], '#2a2018', 0.5); // warm floor bounce
  panel(5, 5, [-6, -4, 16], '#7fb0ff', 1.6); // front fill
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.02).texture;
  pm.dispose();
  s.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  return tex;
}

export function createWorld(canvas, { quality = 'high', reducedMotion = false, governor = true } = {}) {
  const Q = {
    high: { dpr: 1.75, ticks: 240, torus: 280, shards: 1700, antialias: true },
    mid: { dpr: 1.25, ticks: 180, torus: 200, shards: 900, antialias: true },
    low: { dpr: 1, ticks: 120, torus: 140, shards: 420, antialias: false },
  }[quality];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.antialias, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080b, 0.017);
  scene.environment = buildEnvironment(renderer);
  scene.environmentIntensity = 0.95;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);

  /* lights */
  const key = new THREE.DirectionalLight('#ffe6cf', 2.4);
  key.position.set(6, 9, 8);
  const rim = new THREE.DirectionalLight('#7fb6ff', 2.2);
  rim.position.set(-9, 2, -8);
  const coreLight = new THREE.PointLight(SIGNAL, 60, 16, 2);
  const cursorLight = new THREE.PointLight('#ffd2a8', 14, 14, 2);
  scene.add(key, rim, coreLight, cursorLight);

  const mats = makeMaterials();
  const engine = buildEngine(mats, Q);
  const holder = new THREE.Group(); // machine centering / orientation
  holder.add(engine.root);
  scene.add(holder);

  const gallery = buildGallery(mats, quality);
  gallery.group.position.y = 0;
  scene.add(gallery.group);
  // four lights total: the point "core" light is re-homed to hover over whichever artifact is framed

  // core flare: a camera-facing glow + faint anamorphic streak at the core (depth-tested, so rings occlude it)
  const flareU = { uGain: { value: 1 }, uColor: { value: SIGNAL.clone() } };
  const flare = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    glowMaterial(
      `vec2 q = (vUv - 0.5) * 2.0; float r = length(q);
       float core = pow(max(0.0, 1.0 - r), 3.2);
       float streak = exp(-abs(q.y) * 22.0) * exp(-abs(q.x) * 2.6);
       c = (uColor * core * 0.55 + vec3(1.0, 0.8, 0.6) * streak * 0.22) * uGain;`,
      flareU,
    ),
  );
  flare.renderOrder = 5;
  flare.frustumCulled = false;
  scene.add(flare);

  /* ───── director ───── */
  const keys = Object.keys(KF.hero).filter((k) => typeof KF.hero[k] === 'number');
  const cur = { ...KF.hero };
  const tgt = { ...KF.hero };
  let marks = []; // [{name, center}]
  let scrollY = 0;
  let intro = 0; // 0 exploded/far → 1 assembled
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, vx: 0 };
  let impulse = 0;
  let kickAmt = 0; // extra ring-spin energy from UI events (archive filters / row hovers)
  let visible = true;
  let last = performance.now();
  let raf = 0;
  let spinPhase = engine.rings.map(() => 0);
  const lookAt = new THREE.Vector3();
  const camPos = new THREE.Vector3();

  function measure() {
    marks = [...document.querySelectorAll('[data-kf]')]
      .filter((el) => KF[el.dataset.kf])
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { name: el.dataset.kf, center: r.top + window.scrollY + r.height / 2 };
      })
      .sort((a, b) => a.center - b.center);
  }

  function solveTarget() {
    if (!marks.length) return;
    const m = scrollY + window.innerHeight * 0.5;
    let i = 0;
    while (i < marks.length - 1 && marks[i + 1].center <= m) i++;
    const a = marks[i];
    const b = marks[Math.min(i + 1, marks.length - 1)];
    let t = b === a ? 0 : clamp((m - a.center) / (b.center - a.center), 0, 1);
    t = reducedMotion ? (t > 0.5 ? 1 : 0) : smooth(clamp((t - 0.12) / 0.76, 0, 1));
    const A = KF[a.name];
    const B = KF[b.name];
    for (const k of keys) tgt[k] = lerp(A[k], B[k], t);
  }

  let lastW = 0; let lastH = 0;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    // mobile address-bar show/hide fires height-only resizes: don't reallocate the drawing buffer for those
    const heightOnly = lastW === w && lastH && Math.abs(h - lastH) / lastH < 0.2 && matchMedia('(pointer: coarse)').matches;
    if (heightOnly) { measure(); return; }
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measure();
  }

  function onScroll() { scrollY = window.scrollY; }
  function onPointer(e) {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  /* ───── frame ───── */
  const sph = new THREE.Vector3();
  const right = new THREE.Vector3();
  const upv = new THREE.Vector3(0, 1, 0);
  const cursorWorld = new THREE.Vector3();
  const dir = new THREE.Vector3();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;

    solveTarget();
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.2);
    for (const key of keys) cur[key] = lerp(cur[key], tgt[key], key === 'fov' ? Math.min(1, k * 1.2) : k);

    pointer.x = lerp(pointer.x, pointer.tx, 1 - Math.exp(-dt * 4));
    pointer.y = lerp(pointer.y, pointer.ty, 1 - Math.exp(-dt * 4));
    const pv = (pointer.tx - pointer.x);
    impulse = lerp(impulse, clamp(Math.abs(pv) * 5, 0, 6), 1 - Math.exp(-dt * 6));

    kickAmt *= Math.exp(-dt * 2.2);
    const ie = smooth(intro);
    const aspect = camera.aspect;
    const portrait = clamp((aspect - 0.62) / 0.95, 0, 1); // 0 phone … 1 desktop
    const fitD = aspect < 1.25 ? lerp(1.8, 1, portrait) : 1;

    /* machine state */
    const flat = Math.max(cur.flat, 1 - ie);
    const explode = Math.max(cur.explode, (1 - ie) * 1.1);
    const vert = cur.vert;
    engine.rings.forEach((r, i) => {
      const axis = r.cfg.axis;
      const osc = Math.sin(time * 0.23 + i * 1.7) * 0.07 + pointer.x * 0.04 * (i % 2 ? 1 : -1);
      r.pivot.rotation[axis] = lerp(r.cfg.tilt + osc, 0, flat);
      r.pivot.position.z = explode * (i === 0 ? 0 : 1.5);
      if (!reducedMotion) spinPhase[i] += dt * r.cfg.spin * (1 + (impulse + kickAmt) * 2.2) * (0.35 + 0.65 * ie);
      r.spinner.rotation.z = spinPhase[i];
      const em = clamp(1 - Math.abs(i - cur.focus), 0, 1);
      r.pulse.uTime.value = time;
      r.pulse.uFocus.value = em;
      r.pulse.uGain.value = lerp(0.35, 1, ie) * (cur.focus < 0 ? 1 : 0.55 + 0.45 * em);
      if (r.scanner) {
        r.scanner.mesh.position.z = Math.sin(time * 1.1) * r.scanner.travel;
        r.scanner.U.uGain.value = lerp(0.22, 0.85, em) * lerp(0.3, 1, ie);
      }
    });
    engine.coreU.uTime.value = time;
    engine.discU.uTime.value = time;
    const coreGain = cur.core * lerp(0.2, 1, ie);
    engine.coreU.uGain.value = coreGain * 0.9;
    engine.discU.uGain.value = coreGain;
    engine.core.rotation.z = time * 0.22;
    engine.shardGroup.rotation.y = time * 0.018;
    engine.shardGroup.scale.setScalar(cur.shards * lerp(1.6, 1, ie));

    engine.root.rotation.x = lerp(0.0, -Math.PI / 2, vert);
    holder.rotation.y = cur.yaw + pointer.x * 0.1;
    holder.rotation.x = -pointer.y * 0.05;
    holder.position.y = -explode * 3.0 * vert;
    const inGallery = cur.cy < -20;
    gallery.group.visible = cur.cy < -10 || tgt.cy < -10;
    holder.visible = !(inGallery && Math.abs(cur.cy - GALLERY_Y) < 6);
    gallery.update(time, pointer, dt);

    /* camera */
    const az = cur.az + pointer.x * 0.05;
    const el = cur.el + pointer.y * 0.03;
    const d = cur.d * fitD * lerp(cur.pd, 1, portrait) * lerp(1.7, 1, ie);
    sph.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d);
    const vh = Math.tan((cur.fov * Math.PI) / 360) * d;
    right.set(Math.cos(az), 0, -Math.sin(az));
    const shift = cur.sx * vh * aspect * portrait * ie;
    // portrait: lift the subject into the upper half, above the bottom-anchored text panel
    const lift = (1 - portrait) * 0.46 * vh * (cur.dim > 0.4 ? 0 : 1);
    lookAt.set(cur.cx, cur.cy - lift, cur.cz).addScaledVector(right, -shift);
    camPos.set(cur.cx, cur.cy - lift, cur.cz).add(sph).addScaledVector(right, -shift);
    camera.position.copy(camPos);
    camera.lookAt(lookAt);
    camera.fov = cur.fov;
    camera.updateProjectionMatrix();

    // core light: rides the core (also when exploded); in the gallery it hovers above-and-toward-camera of the framed artifact
    const gal = clamp((-cur.cy - 8) / 30, 0, 1);
    engine.core.getWorldPosition(sph);
    dir.copy(camPos).sub(lookAt).normalize();
    coreLight.position.set(
      lerp(sph.x, lookAt.x + dir.x * 3 + right.x * 1.5, gal),
      lerp(sph.y, lookAt.y + 3.4, gal),
      lerp(sph.z, lookAt.z + dir.z * 3 + right.z * 1.5, gal),
    );
    coreLight.intensity = lerp(40 + 60 * cur.core, 85, gal);

    flare.visible = gal < 0.5 && holder.visible;
    if (flare.visible) {
      engine.core.getWorldPosition(flare.position);
      flare.quaternion.copy(camera.quaternion);
      const fd = flare.position.distanceTo(camPos);
      flare.scale.setScalar(clamp(fd * 0.42, 3, 9) * (0.8 + 0.3 * cur.core));
      flareU.uGain.value = cur.core * lerp(0.2, 1, ie) * 0.55;
    }

    // cursor light: swept across the machine in camera space
    dir.copy(lookAt).sub(camPos).normalize();
    cursorWorld.copy(camPos).addScaledVector(dir, d * 0.55).addScaledVector(right, pointer.x * vh * aspect * 0.8).addScaledVector(upv, pointer.y * vh * 0.8);
    cursorLight.position.copy(cursorWorld);
    cursorLight.intensity = (inGallery ? 10 : 18) * (0.5 + 0.5 * ie);

    key.position.set(6, 9, 8).applyAxisAngle(upv, az * 0.6);
    document.documentElement.style.setProperty('--dim', cur.dim.toFixed(3));

    renderer.render(scene, camera);
    if (governor && ie >= 1) adapt(dt);
  }

  /* ───── adaptive resolution governor ─────
     Measures the average frame time over ~60 frames. Sustained slow frames lower the pixel ratio
     (down to a floor); sustained fast frames raise it again (up to the tier's cap). Hysteresis
     (two consecutive verdicts) prevents flapping. Disabled with ?gov=0 and in QA captures. */
  const prCap = Math.min(window.devicePixelRatio || 1, Q.dpr);
  const prFloor = Math.min(prCap, 0.75);
  let pr = prCap;
  let accT = 0; let accN = 0; let verdict = 0;
  const stats = { pr, avgMs: 0, steps: 0 };
  function applyPR(v) {
    pr = v; stats.pr = +v.toFixed(3);
    renderer.setPixelRatio(pr);
    renderer.setSize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight, false);
  }
  function adapt(dt) {
    accT += dt; accN++;
    if (accN < 60) return;
    const avg = accT / accN; accT = 0; accN = 0;
    stats.avgMs = +(avg * 1000).toFixed(1);
    const v = avg > 0.0245 ? -1 : avg < 0.0125 ? 1 : 0;
    verdict = v === Math.sign(verdict) || verdict === 0 ? verdict + v : v;
    if (verdict <= -2 && pr > prFloor) { applyPR(Math.max(prFloor, pr * 0.86)); stats.steps++; verdict = 0; }
    else if (verdict >= 3 && pr < prCap) { applyPR(Math.min(prCap, pr * 1.1)); stats.steps++; verdict = 0; }
  }

  /* ───── public ───── */
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  if (!reducedMotion && quality !== 'low') window.addEventListener('pointermove', onPointer, { passive: true });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  scrollY = window.scrollY;
  resize();
  solveTarget();
  Object.assign(cur, tgt);

  return {
    renderer, scene, camera, engine, gallery, stats,
    start() { last = performance.now(); raf = requestAnimationFrame(frame); },
    setIntro(v) { intro = v; },
    kick(v = 3) { if (!reducedMotion) kickAmt = Math.min(8, kickAmt + v); },
    get intro() { return intro; },
    remeasure: measure,
    compile: () => renderer.compileAsync(scene, camera),
    /** QA hook: jump the damped camera/state straight to the current scroll target */
    snap() { measure(); scrollY = window.scrollY; solveTarget(); Object.assign(cur, tgt); },
    /** force shader link + geometry upload while the loader is still up */
    warm() { renderer.render(scene, camera); },
    dispose() { cancelAnimationFrame(raf); renderer.dispose(); },
  };
}
