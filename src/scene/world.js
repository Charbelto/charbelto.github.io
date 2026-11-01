import * as THREE from 'three';
import { buildSwarm, FORMS } from './swarm.js';
import { KF } from './keyframes.js';
import { loadAgent } from './agent.js';
import { createProps } from './props.js';
import { createColourPublisher } from './colours.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/** Bright studio HDR built procedurally: light hall, white softboxes, a few coloured cards for colourful reflections. */
function buildEnvironment(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(40, 28, 40), new THREE.MeshBasicMaterial({ color: 0xc9cfe8, side: THREE.BackSide })));
  const panel = (w, h, pos, color, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(18, 11, [2, 13, 5], '#ffffff', 6); // overhead softbox
  panel(3.5, 22, [-17, 2, 3], '#ffffff', 4); // strip left
  panel(3.5, 22, [17, 1, 6], '#fff3d9', 4.5); // strip right
  panel(26, 4, [0, 4, -19], '#ffffff', 3.5); // back rim
  panel(30, 30, [0, -13.5, 0], '#b9a6ff', 1.4); // lilac floor bounce
  panel(7, 7, [-12, 5, -12], '#D4FF1F', 3.2); // lime card
  panel(7, 7, [12, -2, -12], '#FF4F3D', 3.2); // coral card
  panel(6, 6, [0, 6, 16], '#2433FF', 2.4); // blue card (front)
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.02).texture;
  pm.dispose();
  s.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  return tex;
}

function makeMaterials() {
  const plastic = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
  const satin = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.38, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.14, metalness: 1 });
  const sunChrome = new THREE.MeshPhysicalMaterial({ color: '#f3f5ff', roughness: 0.04, metalness: 1 });
  return { plastic, satin, chrome, sunChrome };
}

