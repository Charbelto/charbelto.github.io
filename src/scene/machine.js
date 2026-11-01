import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const dummy = new THREE.Object3D();

/* ───────────────────────── glow material (additive, premultiplied-safe) ───────────────────────── */
const GLOW_HEAD = /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;

export function glowMaterial(fragBody, uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: GLOW_HEAD,
    fragmentShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
${Object.keys(uniforms).map((k) => `uniform ${typeof uniforms[k].value === 'number' ? 'float' : uniforms[k].value.isColor ? 'vec3' : 'vec2'} ${k};`).join('\n')}
void main(){ vec3 c = vec3(0.0); ${fragBody}
  gl_FragColor = vec4(c, clamp(max(c.r,max(c.g,c.b)),0.0,1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
  });
}

/* ───────────────────────── palette & materials ───────────────────────── */
export const SIGNAL = new THREE.Color('#ff5a1f'); // molten signal
export const ICE = new THREE.Color('#8fd0ff'); // cool counter-pulse

export function makeMaterials() {
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: '#0c0d11', roughness: 0.26, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.15,
  });
  const titanium = new THREE.MeshPhysicalMaterial({
    color: '#9a9ca4', roughness: 0.34, metalness: 1, anisotropy: 0.85, anisotropyRotation: 0.4, envMapIntensity: 1.25,
  });
  const graphite = new THREE.MeshPhysicalMaterial({
    color: '#202228', roughness: 0.5, metalness: 0.85, envMapIntensity: 1,
  });
  const bone = new THREE.MeshPhysicalMaterial({
    color: '#cfc7b8', roughness: 0.42, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.35,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#0a0b0e', roughness: 0.04, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.42, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide,
  });
  const ember = new THREE.MeshBasicMaterial({ color: SIGNAL.clone().multiplyScalar(2.2), toneMapped: true });
  return { ceramic, titanium, graphite, bone, glass, ember };
}

/* ───────────────────────── ring construction ───────────────────────── */
function arcSegment(rIn, rOut, a0, a1, h, bevel) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, a0, a1, false);
  s.absarc(0, 0, rIn, a1, a0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2,
    curveSegments: Math.max(3, Math.ceil((a1 - a0) * 9)),
  });
  g.translate(0, 0, -h / 2);
  return g;
}

function instanced(geo, mat, count, place) {
  const m = new THREE.InstancedMesh(geo, mat, count);
  for (let i = 0; i < count; i++) {
    dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
    place(i, dummy);
    dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix);
  }
  m.instanceMatrix.needsUpdate = true;
  return m;
}

/**
 * One gimbal ring: segmented ceramic body with proud titanium plates, bezel ticks,
 * radial face slats, bolts and a light channel carrying travelling pulses.
 */
function buildRing(cfg, mats, quality) {
  const { rOut, width, h, segs, color, speed, density } = cfg;
  const rIn = rOut - width;
  const step = TAU / segs;
  const gap = 0.018;
  const ceramic = [];
  const metal = [];
  for (let i = 0; i < segs; i++) {
    const a0 = i * step + gap / 2;
    const a1 = (i + 1) * step - gap / 2;
    if (i % 4 === 1) metal.push(arcSegment(rIn + width * 0.1, rOut - width * 0.1, a0, a1, h * 1.22, 0.012));
    else ceramic.push(arcSegment(rIn, rOut, a0, a1, h, 0.014));
  }
  const group = new THREE.Group();
  const body = new THREE.Mesh(mergeGeometries(ceramic), mats.ceramic);
  const plates = new THREE.Mesh(mergeGeometries(metal), mats.titanium);
  group.add(body, plates);

  // inner lip – a thin machined titanium collar
  const lip = new THREE.Mesh(arcSegment(rIn - 0.045, rIn + 0.004, 0.0001, TAU - 0.0001, h * 0.62, 0.008), mats.titanium);
  group.add(lip);

  // bezel ticks on the outer rim
  const tickCount = quality.ticks;
  const ticks = instanced(new THREE.BoxGeometry(1, 0.011, h * 0.34), mats.graphite, tickCount, (i, d) => {
    const major = i % 6 === 0;
    const len = major ? 0.12 : 0.055;
    const a = (i / tickCount) * TAU;
    d.position.set(Math.cos(a) * (rOut + len / 2 - 0.004), Math.sin(a) * (rOut + len / 2 - 0.004), 0);
    d.rotation.z = a;
    d.scale.set(len, 1, 1);
  });
  group.add(ticks);

  // radial slats on both faces
  const slatCount = Math.round(segs * 3);
  const slats = instanced(new THREE.BoxGeometry(width * 0.62, 0.02, 0.016), mats.titanium, slatCount * 2, (i, d) => {
    const side = i < slatCount ? 1 : -1;
    const k = i % slatCount;
    const a = ((k + 0.5) / slatCount) * TAU;
    const r = rIn + width * 0.5;
    d.position.set(Math.cos(a) * r, Math.sin(a) * r, side * (h / 2 + 0.002 + (k % 4 === 1 ? h * 0.11 : 0)));
    d.rotation.z = a;
  });
  group.add(slats);

  // bolts
  const boltCount = Math.round(segs * 1.5);
  const bolts = instanced(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 10), mats.titanium, boltCount * 2, (i, d) => {
    const side = i < boltCount ? 1 : -1;
    const k = i % boltCount;
    const a = ((k + 0.25) / boltCount) * TAU;
    const r = rIn + width * 0.14;
    d.position.set(Math.cos(a) * r, Math.sin(a) * r, side * (h / 2 + 0.012));
    d.rotation.x = Math.PI / 2;
  });
  group.add(bolts);

  // light channels
  const pulse = {
    uTime: { value: 0 }, uColor: { value: color.clone() }, uSpeed: { value: speed }, uDensity: { value: density },
    uGain: { value: 1 }, uFocus: { value: 0 },
  };
  const mat = glowMaterial(
    `float p = fract(vUv.x*uDensity - uTime*uSpeed);
     float head = exp(-p*13.0)*smoothstep(0.0,0.012,p);
     c = uColor*(0.085 + head*2.6)*uGain*(0.55 + 1.1*uFocus);`,
    pulse,
  );
  const haloMat = glowMaterial(
    `float p = fract(vUv.x*uDensity - uTime*uSpeed);
     float head = exp(-p*7.0)*smoothstep(0.0,0.02,p);
     c = uColor*(0.012 + head*0.34)*uGain*(0.6 + 1.2*uFocus);`,
    pulse,
  );
  const rMid = rIn + width * 0.5;
  for (const side of [1, -1]) {
    const z = side * (h / 2 + 0.028);
    const t = new THREE.Mesh(new THREE.TorusGeometry(rMid, 0.0105, 6, quality.torus), mat);
    t.position.z = z;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(rMid, 0.05, 3, quality.torus), haloMat);
    halo.position.z = z;
    group.add(t, halo);
  }

  return { group, pulse, rIn, rOut, h };
}

