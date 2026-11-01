import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * THE SWARM — one set of glossy "toy" objects that morphs between a formation for every chapter
 * (a cloud around a chrome sun, a tunnel, an agent network, a funnel, a socket lattice, a histogram,
 * a shield, exploded evaluation layers, then a silhouette for each project, a helix, and finally a tidy ball).
 * Every formation is plain maths — no external assets.
 */
const TAU = Math.PI * 2;
export const PALETTE = ['#2433FF', '#FF4F3D', '#FFD21F', '#3DF2B0', '#FF6FB5', '#F5F1E8', '#14141F', '#B9A6FF'];
const WEIGHTS = [3, 3, 3, 2, 2, 2, 1, 2];
export const FORMS = 20;
// toy size per formation: structures (network, lattice, layers, project shapes) use smaller toys so the SHAPE reads
const SIZE_MUL = [0.9, 0.8, 0.7, 0.95, 0.62, 0.62, 0.6, 0.7, 0.66, 1.0, 0.6, 0.58, 0.62, 0.6, 0.6, 0.62, 0.62, 0.7, 0.8, 0.66];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────── formations ───────── */
function buildFormations(N, colorIdx) {
  const out = [];
  const dust = (r) => {
    const th = r() * TAU; const rad = 11 + r() * 6;
    return [Math.cos(th) * rad, (r() - 0.5) * 12, Math.sin(th) * rad, 0.4];
  };
  const euler = new THREE.Euler();
  const v = new THREE.Vector3();
  const rot = (x, y, z, ex, ey, ez) => { v.set(x, y, z); euler.set(ex, ey, ez); v.applyEuler(euler); return [v.x, v.y, v.z]; };

  // stack index of each instance within its colour (for the histogram)
  const stack = new Array(N); const seen = new Array(PALETTE.length).fill(0);
  for (let i = 0; i < N; i++) stack[i] = seen[colorIdx[i]]++;

  const defs = [
    // 0 hero: a loose cloud around the chrome sun
    (i, r) => { const rad = 4.4 + Math.pow(r(), 0.7) * 6.5; const th = r() * TAU; const ph = Math.acos(2 * r() - 1); return [3.4 + rad * Math.sin(ph) * Math.cos(th) * 0.9, rad * Math.cos(ph) * 0.7, rad * Math.sin(ph) * Math.sin(th), 0.85 + r() * 0.5]; },
    // 1 profile: three spiral arms
    (i, r) => { const t = r(); const arm = i % 3; const ang = (arm * TAU) / 3 + t * 4.2; const rad = 1.8 + t * 8; return [Math.cos(ang) * rad, (r() - 0.5) * (0.6 + t * 1.6), Math.sin(ang) * rad, 0.8 + (1 - t) * 0.5]; },
    // 2 meet Pip: loose halo orbits around the character, a sprinkle of toys on the "floor", a far shell
    (i, r) => {
      if (i < Math.floor(N * 0.52)) { const id = i % 3; const n = Math.ceil(N * 0.52 / 3); const a = (Math.floor(i / 3) / n) * TAU + id; const R = [5.6, 7.0, 8.4][id]; return [...rot(Math.cos(a) * R, Math.sin(a) * R, 0, ...[[1.35, 0.2, 0], [0.7, -0.8, 0.4], [1.2, 0.9, -0.3]][id]), 0.95]; }
      if (i < Math.floor(N * 0.72)) { const a = r() * TAU; const R = 2.5 + r() * 6; return [Math.cos(a) * R, -2.6 + r() * 0.3, Math.sin(a) * R, 0.55]; }
      return dust(r);
    },
    // 3 dive: a tunnel of rings receding into the screen
    (i, r) => { const k = Math.floor(i / 10); const a = ((i % 10) / 10) * TAU + k * 0.35; const rad = 5.6 + (r() - 0.5) * 0.9; return [Math.cos(a) * rad, Math.sin(a) * rad, -k * 1.0, 1.15]; },
    // 4 orchestration: a hub and three gimbal orbits of agents
    (i, r) => {
      if (i < 16) { const ph = Math.acos(2 * r() - 1); const th = r() * TAU; return [0.9 * Math.sin(ph) * Math.cos(th), 0.9 * Math.cos(ph), 0.9 * Math.sin(ph) * Math.sin(th), 0.85, 0]; }
      const j = i - 16; const id = j % 3; const n = Math.ceil((N - 16) / 3); const a = (Math.floor(j / 3) / n) * TAU; const R = [3.3, 5.0, 6.7][id];
      const tilt = [[0.2, 0, 0], [1.15, 0, 0.35], [0.45, 1.05, 0]][id];
      return [...rot(Math.cos(a) * R, Math.sin(a) * R, 0, ...tilt), 1.05, [5, 2, 3][id]];
    },
    // 5 retrieval: a spiral funnel pulling knowledge toward a point
    (i, r) => { const t = i / N; const ang = t * 34 + r() * 0.3; const rad = 0.5 + 5.8 * Math.pow(1 - t, 1.3); return [Math.cos(ang) * rad, 4.5 - t * 9, Math.sin(ang) * rad, 0.7 + (1 - t) * 0.5, [0, 7, 5, 4, 1, 2][Math.min(5, Math.floor(t * 6))]]; },
    // 6 tools: a socket lattice (two layers)
    (i) => { const layer = i % 2; const idx = Math.floor(i / 2); const m = Math.ceil(N / 2); const cols = Math.ceil(Math.sqrt(m * 1.15)); const rows = Math.ceil(m / cols); return [((idx % cols) - (cols - 1) / 2) * 1.05, (Math.floor(idx / cols) - (rows - 1) / 2) * 1.05, layer * 1.7 - 0.85, 0.95, ((idx % cols) + Math.floor(idx / cols)) % 2 ? 0 : 5]; },
    // 7 evaluation: a distribution — instances stack into columns by colour
    (i, r) => [(colorIdx[i] - 3.5) * 1.3, -4.2 + stack[i] * 0.72, (r() - 0.5) * 0.4, 1.0],
    // 8 reliability: a protective shell
    (i) => { const ph = Math.acos(1 - (2 * (i + 0.5)) / N); const th = Math.PI * (1 + Math.sqrt(5)) * i; const R = 4.7; return [R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th), 1.05]; },
    // 9 playground: a dense storm of oversized toys around the camera
    (i, r) => { const rad = 3.5 + Math.pow(r(), 0.8) * 9; const th = r() * TAU; const ph = Math.acos(2 * r() - 1); return [rad * Math.sin(ph) * Math.cos(th), rad * Math.cos(ph) * 0.8, rad * Math.sin(ph) * Math.sin(th), 1.5 + r() * 0.9]; },
    // 10 GREAT: five evaluation layers (spread is animated in the director)
    (i) => { const per = Math.floor(N / 5); const k = Math.min(4, Math.floor(i / per)); const idx = i - k * per; const a = (idx / per) * TAU + k * 0.4; const R = [6.4, 5.6, 4.8, 4.0, 3.2][k]; return [Math.cos(a) * R, (k - 2) * 2.6, Math.sin(a) * R, 1.0, [4, 2, 3, 5, 1][k]]; },
    // 11 LoopGuard: a closed chain with one breaker at the gate
    (i, r) => {
      const M = Math.floor(N * 0.78); const G = Math.floor(N * 0.06);
      if (i < M) { const a = (i / M) * (TAU - 0.55) + 0.28; return [Math.cos(a) * 3.9, Math.sin(a) * 3.9, 0, 1.1, 0]; }
      if (i < M + G) { return [3.9 + (r() - 0.5) * 0.7, (r() - 0.5) * 1.1, (r() - 0.5) * 0.9, 1.35, 1]; }
      return dust(r);
    },
    // 12 DermSense: stacked convolution layers
    (i, r) => {
      const per = Math.floor(N * 0.17); const k = Math.floor(i / per);
      if (k < 5) { const a = ((i % per) / per) * TAU; const R = [3.7, 3.3, 2.8, 2.3, 1.8][k]; return [Math.cos(a) * R, (2 - k) * 1.75, Math.sin(a) * R, 0.9, [1, 2, 3, 4, 0][k]]; }
      return dust(r);
    },
    // 13 OULAD: a cohort of trajectories — bands separate, some drop out
    (i) => {
      const p = Math.floor(i / 12); const b = i % 12; const s = b / 11;
      const band = [1.7, 0, -1.7][p % 3]; const h = Math.sin(p * 12.9898) * 43758.5453; const jit = (h - Math.floor(h)) - 0.5;
      const ease = s * s * (3 - 2 * s);
      let y = band * ease + jit * (0.15 + s * 1.3); let z = (Math.sin(p * 7.7) * 0.5) * (0.2 + s * 1.5);
      if (p % 5 === 0 && s > 0.55) { y -= Math.pow(s - 0.55, 2) * 16; }
      const drop = p % 5 === 0 && s > 0.55;
      return [-5.3 + 10.6 * s, y, z, 0.85, drop ? 6 : [3, 2, 1][p % 3]];
    },
    // 14 microservices: a hub, six services, traffic links
    (i, r) => {
      if (i < 32) { const q = i; return [((q % 4) - 1.5) * 0.7, (Math.floor(q / 4) % 4 - 1.5) * 0.7, (Math.floor(q / 16) - 0.5) * 0.7, 1.05, 1]; }
      if (i < 32 + 96) { const j = i - 32; const c = j % 6; const a = (c / 6) * TAU; const cx = Math.cos(a) * 5.2; const cz = Math.sin(a) * 5.2; const ph = Math.acos(2 * r() - 1); const th = r() * TAU; return [cx + 1.2 * Math.sin(ph) * Math.cos(th), 1.2 * Math.cos(ph), cz + 1.2 * Math.sin(ph) * Math.sin(th), 1.05, [0, 2, 3, 4, 7, 5][c]]; }
      if (i < 32 + 96 + 72) { const j = i - 128; const c = j % 6; const k = Math.floor(j / 6) + 1; const a = (c / 6) * TAU; const t = 0.18 + (k / 13) * 0.62; return [Math.cos(a) * 5.2 * t, (r() - 0.5) * 0.15, Math.sin(a) * 5.2 * t, 0.62, 6]; }
      return dust(r);
    },
    // 15 cell tower: lattice mast with cross-bracing and broadcast rings
    (i, r) => {
      const legs = Math.floor(N * 0.36); const braces = Math.floor(N * 0.3);
      const radAt = (t) => 2.3 - t * 1.75;
      if (i < legs) { const l = i % 4; const m = Math.floor(i / 4); const mm = Math.ceil(legs / 4); const t = m / mm; const a = (l * TAU) / 4 + Math.PI / 4; return [Math.cos(a) * radAt(t), -4.8 + t * 9, Math.sin(a) * radAt(t), 1.05, 0]; }
      if (i < legs + braces) { // a square brace at each level, running corner to corner
        const j = i - legs; const level = Math.floor(j / 12); const q = j % 12; const t = (level + 0.5) / Math.ceil(braces / 12); const side = Math.floor(q / 3); const u = (q % 3) / 3;
        const a0 = (side * TAU) / 4 + Math.PI / 4; const a1 = ((side + 1) * TAU) / 4 + Math.PI / 4; const R = radAt(t);
        return [Math.cos(a0) * R * (1 - u) + Math.cos(a1) * R * u, -4.8 + t * 9, Math.sin(a0) * R * (1 - u) + Math.sin(a1) * R * u, 0.8, 6];
      }
      const j = i - legs - braces; const ringN = Math.floor((N - legs - braces) * 0.5 / 3);
      if (j < ringN * 3) { const k = Math.floor(j / ringN); const a = ((j % ringN) / ringN) * TAU; const R = 1.9 + k * 1.5; return [Math.cos(a) * R, 4.6 + k * 0.05, Math.sin(a) * R, 0.8, [1, 2, 4][k]]; }
      return dust(r);
    },
    // 16 supermarket graph: a handful of nodes joined by their nearest neighbours; the shortest path glows
    (i, r) => {
      const nodes = []; const rr = rng(5);
      for (let n = 0; n < 14; n++) { const u = rr() * 2 - 1; const a = rr() * TAU; const rad = 2.6 + rr() * 2.4; const s = Math.sqrt(1 - u * u); nodes.push([s * Math.cos(a) * rad * 1.35, u * rad * 0.85, s * Math.sin(a) * rad * 1.35]); }
      const edges = []; const seen = new Set();
      nodes.forEach((p, n) => nodes.map((q, m) => ({ m, d: Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) })).filter((o) => o.m !== n).sort((x, y) => x.d - y.d).slice(0, 2).forEach(({ m }) => { const key = n < m ? n + '-' + m : m + '-' + n; if (!seen.has(key)) { seen.add(key); edges.push([n, m]); } }));
      const NODE_N = 5;
      if (i < nodes.length * NODE_N) { const n = nodes[Math.floor(i / NODE_N)]; const ph = Math.acos(2 * r() - 1); const th = r() * TAU; return [n[0] + 0.55 * Math.sin(ph) * Math.cos(th), n[1] + 0.55 * Math.cos(ph), n[2] + 0.55 * Math.sin(ph) * Math.sin(th), 1.25, Math.floor(i / NODE_N) % 6]; }
      const j = i - nodes.length * NODE_N; const BEADS = 7; const e = edges[Math.floor(j / BEADS)];
      if (e && j < edges.length * BEADS) { const A = nodes[e[0]]; const B = nodes[e[1]]; const t = ((j % BEADS) + 1) / (BEADS + 1); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, 0.5, 6]; }
      return dust(r);
    },
    // 17 experience: a double helix the camera orbits
    (i, r) => {
      const H = Math.floor(N * 0.68);
      if (i >= H) return dust(r);
      // an open double spiral: two strands, ~2.4 turns, spaced wide enough to read as a helix
      const t = i / H; const a = t * TAU * 2.4 + (i % 2) * Math.PI;
      return [Math.cos(a) * 4.0, -5.5 + t * 11, Math.sin(a) * 4.0, 1.0, i % 2 ? 1 : 0];
    },
    // 18 calm cloud (archive / education)
    (i, r) => { const rad = 5 + Math.pow(r(), 0.8) * 6; const th = r() * TAU; const y = (r() - 0.5) * 7; return [Math.cos(th) * rad, y, Math.sin(th) * rad, 0.75]; },
    // 19 contact: a tidy ball of everything
    (i) => { const sh = i % 4; const n = Math.ceil(N / 4); const idx = Math.floor(i / 4); const R = [2.0, 2.9, 3.8, 4.7][sh]; const ph = Math.acos(1 - (2 * (idx + 0.5)) / n); const th = Math.PI * (1 + Math.sqrt(5)) * idx; return [R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th), 1.0, Math.min(7, Math.floor((ph / Math.PI) * 8))]; },
  ];

  defs.forEach((fn, f) => {
    const r = rng(1000 + f * 17);
    const arr = new Float32Array(N * 4);
    const col = new Int8Array(N);
    for (let i = 0; i < N; i++) {
      const [x, y, z, s, c] = fn(i, r);
      arr[i * 4] = x; arr[i * 4 + 1] = y; arr[i * 4 + 2] = z; arr[i * 4 + 3] = s;
      col[i] = c === undefined ? colorIdx[i] : c; // formations without a colour story keep each toy's own colour
    }
    out.push({ pos: arr, col });
  });
  return out;
}