export function createWorld(canvas, { quality = 'high', reducedMotion = false, governor = true, onSlow = null } = {}) {
  const Q = {
    high: { dpr: 1.75, antialias: true },
    mid: { dpr: 1.25, antialias: true },
    low: { dpr: 1, antialias: true }, // MSAA everywhere: aliased toy edges looked cheap
  }[quality];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.antialias, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps saturated colours saturated
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color(KF.hero.bgr, KF.hero.bgg, KF.hero.bgb);
  scene.fog = new THREE.FogExp2(fogColor, 0.014); // distant toys melt into the page colour
  scene.environment = buildEnvironment(renderer);
  scene.environmentIntensity = 1.15;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 300);
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(6, 10, 8);
  const hemi = new THREE.HemisphereLight('#ffffff', '#b9a6ff', 0.9);
  const cursorLight = new THREE.PointLight('#ffffff', 26, 18, 2); // four lights total with the key + hemisphere + fill
  const fill = new THREE.DirectionalLight('#ffe9c9', 0.9);
  fill.position.set(-8, -2, 6);
  scene.add(key, hemi, fill, cursorLight);

  const mats = makeMaterials();
  const swarm = buildSwarm(quality, mats);
  const holder = new THREE.Group();
  holder.add(swarm.group);
  scene.add(holder);

  // Pip loads after the first frame, so a slow/failed download never blocks the page
  let agent = null;
  loadAgent(`${import.meta.env.BASE_URL}models/agent.glb`).then((a) => { agent = a; scene.add(a.rig); }).catch((e) => console.warn('[agent] not loaded', e));

  const props = createProps(scene, import.meta.env.BASE_URL);
  const propW = new Map(); // damped assembly weight per prop
  let blend = { a: null, b: null, t: 0, upcoming: [] };

  /* ───── director ───── */
  const keys = Object.keys(KF.hero).filter((k) => typeof KF.hero[k] === 'number');
  const cur = { ...KF.hero };
  const tgt = { ...KF.hero };
  let marks = [];
  let scrollY = 0;
  let intro = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let kickAmt = 0;
  let visible = true;
  let last = performance.now();
  let raf = 0;
  const lookAt = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const sph = new THREE.Vector3();
  const right = new THREE.Vector3();
  const upv = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const pointerWorld = new THREE.Vector3(999, 999, 999);
  const ray = new THREE.Vector3();

  function measure() {
    marks = [...document.querySelectorAll('[data-kf]')]
      .filter((el) => KF[el.dataset.kf])
      .map((el) => {
        if (el.dataset.vc) return { name: el.dataset.kf, center: Number(el.dataset.vc), el }; // virtual step inside a pinned group
        const r = el.getBoundingClientRect();
        return { name: el.dataset.kf, center: r.top + window.scrollY + r.height / 2, el };
      })
      .sort((a, b) => a.center - b.center);
  }

  /* portrait screens: the free band between the header and the card the object may occupy (viewport fractions, damped) */
  const band = { top: 0.1, bot: 0.55, t: 0.1, b: 0.55, n: 0, mark: null };
  function sampleBand() {
    const m = band.mark;
    const card = m?.el?.querySelector('.panel, .xp, .wide, .contact-inner');
    const h = window.innerHeight;
    const r = card?.getBoundingClientRect();
    band.t = Math.min(0.2, 78 / h);
    // the card is translated 16 px while hidden; ignore that
    band.b = r && r.height ? clamp((r.top - 8) / h, 0.3, 0.98) : 0.62;
  }

  function solveTarget() {
    if (!marks.length) return;
    const m = scrollY + window.innerHeight * 0.5;
    let i = 0;
    while (i < marks.length - 1 && marks[i + 1].center <= m) i++;
    const a = marks[i];
    const b = marks[Math.min(i + 1, marks.length - 1)];
    let t = b === a ? 0 : clamp((m - a.center) / (b.center - a.center), 0, 1);
    t = reducedMotion ? (t > 0.5 ? 1 : 0) : smooth(clamp((t - 0.1) / 0.8, 0, 1));
    const A = KF[a.name]; const B = KF[b.name];
    for (const k of keys) tgt[k] = lerp(A[k], B[k], t);
    band.mark = t > 0.5 ? b : a;
    blend = { a: A.prop || null, b: B.prop || null, t, upcoming: [marks[i + 2], marks[i + 3]].filter(Boolean).map((mk) => KF[mk.name].prop) };
  }

  let lastW = 0; let lastH = 0;
  function resize() {
    if (disposed) return;
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
  const onScroll = () => { scrollY = window.scrollY; };
  const onPointer = (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  const publish = createColourPublisher();
  const publishColours = () => publish(cur);

  /* ───── frame ───── */
  function frame(now) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    const rawDt = (now - last) / 1000; // true frame time (the governor must see slow frames; dt below is capped for the animation maths)
    const dt = Math.min(0.05, rawDt);
    last = now;
    const time = now / 1000;

    solveTarget();
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.4);
    for (const key of keys) cur[key] = lerp(cur[key], tgt[key], key === 'fov' ? Math.min(1, k * 1.2) : key.startsWith('bg') || key.startsWith('ac') ? Math.min(1, k * 1.5) : k);
    // which authored objects are on stage, and how assembled each is (scroll-scrubbed, damped, fully reversible)
    const want = new Map();
    if (blend.a) want.set(blend.a, (want.get(blend.a) || 0) + (1 - blend.t));
    if (blend.b) want.set(blend.b, (want.get(blend.b) || 0) + blend.t);
    for (const n of [blend.a, blend.b, ...blend.upcoming]) if (n) props.ensure(n);
    const kp = reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
    for (const n of new Set([...propW.keys(), ...want.keys()])) {
      const v = lerp(propW.get(n) || 0, want.get(n) || 0, kp);
      if (v < 0.002 && !want.get(n)) propW.delete(n); else propW.set(n, v);
    }
    publishColours();
    fogColor.setRGB(cur.bgr, cur.bgg, cur.bgb, THREE.SRGBColorSpace);

    pointer.x = lerp(pointer.x, pointer.tx, 1 - Math.exp(-dt * 4));
    pointer.y = lerp(pointer.y, pointer.ty, 1 - Math.exp(-dt * 4));
    kickAmt *= Math.exp(-dt * 2.6);

    const ie = smooth(intro);
    const aspect = camera.aspect;
    const portrait = clamp((aspect - 0.62) / 0.95, 0, 1); // 0 phone … 1 desktop
    const fitD = aspect < 1.25 ? lerp(1.6, 1, portrait) : 1;

    /* camera */
    const az = cur.az + pointer.x * 0.06;
    const el = cur.el + pointer.y * 0.04;
    const wide = lerp(1.24, 1, smooth(clamp((cur.fov - 40) / 30, 0, 1))); // formations sit a little smaller so type stays clear (the dive keeps its close lens)
    let d = cur.d * wide * fitD * lerp(cur.pd, 1, portrait) * lerp(1.6, 1, ie);
    // portrait: object chapters fit the free band above the card (and the screen width), so nothing is cropped or hidden
    const fitMix = aspect < 1.1 ? smooth(clamp(cur.nf, 0, 1)) * ie : 0;
    if (fitMix > 0) {
      if ((frameNo++ & 7) === 0) sampleBand();
      band.top = lerp(band.top, band.t, 0.2); band.bot = lerp(band.bot, band.b, 0.2);
      const F = Math.max(0.2, band.bot - band.top);
      const dFit = 4.7 / (Math.tan((cur.fov * Math.PI) / 360) * Math.min(aspect * 0.97, F));
      d = lerp(d, dFit, fitMix);
    }
    sph.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d);
    const vh = Math.tan((cur.fov * Math.PI) / 360) * d;
    right.set(Math.cos(az), 0, -Math.sin(az));
    const shift = cur.sx * vh * aspect * portrait * ie;
    // portrait: lift the subject into the upper half, above the bottom-anchored text panel
    const bandLift = (1 - (band.top + band.bot)) * vh; // centre the object in the band between header and card
    const lift = lerp((1 - portrait) * (0.42 + 0.2 * cur.nf) * vh, bandLift, fitMix);
    lookAt.set(cur.cx, cur.cy - lift, cur.cz).addScaledVector(right, -shift);
    camPos.set(cur.cx, cur.cy - lift, cur.cz).add(sph).addScaledVector(right, -shift);
    camera.position.copy(camPos);
    camera.lookAt(lookAt);
    camera.fov = cur.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    scene.fog.density = 0.3 / d; // fog tracks camera distance, so far-away framings (phones) don't wash the swarm out

    /* pointer → world point on the plane through the look-at target (for repulsion + light) */
    ray.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camPos).normalize();
    dir.copy(lookAt).sub(camPos);
    const planeDist = dir.length();
    dir.normalize();
    const denom = ray.dot(dir);
    if (denom > 1e-4 && pointer.tx < 5) pointerWorld.copy(camPos).addScaledVector(ray, planeDist / denom);
    cursorLight.position.copy(pointerWorld).addScaledVector(dir, -4);

    holder.rotation.y = cur.yaw + (reducedMotion ? 0 : Math.sin(time * 0.25) * cur.rock + time * cur.spin);
    swarm.update({
      time, dt, form: clamp(cur.form, 0, FORMS - 1), spread: cur.spread, pointerR: cur.pr, sunAmt: cur.sun, intro: ie,
      pointerWorld: pointer.tx === 0 && pointer.ty === 0 && !pointerSeen ? new THREE.Vector3(999, 999, 999) : pointerWorld,
      kick: kickAmt, still: reducedMotion,
      sizeBoost: lerp(1.5, 1, portrait), // on tall screens the camera sits further back, so toys grow to stay chunky
      amount: cur.swarm, nearFade: cur.nf, camDist: d, camPos,
    });
    agent?.update({ time, dt, amount: cur.agent * ie, pointer, still: reducedMotion });
    props.update({ time, weights: propW, pointer, still: reducedMotion });
    key.position.set(6, 10, 8).applyAxisAngle(upv, az * 0.6);

    renderer.render(scene, camera);
    if (governor && ie >= 1 && !disposed) adapt(Math.min(0.6, rawDt));
  }
  let pointerSeen = false;
  let frameNo = 0;
  let disposed = false;
  let slowStrikes = 0;

  /* ───── adaptive resolution governor ─────
     Measures the average frame time over ~60 frames. Sustained slow frames lower the pixel ratio
     (down to a floor); sustained fast frames raise it again (up to the tier's cap). Hysteresis
     (consecutive verdicts) prevents flapping. Disabled with ?gov=0 and in QA captures. */
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
    // a window is 60 frames, or 2.5 s with at least 5 frames (so a struggling device is judged within seconds, not minutes)
    if (accN < 60 && !(accT >= 2.5 && accN >= 5)) return;
    const avg = accT / accN; accT = 0; accN = 0;
    stats.avgMs = +(avg * 1000).toFixed(1);
    // a machine that cannot hold even ~11 fps at the lowest resolution twice in a row: hand over to the lightweight mode
    slowStrikes = avg > 0.09 ? slowStrikes + 1 : 0;
    if (slowStrikes >= 2 && onSlow) { const cb = onSlow; onSlow = null; cb(); return; }
    const v = avg > 0.0245 ? -1 : avg < 0.0125 ? 1 : 0;
    verdict = v === Math.sign(verdict) || verdict === 0 ? verdict + v : v;
    if (verdict <= -2 && pr > prFloor) { applyPR(Math.max(prFloor, pr * 0.86)); stats.steps++; verdict = 0; }
    else if (verdict >= 3 && pr < prCap) { applyPR(Math.min(prCap, pr * 1.1)); stats.steps++; verdict = 0; }
  }

  /* ───── public ───── */
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  if (!reducedMotion && quality !== 'low') {
    window.addEventListener('pointermove', (e) => { pointerSeen = true; onPointer(e); }, { passive: true });
    window.addEventListener('pointerdown', () => { kickAmt = Math.min(8, kickAmt + 2.2); }, { passive: true });
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  scrollY = window.scrollY;
  resize();
  solveTarget();
  Object.assign(cur, tgt);
  publishColours();

  return {
    renderer, scene, camera, swarm, stats,
    start() { last = performance.now(); raf = requestAnimationFrame(frame); },
    setIntro(v) { intro = v; },
    get intro() { return intro; },
    kick(v = 3) { if (!reducedMotion) kickAmt = Math.min(8, kickAmt + v); },
    recolor: (n) => swarm.recolor(n),
    props,
    propWeights: propW,
    wave() { agent?.wave(); },
    get agentLoaded() { return !!agent; },
    remeasure: measure,
    /** QA hook: jump the damped camera/state straight to the current scroll target */
    snap() { measure(); scrollY = window.scrollY; solveTarget(); Object.assign(cur, tgt); publishColours(); },
    compile: () => renderer.compileAsync(scene, camera),
    /** force shader link + geometry upload while the loader is still up */
    warm() { renderer.render(scene, camera); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize); window.removeEventListener('scroll', onScroll);
      io.disconnect();
      try { renderer.dispose(); renderer.forceContextLoss(); } catch { /* already gone */ }
    },
  };
}
