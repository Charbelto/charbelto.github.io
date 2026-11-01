import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { glowMaterial, SIGNAL, ICE } from './machine.js';
import { GALLERY_Y, GALLERY_R, galleryPos } from './keyframes.js';

const TAU = Math.PI * 2;
const dummy = new THREE.Object3D();

const ember = (k = 2.4) => new THREE.MeshBasicMaterial({ color: SIGNAL.clone().multiplyScalar(k) });

function rnd(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function tube(a, b, radius, mat) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 8), mat);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

/* 1 ── LoopGuard: a chain loop with a breaker clamp; a signal circles, then is halted */
function loopGuard(M) {
  const g = new THREE.Group();
  const n = 26;
  const R = 1.25;
  const links = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.085, 0.22, 6, 14), M.titanium, n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    dummy.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    dummy.rotation.set(0, (i % 2) * Math.PI / 2, a, 'ZYX');
    dummy.scale.set(1, 1, i % 2 ? 0.55 : 1);
    dummy.updateMatrix();
    links.setMatrixAt(i, dummy.matrix);
  }
  g.add(links);
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.62, 0.5, 4, 0.04), M.ceramic);
  clamp.position.set(R, 0, 0);
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.38, 0.52), ember(3));
  slit.position.set(R + 0.172, 0, 0);
  const slit2 = slit.clone(); slit2.position.x = R - 0.172;
  g.add(clamp, slit, slit2);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), ember(3.2));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), glowMaterial('c = uColor*0.35*pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.0);', { uColor: { value: SIGNAL.clone() } }));
  bead.add(halo);
  g.add(bead);
  // inner ring of fine marks
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), M.graphite, 90);
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * TAU;
    dummy.position.set(Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0);
    dummy.rotation.set(0, 0, a + Math.PI / 2); dummy.scale.set(1, i % 5 ? 0.6 : 1.5, 1); dummy.updateMatrix();
    marks.setMatrixAt(i, dummy.matrix);
  }
  g.add(marks);
  return {
    group: g,
    update(t) {
      const ph = t % 5.2;
      const p = Math.min(ph, 3.4) / 3.4;
      const th = (1 - Math.pow(1 - p, 1.6)) * TAU * 3;
      bead.position.set(Math.cos(th) * R, Math.sin(th) * R, 0.03);
      const halted = ph >= 3.4;
      const s = halted ? 1 + 0.35 * Math.sin((ph - 3.4) * 14) * Math.exp(-(ph - 3.4) * 1.2) : 1;
      bead.scale.setScalar(s);
      g.rotation.y = Math.sin(t * 0.3) * 0.35;
    },
  };
}

/* 2 ── DermSense: convolutional lenses with a Grad-CAM heat spot */
function dermSense(M) {
  const g = new THREE.Group();
  const radii = [1.3, 1.15, 1.0, 0.85, 0.7];
  const U = { uTime: { value: 0 }, uColor: { value: SIGNAL.clone() } };
  const heatMat = glowMaterial(
    `vec2 q=(vUv-0.5)*2.0; float r=length(q);
     float grid = max(smoothstep(0.96,1.0,abs(sin(q.x*14.0))), smoothstep(0.96,1.0,abs(sin(q.y*14.0))));
     vec2 h = vec2(0.28*sin(uTime*0.7), 0.22*cos(uTime*0.5));
     float heat = exp(-dot(q-h,q-h)*7.0);
     float edge = 1.0-smoothstep(0.92,1.0,r);
     c = (vec3(0.45,0.5,0.6)*grid*0.28 + uColor*heat*1.7 + vec3(1.0,0.8,0.5)*pow(heat,5.0))*edge;`,
    U,
  );
  const lensMat = M.glass;
  radii.forEach((r, i) => {
    const y = (2 - i) * 0.46;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.045, 80), lensMat);
    disc.position.y = y;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 10, 96), i % 2 ? M.titanium : M.graphite);
    rim.rotation.x = Math.PI / 2; rim.position.y = y;
    g.add(disc, rim);
    if (i === 0 || i === 2 || i === 4) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), i === 0 ? heatMat : glowMaterial(`vec2 q=(vUv-0.5)*2.0; float gr=max(smoothstep(0.95,1.0,abs(sin(q.x*10.0+uTime*0.4))),smoothstep(0.95,1.0,abs(sin(q.y*10.0))));c=uColor*gr*0.16*(1.0-smoothstep(0.9,1.0,length(q)));`, U));
      plane.rotation.x = -Math.PI / 2; plane.position.y = y + 0.03;
      g.add(plane);
    }
  });
  // tie rods
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8), M.titanium);
    rod.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
    g.add(rod);
  }
  g.rotation.x = 0.35;
  return {
    group: g,
    update(t) { U.uTime.value = t; g.rotation.y = t * 0.18; },
  };
}