/* ───────── the swarm ───────── */
export function buildSwarm(quality, mats) {
  const N = { high: 360, mid: 240, low: 150 }[quality];
  const seg = quality === 'low' ? 0.6 : 1;
  const group = new THREE.Group();

  // pill · ring · cube · sphere · pin
  const pin = (() => {
    const pts = [[0, -0.5], [0.22, -0.5], [0.3, -0.3], [0.25, 0.05], [0.14, 0.3], [0.16, 0.42], [0.08, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, Math.round(20 * seg));
  })();
  const geos = [
    new THREE.CapsuleGeometry(0.2, 0.55, Math.round(6 * seg) + 2, Math.round(16 * seg) + 4),
    new THREE.TorusGeometry(0.34, 0.14, Math.round(14 * seg) + 4, Math.round(30 * seg) + 6),
    new RoundedBoxGeometry(0.62, 0.62, 0.62, quality === 'low' ? 2 : 4, 0.12),
    new THREE.SphereGeometry(0.4, Math.round(30 * seg) + 6, Math.round(18 * seg) + 6),
    pin,
  ];
  const shapeMats = [mats.plastic, mats.plastic, mats.satin, mats.chrome, mats.plastic];

  // colours and shape assignment
  const r0 = rng(77);
  const colorIdx = new Array(N);
  const bag = []; WEIGHTS.forEach((w, k) => { for (let q = 0; q < w; q++) bag.push(k); });
  for (let i = 0; i < N; i++) colorIdx[i] = bag[Math.floor(r0() * bag.length)];

  const ids = [[], [], [], [], []];
  for (let i = 0; i < N; i++) ids[i % 5].push(i);
  const meshes = geos.map((g, k) => {
    const m = new THREE.InstancedMesh(g, shapeMats[k], ids[k].length);
    m.frustumCulled = false;
    const c = new THREE.Color();
    ids[k].forEach((gi, j) => { c.set(PALETTE[colorIdx[gi]]); m.setColorAt(j, c); });
    m.instanceColor.needsUpdate = true;
    group.add(m);
    return m;
  });

  const F = buildFormations(N, colorIdx);
  const phase = new Float32Array(N); const spinSpd = new Float32Array(N * 3); const size = new Float32Array(N);
  const rs = rng(31);
  for (let i = 0; i < N; i++) {
    phase[i] = rs() * TAU;
    spinSpd[i * 3] = (rs() - 0.5) * 1.2; spinSpd[i * 3 + 1] = (rs() - 0.5) * 1.2; spinSpd[i * 3 + 2] = (rs() - 0.5) * 1.2;
    size[i] = 0.85 + rs() * 0.4;
  }
  const off = new Float32Array(N * 3); // pointer / kick displacement (local space)
  let shift = 0; // palette rotation (the playground re-colours everything)

  // the chrome sun (hero + shell) with a ringed orbit
  const sun = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.7, 64, 40), mats.sunChrome);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.09, 12, 120), mats.plastic);
  halo.material = mats.plastic.clone(); halo.material.color.set('#2433FF');
  halo.rotation.x = 1.15;
  sun.add(ball, halo);
  group.add(sun);

  const d = new THREE.Object3D();
  const tmp = new THREE.Color();
  const PCOL = PALETTE.map((h) => new THREE.Color(h));
  const local = new THREE.Vector3();
  const P = new THREE.Vector3();

  function update({ time, dt, form, spread, sunAmt, intro, pointerWorld, pointerR, kick, still, sizeBoost = 1 }) {
    const fa = Math.min(FORMS - 1, Math.max(0, Math.floor(form)));
    const fb = Math.min(FORMS - 1, fa + 1);
    let t = form - fa; t = t * t * (3 - 2 * t);
    const A = F[fa].pos; const B = F[fb].pos; const CA = F[fa].col; const CB = F[fb].col;
    const w9 = (fa === 10 ? 1 - t : 0) + (fb === 10 ? t : 0);
    const yMul = 1 + (spread - 1) * w9;
    const ie = intro;
    const sizeMul = (SIZE_MUL[fa] + (SIZE_MUL[fb] - SIZE_MUL[fa]) * t) * sizeBoost;
    // pointer in the group's local space
    local.copy(pointerWorld); group.worldToLocal(local);
    const R = pointerR; const decay = Math.exp(-dt * 3.2);
    const k = 1 - Math.exp(-dt * 12);

    for (let m = 0; m < 5; m++) {
      const mesh = meshes[m]; const list = ids[m];
      for (let j = 0; j < list.length; j++) {
        const i = list[j]; const o = i * 4;
        let x = A[o] + (B[o] - A[o]) * t;
        let y = (A[o + 1] + (B[o + 1] - A[o + 1]) * t) * yMul;
        let z = A[o + 2] + (B[o + 2] - A[o + 2]) * t;
        let s = (A[o + 3] + (B[o + 3] - A[o + 3]) * t) * sizeMul;
        if (!still) { y += Math.sin(time * 0.7 + phase[i]) * 0.14; x += Math.cos(time * 0.5 + phase[i] * 1.3) * 0.08; }
        // intro: everything flies in from far away
        const spreadIn = 1 + (1 - ie) * 2.4; x *= spreadIn; y *= spreadIn; z *= spreadIn; s *= ie;

        const ox = off[i * 3]; const oy = off[i * 3 + 1]; const oz = off[i * 3 + 2];
        P.set(x + ox, y + oy, z + oz);
        const dx = P.x - local.x; const dy = P.y - local.y; const dz = P.z - local.z; const dist = Math.hypot(dx, dy, dz);
        let nx = ox * decay; let ny = oy * decay; let nz = oz * decay;
        if (!still && dist < R && dist > 1e-4) {
          const push = (R - dist) / R; const f = push * push * 2.4;
          nx += (dx / dist) * f * k * 3; ny += (dy / dist) * f * k * 3; nz += (dz / dist) * f * k * 3;
        }
        if (kick > 0.01) { const len = Math.hypot(x, y, z) || 1; nx += (x / len) * kick * 0.028; ny += (y / len) * kick * 0.028; nz += (z / len) * kick * 0.028; }
        off[i * 3] = nx; off[i * 3 + 1] = ny; off[i * 3 + 2] = nz;

        d.position.set(x + nx, y + ny, z + nz);
        const sp = still ? 0 : time;
        d.rotation.set(phase[i] + sp * spinSpd[i * 3], phase[i] * 0.7 + sp * spinSpd[i * 3 + 1], sp * spinSpd[i * 3 + 2]);
        d.scale.setScalar(s * size[i]);
        d.updateMatrix();
        mesh.setMatrixAt(j, d.matrix);
        // colour: blend the two formations' colour meanings, honouring the recolour shift
        const ca = (CA[i] + shift) % PALETTE.length; const cb = (CB[i] + shift) % PALETTE.length;
        tmp.copy(PCOL[ca]); if (ca !== cb) tmp.lerp(PCOL[cb], t);
        mesh.setColorAt(j, tmp);
      }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    }
    const sa = sunAmt * ie;
    sun.visible = sa > 0.01;
    sun.scale.setScalar(Math.max(0.001, sa));
    halo.rotation.z = time * 0.35;
  }

  function recolor(step = 1) { shift = (shift + step) % PALETTE.length; }

  return { group, update, recolor, count: N };
}