/* ───────────────────────── the Engine ───────────────────────── */
export function buildEngine(mats, quality) {
  const root = new THREE.Group(); // global orientation (axis flips vertical in the exploded GREAT view)
  const cfgs = [
    { rOut: 5.1, width: 0.62, h: 0.5, segs: 28, color: SIGNAL, speed: 0.07, density: 3, spin: 0.045, axis: 'x', tilt: 0.0 },
    { rOut: 4.12, width: 0.55, h: 0.46, segs: 24, color: ICE, speed: -0.09, density: 4, spin: -0.07, axis: 'y', tilt: 0.52 },
    { rOut: 3.27, width: 0.5, h: 0.42, segs: 20, color: SIGNAL, speed: 0.11, density: 5, spin: 0.1, axis: 'x', tilt: -0.62 },
    { rOut: 2.5, width: 0.44, h: 0.38, segs: 16, color: ICE, speed: -0.13, density: 4, spin: -0.14, axis: 'y', tilt: 0.7 },
    { rOut: 1.86, width: 0.38, h: 0.34, segs: 12, color: SIGNAL, speed: 0.16, density: 3, spin: 0.2, axis: 'x', tilt: -0.55 },
  ];

  const rings = [];
  let parent = root;
  let prev = null;
  cfgs.forEach((cfg, i) => {
    const pivot = new THREE.Group(); // carries tilt (about the pin axis)
    parent.add(pivot);
    const ring = buildRing(cfg, mats, quality);
    const spinner = new THREE.Group(); // spin about the ring's own axis
    spinner.add(ring.group);
    pivot.add(spinner);

    // gimbal pins connect the parent ring to this ring along the shared tilt axis
    if (prev) {
      const L = prev.rIn - cfg.rOut + 0.25;
      const pinGeo = new THREE.CylinderGeometry(0.075, 0.075, L, 14);
      const collar = new THREE.CylinderGeometry(0.13, 0.13, 0.07, 18);
      for (const sgn of [1, -1]) {
        const pin = new THREE.Mesh(pinGeo, mats.titanium);
        const c1 = new THREE.Mesh(collar, mats.graphite);
        const mid = sgn * (cfg.rOut + L / 2 - 0.1);
        const holder = new THREE.Group();
        holder.add(pin, c1);
        pin.position.y = mid;
        c1.position.y = sgn * (prev.rIn - 0.01);
        if (cfg.axis === 'x') holder.rotation.z = -Math.PI / 2; // pins along x
        // pins live on the parent's spinner so they turn with it
        prev.spinner.add(holder);
      }
    }
    rings.push({ cfg, pivot, spinner, pulse: ring.pulse, h: ring.h, rIn: ring.rIn, rOut: ring.rOut });
    // children nest inside the spinner so they inherit spin
    parent = spinner;
    prev = { rIn: ring.rIn, spinner };
  });

  // child pivots were added to `parent` (previous spinner) – fine – but the first pivot is under root.

  /* core ------------------------------------------------------------------ */
  const core = new THREE.Group();
  const innerSpinner = rings[rings.length - 1].spinner;
  innerSpinner.add(core);

  const prof = [
    [0.0, -1.25], [0.07, -1.18], [0.15, -0.95], [0.34, -0.6], [0.58, -0.28], [0.7, -0.08], [0.72, 0.0],
    [0.7, 0.08], [0.58, 0.28], [0.34, 0.6], [0.15, 0.95], [0.07, 1.18], [0.0, 1.25],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const lathe = new THREE.LatheGeometry(prof, 56);
  lathe.rotateX(Math.PI / 2);
  const shell = new THREE.Mesh(lathe, mats.glass);
  shell.renderOrder = 3;
  core.add(shell);

  const coreU = { uTime: { value: 0 }, uGain: { value: 1 }, uColor: { value: SIGNAL.clone() } };
  const innerGeo = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p.x * 0.58, p.y * 0.8)), 40);
  innerGeo.rotateX(Math.PI / 2);
  const inner = new THREE.Mesh(
    innerGeo,
    glowMaterial(
      `float band = 0.5+0.5*sin(vUv.y*46.0 - uTime*1.8);
       float fres = pow(1.0-abs(dot(normalize(vN),normalize(vV))),1.6);
       vec3 hot = mix(uColor, vec3(1.0,0.86,0.62), smoothstep(0.35,1.0,band));
       c = hot*(0.55+0.9*band+0.9*fres)*uGain;`,
      coreU,
    ),
  );
  core.add(inner);

  // equatorial disc of fine concentric lines
  const discU = { uTime: { value: 0 }, uGain: { value: 1 }, uColor: { value: SIGNAL.clone() } };
  // RingGeometry uv is planar, so the radius is derived from uv
  const disc = new THREE.Mesh(new THREE.RingGeometry(0.76, 1.55, 128, 1), null);
  disc.material = glowMaterial(
    `vec2 q = (vUv - 0.5) * 2.0; float r = length(q);
     float k = smoothstep(0.49, 0.5, r) * (1.0 - smoothstep(0.98, 1.0, r));
     float rings = 0.5 + 0.5 * sin(r * 160.0 - uTime * 0.6);
     rings = smoothstep(0.82, 1.0, rings);
     float fade = pow(1.0 - clamp((r - 0.49) / 0.51, 0.0, 1.0), 1.8);
     float sweep = pow(0.5 + 0.5 * sin(atan(q.y, q.x) * 3.0 - uTime * 0.9), 6.0);
     c = uColor * (rings * 0.75 + sweep * 0.5 + 0.06) * fade * k * uGain;`,
    discU,
  );
  core.add(disc);

  // iris fins around the core
  const finCount = 36;
  const fins = instanced(new THREE.BoxGeometry(0.34, 0.012, 0.22), mats.titanium, finCount, (i, d) => {
    const a = (i / finCount) * TAU;
    d.position.set(Math.cos(a) * 1.72, Math.sin(a) * 1.72, 0);
    d.rotation.z = a;
    d.rotation.x = 0.55;
  });
  core.add(fins);

  // core caps – machined spindle ends
  for (const s of [1, -1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.5, 20), mats.titanium);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = s * 1.4;
    core.add(cap);
  }

  /* shards band (retrieval chunks orbiting the machine) -------------------- */
  const shardCount = quality.shards;
  const shards = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.05, 0.62), mats.titanium, shardCount);
  const col = new THREE.Color();
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < shardCount; i++) {
    const a = rnd() * TAU;
    const rad = 6.3 + Math.pow(rnd(), 1.5) * 4.6;
    const y = (rnd() - 0.5) * (0.5 + (rad - 6.3) * 0.22);
    dummy.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
    // plates lie roughly in the belt plane with a little tumble, like chips in a slow orbit
    dummy.rotation.set((rnd() - 0.5) * 1.1, rnd() * TAU, (rnd() - 0.5) * 1.1);
    const s = 0.05 + Math.pow(rnd(), 3.4) * 0.3;
    dummy.scale.set(s * (0.7 + rnd()), s * 0.6, s * (0.6 + rnd() * 0.8));
    dummy.updateMatrix();
    shards.setMatrixAt(i, dummy.matrix);
    const warm = rnd() < 0.045;
    col.set(warm ? '#ff6a2e' : rnd() < 0.4 ? '#1d1f25' : '#8e9098');
    if (warm) col.multiplyScalar(0.9);
    shards.setColorAt(i, col);
  }
  shards.instanceMatrix.needsUpdate = true;
  shards.instanceColor.needsUpdate = true;
  const shardMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.9, envMapIntensity: 1.2 });
  shards.material = shardMat;
  const shardGroup = new THREE.Group();
  shardGroup.add(shards);
  root.add(shardGroup);

  return { root, rings, core, coreU, discU, shardGroup, innerSpinner };
}