/* 3 ── OULAD: a cohort of learner trajectories. Everyone enrols at one point, then the cohort
        separates into engagement clusters (GMM-style bands); at-risk learners fall away; past the
        glass "forecast plane" the paths turn dashed — the model is predicting, not observing. */
function oulad(M) {
  const g = new THREE.Group();
  const PATHS = 120;
  const PTS = 120;
  const total = PATHS * PTS;
  const aS = new Float32Array(total);
  const aSeed = new Float32Array(total);
  const aCl = new Float32Array(total);
  const aDrop = new Float32Array(total);
  const pos = new Float32Array(total * 3);
  const r = rnd(23);
  let k = 0;
  for (let p = 0; p < PATHS; p++) {
    const seed = r();
    const u = r();
    const cl = u < 0.42 ? 0 : u < 0.78 ? 1 : 2; // engaged · steady · at-risk
    const dropChance = [0.06, 0.22, 0.7][cl];
    const drop = r() < dropChance ? 0.3 + r() * 0.62 : 2.0;
    for (let i = 0; i < PTS; i++, k++) {
      aS[k] = i / (PTS - 1); aSeed[k] = seed; aCl[k] = cl; aDrop[k] = drop;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geo.setAttribute('aCl', new THREE.BufferAttribute(aCl, 1));
  geo.setAttribute('aDrop', new THREE.BufferAttribute(aDrop, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  const U = { uTime: { value: 0 }, uHeight: { value: 900 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */ `
      attribute float aS; attribute float aSeed; attribute float aCl; attribute float aDrop;
      uniform float uTime; uniform float uHeight;
      varying vec3 vCol; varying float vA;
      const float L = 3.7;
      void main() {
        float s = aS;
        float spread = mix(0.03, 0.3, smoothstep(0.0, 0.6, s));
        float yc = (aCl < 0.5 ? 0.62 : aCl < 1.5 ? 0.02 : -0.58) * smoothstep(0.04, 0.72, s);
        float w = sin(s * 5.0 + aSeed * 31.0) * 0.5 + sin(s * 11.0 + aSeed * 17.0) * 0.25;
        float w2 = sin(s * 4.0 + aSeed * 23.0) * 0.5 + sin(s * 9.0 + aSeed * 41.0) * 0.25;
        float y = yc + w * spread;
        float z = w2 * spread * 1.7;
        float a = 1.0;
        vec3 col = aCl < 0.5 ? vec3(0.56, 0.82, 1.0) : aCl < 1.5 ? vec3(0.92, 0.88, 0.8) : vec3(1.0, 0.36, 0.12);
        if (s > aDrop) {
          float dd = s - aDrop;
          y -= dd * dd * 5.5;
          z += dd * 0.6 * (aSeed - 0.5);
          a *= exp(-dd * 13.0);
          col = mix(col, vec3(1.0, 0.36, 0.12), 0.7);
        }
        // beyond the forecast plane: dashed, dimmer — predicted, not observed
        float fp = 0.62;
        if (s > fp) a *= 0.5 * step(0.5, fract(s * 70.0 + aSeed * 3.0));
        float pulse = pow(0.5 + 0.5 * sin(s * 18.0 - uTime * 1.6 + aSeed * 6.28), 6.0);
        a *= 0.34 + 0.9 * pulse;
        vec3 p = vec3((s - 0.5) * L, y, z);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = 0.016 + 0.02 * pulse;
        gl_PointSize = max(1.5, size * projectionMatrix[1][1] * uHeight * 0.5 / -mv.z);
        vCol = col; vA = a;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vCol; varying float vA;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float d = length(q) * 2.0;
        float f = smoothstep(1.0, 0.0, d);
        vec3 c = vCol * vA * f * 1.5;
        gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const cloud = new THREE.Points(geo, mat);
  cloud.frustumCulled = false;
  g.add(cloud);

  // glass forecast plane with a machined frame
  const L = 3.7;
  const fx = (0.62 - 0.5) * L;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 1.7),
    glowMaterial(`vec2 q=(vUv-0.5)*2.0; float e=smoothstep(0.96,1.0,max(abs(q.x),abs(q.y))); float g=0.04+0.06*(1.0-abs(q.y)); c=uColor*(e*0.9+g*0.35);`, { uColor: { value: ICE.clone() } }),
  );
  plane.rotation.y = Math.PI / 2;
  plane.position.x = fx;
  g.add(plane);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(1, 0.01, 4, 4), M.titanium);
  frame.scale.set(1.2, 0.95, 1);
  frame.rotation.set(0, Math.PI / 2, Math.PI / 4);
  frame.position.x = fx;
  g.add(frame);

  // time axis: machined rail with week ticks
  const rail = new THREE.Mesh(new RoundedBoxGeometry(L + 0.3, 0.03, 0.06, 2, 0.01), M.titanium);
  rail.position.set(0, -1.15, 0);
  g.add(rail);
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.07, 0.012), M.graphite, 38);
  for (let i = 0; i < 38; i++) {
    dummy.position.set((i / 37 - 0.5) * L, -1.1, 0);
    dummy.rotation.set(0, 0, 0); dummy.scale.set(1, i % 6 === 0 ? 1.8 : 1, 1); dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  g.add(ticks);
  // enrolment node
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), ember(3));
  node.position.set(-0.5 * L, 0, 0);
  g.add(node);

  g.rotation.x = 0.12;
  g.scale.setScalar(0.78); // the cohort is wide: keep it inside the free half of the frame
  return {
    group: g,
    update(t) {
      U.uTime.value = t;
      U.uHeight.value = innerHeight * Math.min(devicePixelRatio || 1, 1.75);
      g.rotation.y = Math.sin(t * 0.22) * 0.5 - 0.25;
    },
  };
}

/* 4 ── Commerce microservices: a hub, six services, load-balanced traffic */
function microservices(M) {
  const g = new THREE.Group();
  const hub = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.85, 0.85, 5, 0.08), M.ceramic);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.9), ember(2.6));
  hub.add(slot);
  g.add(hub);
  const sats = [];
  const beads = [];
  const lineMat = new THREE.MeshPhysicalMaterial({ color: '#6c6f78', metalness: 1, roughness: 0.35 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const p = new THREE.Vector3(Math.cos(a) * 1.65, (i % 2 ? 0.35 : -0.35), Math.sin(a) * 1.65);
    const s = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.46, 0.46, 4, 0.06), i % 3 === 0 ? M.titanium : M.ceramic);
    s.position.copy(p);
    g.add(s, tube(new THREE.Vector3(0, 0, 0), p, 0.014, lineMat));
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), ember(3));
    g.add(bead);
    sats.push({ s, p, a });
    beads.push({ bead, p, off: i * 0.37 });
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.012, 6, 140), M.titanium);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  g.rotation.x = 0.28;
  return {
    group: g,
    update(t) {
      sats.forEach((o, i) => { o.s.position.y = o.p.y + Math.sin(t * 0.8 + i) * 0.05; o.s.rotation.y = t * 0.3 + i; });
      beads.forEach((b) => {
        const u = ((t * 0.55 + b.off) % 1);
        const dirOut = Math.floor(t * 0.55 + b.off) % 2 === 0;
        b.bead.position.copy(b.p).multiplyScalar(dirOut ? u : 1 - u);
      });
      g.rotation.y = t * 0.16;
    },
  };
}

/* 5 ── Network cell analyser: a lattice mast broadcasting expanding signal rings */
function cellTower(M) {
  const g = new THREE.Group();
  const H = 2.5;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    g.add(tube(new THREE.Vector3(Math.cos(a) * 0.48, -H / 2, Math.sin(a) * 0.48), new THREE.Vector3(Math.cos(a) * 0.09, H / 2, Math.sin(a) * 0.09), 0.026, M.titanium));
  }
  for (let l = 0; l < 7; l++) {
    const u = l / 6;
    const rr = 0.48 + (0.09 - 0.48) * u;
    const y = -H / 2 + H * u;
    const sq = new THREE.Mesh(new THREE.TorusGeometry(rr * 1.38, 0.012, 4, 4), M.graphite);
    sq.rotation.set(Math.PI / 2, 0, Math.PI / 4);
    sq.position.y = y;
    g.add(sq);
    if (l < 6) {
      const u2 = (l + 1) / 6;
      const r2 = 0.48 + (0.09 - 0.48) * u2;
      const y2 = -H / 2 + H * u2;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + Math.PI / 4;
        const a2 = ((i + 1) / 4) * TAU + Math.PI / 4;
        const p1 = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
        const p2 = new THREE.Vector3(Math.cos(a2) * r2, y2, Math.sin(a2) * r2);
        g.add(tube(p1, p2, 0.008, M.graphite));
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    const panel = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.62, 0.06, 3, 0.015), M.bone);
    panel.position.set(Math.cos(a) * 0.2, H / 2 + 0.15, Math.sin(a) * 0.2);
    panel.rotation.y = -a + Math.PI / 2;
    g.add(panel);
  }
  const ripples = [];
  for (let i = 0; i < 4; i++) {
    const U = { uFade: { value: 0 }, uColor: { value: (i % 2 ? ICE : SIGNAL).clone() } };
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1.0, 96, 1),
      glowMaterial(`c = uColor * uFade * 2.2;`, U),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = H / 2 + 0.15;
    g.add(m);
    ripples.push({ m, U, off: i / 4 });
  }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.12, 6), M.graphite);
  base.position.y = -H / 2 - 0.06;
  g.add(base);
  g.position.y = -0.1;
  return {
    group: g,
    update(t) {
      ripples.forEach((r) => {
        const u = (t * 0.22 + r.off) % 1;
        r.m.scale.setScalar(0.25 + u * 3.6);
        r.U.uFade.value = Math.pow(1 - u, 2) * Math.min(1, u * 8);
      });
      g.rotation.y = t * 0.12;
    },
  };
}

/* 6 ── Supermarket graph: a weighted graph with its shortest path lit */
function graphArt(M) {
  const g = new THREE.Group();
  const r = rnd(5);
  const N = 18;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const u = r() * 2 - 1; const a = r() * TAU; const rad = 0.7 + r() * 0.8;
    const s = Math.sqrt(1 - u * u);
    nodes.push(new THREE.Vector3(s * Math.cos(a) * rad * 1.15, u * rad * 0.9, s * Math.sin(a) * rad * 1.15));
  }
  const adj = nodes.map(() => []);
  const edges = [];
  nodes.forEach((p, i) => {
    const near = nodes.map((q, j) => ({ j, d: p.distanceTo(q) })).filter((o) => o.j !== i).sort((a, b) => a.d - b.d).slice(0, 3);
    near.forEach(({ j, d }) => {
      if (!adj[i].includes(j)) { adj[i].push(j); adj[j].push(i); edges.push([i, j, d]); }
    });
  });
  // BFS shortest path between the two farthest nodes
  let A = 0; let B = 1; let best = 0;
  nodes.forEach((p, i) => nodes.forEach((q, j) => { const d = p.distanceTo(q); if (d > best) { best = d; A = i; B = j; } }));
  const prev = new Array(N).fill(-1); const seen = new Set([A]); const qq = [A];
  while (qq.length) { const u = qq.shift(); for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); prev[v] = u; qq.push(v); } }
  const path = []; for (let v = B; v !== -1; v = prev[v]) path.push(v); path.reverse();
  const onPath = new Set();
  for (let i = 0; i < path.length - 1; i++) onPath.add([path[i], path[i + 1]].sort().join('-'));

  const edgeMat = new THREE.MeshPhysicalMaterial({ color: '#7c7f88', metalness: 1, roughness: 0.4 });
  edges.forEach(([i, j]) => {
    const hot = onPath.has([i, j].sort().join('-'));
    g.add(tube(nodes[i], nodes[j], hot ? 0.026 : 0.01, hot ? ember(2.8) : edgeMat));
  });
  nodes.forEach((p, i) => {
    const hot = path.includes(i);
    const s = new THREE.Mesh(new THREE.SphereGeometry(hot ? 0.1 : 0.062, 20, 20), hot ? ember(3) : M.titanium);
    s.position.copy(p);
    g.add(s);
  });
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  g.add(bead);
  const pathPts = path.map((i) => nodes[i]);
  const curve = new THREE.CatmullRomCurve3(pathPts, false, 'catmullrom', 0.2);
  return {
    group: g,
    update(t) {
      bead.position.copy(curve.getPointAt((t * 0.12) % 1));
      g.rotation.y = t * 0.13;
      g.rotation.x = Math.sin(t * 0.2) * 0.15;
    },
  };
}

/* ── the gallery ── */
export function buildGallery(M, quality) {
  const group = new THREE.Group();
  const makers = [loopGuard, dermSense, oulad, microservices, cellTower, graphArt];
  const items = makers.map((mk, j) => {
    const it = mk(M);
    const [x, y, z] = galleryPos(j);
    const holder = new THREE.Group();
    holder.position.set(x, y, z);
    holder.scale.setScalar(1.55);
    holder.add(it.group);
    // a pool of molten light on the arena floor under each artifact (ties it to the engine's core glow)
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 64),
      glowMaterial(`vec2 q=(vUv-0.5)*2.0; float r=length(q); float a=pow(max(0.0,1.0-r),2.4); float ring=smoothstep(0.72,0.74,r)*(1.0-smoothstep(0.74,0.77,r)); c=uColor*(a*0.17+ring*0.22);`, { uColor: { value: SIGNAL.clone() } }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = -2.15;
    holder.add(pool);
    holder.rotation.y = 0; // faces centre naturally; camera approaches from outside
    group.add(holder);
    return { ...it, holder };
  });

  // arena floor: fine tick circle + faint glow ring
  const tickN = 360;
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.02, 0.18), M.titanium, tickN);
  for (let i = 0; i < tickN; i++) {
    const a = (i / tickN) * TAU;
    dummy.position.set(Math.sin(a) * (GALLERY_R + 0), GALLERY_Y - 3.3, Math.cos(a) * (GALLERY_R + 0) - GALLERY_R);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1, 1, i % 5 === 0 ? 2 : 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  group.add(ticks);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(GALLERY_R - 0.2, GALLERY_R + 0.2, 200, 1),
    glowMaterial('vec2 q=(vUv-0.5)*2.0; c = uColor*0.05;', { uColor: { value: SIGNAL.clone() } }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, GALLERY_Y - 3.3, -GALLERY_R);
  group.add(ring);

  // dust
  const count = quality === 'low' ? 120 : 380;
  const pos = new Float32Array(count * 3);
  const r = rnd(99);
  for (let i = 0; i < count; i++) {
    const a = r() * TAU; const rad = 3 + r() * 16;
    pos[i * 3] = Math.cos(a) * rad; pos[i * 3 + 1] = GALLERY_Y + (r() - 0.35) * 9; pos[i * 3 + 2] = Math.sin(a) * rad - GALLERY_R;
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#b8bcc8', size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false }));
  group.add(dust);

  return {
    group,
    update(t, pointer) {
      if (!group.visible) return;
      items.forEach((it, j) => {
        it.update(t + j * 3.1);
        it.holder.rotation.y = pointer.x * 0.35;
        it.holder.rotation.x = -pointer.y * 0.18;
      });
      dust.rotation.y = t * 0.01;
    },
  };
}
