import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/**
 * Chapter props: Blender-authored models (assets/blender/build_props.py → public/models/props/*.glb).
 *
 * Each prop is a root with named PART GROUPS. Scroll drives an ASSEMBLY (weight 0 → 1): parts fly in from outside the
 * object, staggered, and tumble into place; scrolling back disassembles them. Once assembled, parts animate by the
 * prefix of their name, so every motion has a reason (a conveyor chain rolls, gears mesh, a scan bar scans, a lever
 * trips, signal rings pulse):
 *   spin_ turntable · roll_/rolln_ rotate in the screen plane · bob_ float · pulse_ breathe · swing_ pivot back and
 *   forth · slide_ sweep up and down · orbit_ circle the object
 */
const TARGET = 5.1; // every prop is scaled so its bounding sphere has this radius
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };

const AX_Y = new THREE.Vector3(0, 1, 0);
const AX_Z = new THREE.Vector3(0, 0, 1);
const qa = new THREE.Quaternion();
const v1 = new THREE.Vector3();

export function createProps(scene, baseUrl) {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${baseUrl}draco/`);
  loader.setDRACOLoader(draco);

  const entries = new Map(); // name -> entry
  const pending = new Map(); // name -> promise

  function prepare(name, gltf) {
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = TARGET / Math.max(0.001, size.length() / 2);
    const holder = new THREE.Group();
    holder.add(model);
    holder.scale.setScalar(s);
    holder.position.copy(center).multiplyScalar(-s);
    const wrap = new THREE.Group(); // pointer tilt lives here, around the prop's own centre
    wrap.add(holder);
    wrap.visible = false;

    const root = model.children[0] || model;
    const radius = size.length() / 2;
    const parts = root.children.map((node) => {
      node.traverse((o) => {
        if (o.isMesh) {
          o.frustumCulled = false;
          if (o.material?.transparent) o.material.depthWrite = false;
        }
      });
      const rest = { pos: node.position.clone(), quat: node.quaternion.clone(), scale: node.scale.clone() };
      const dir = rest.pos.clone();
      if (dir.length() < 0.2) dir.set(hash(node.name + 'x') - 0.5, 0.4 + hash(node.name + 'y'), hash(node.name + 'z') - 0.5);
      dir.normalize();
      const n = node.name || '';
      const type = ['spin', 'rolln', 'roll', 'bob', 'pulse', 'swing', 'slide', 'orbit'].find((p) => n.startsWith(p + '_')) || null;
      return {
        node, rest, dir, type, phase: hash(n) * Math.PI * 2,
        delay: hash(n + 'd') * 0.55, // assembly stagger
        jit: new THREE.Vector3(hash(n + 'a') - 0.5, hash(n + 'b') - 0.5, hash(n + 'c') - 0.5).multiplyScalar(radius * 0.9),
        spinQ: new THREE.Quaternion().setFromEuler(new THREE.Euler((hash(n + 'p') - 0.5) * 5, (hash(n + 'q') - 0.5) * 5, (hash(n + 'r') - 0.5) * 5)),
      };
    });
    const entry = { name, wrap, parts, radius, unit: radius / 5.5 };
    scene.add(wrap);
    entries.set(name, entry);
    return entry;
  }

  function ensure(name) {
    if (!name || entries.has(name)) return Promise.resolve(entries.get(name));
    if (pending.has(name)) return pending.get(name);
    const p = loader.loadAsync(`${baseUrl}models/props/${name}.glb`)
      .then((g) => prepare(name, g))
      .catch((e) => { console.warn('[props] failed to load', name, e); return null; })
      .finally(() => pending.delete(name));
    pending.set(name, p);
    return p;
  }

  /** weights: Map<name, 0..1>. pointer: smoothed NDC cursor. */
  function update({ time, weights, pointer, still }) {
    for (const entry of entries.values()) {
      const w = weights.get(entry.name) || 0;
      entry.wrap.visible = w > 0.003;
      if (!entry.wrap.visible) continue;
      const p = smooth(clamp(w, 0, 1));
      entry.wrap.rotation.y = still ? 0 : pointer.x * 0.22;
      entry.wrap.rotation.x = still ? 0 : -pointer.y * 0.1;
      const u = entry.unit;
      for (const part of entry.parts) {
        const n = part.node;
        // assembly: staggered per part so the object builds up instead of popping in
        const pp = smooth(clamp((p - part.delay * 0.6) / (1 - part.delay * 0.6), 0, 1));
        const k = 1 - pp;
        n.position.copy(part.rest.pos).addScaledVector(part.dir, entry.radius * 1.3 * k).addScaledVector(part.jit, k);
        n.quaternion.copy(part.spinQ).slerp(part.rest.quat, pp);
        n.scale.copy(part.rest.scale).multiplyScalar(Math.max(0.0001, pp));
        if (still || pp < 0.98 || !part.type) continue;
        const t = time;
        switch (part.type) {
          case 'spin': n.quaternion.premultiply(qa.setFromAxisAngle(AX_Y, t * 0.7 + part.phase)); break;
          case 'roll': n.quaternion.premultiply(qa.setFromAxisAngle(AX_Z, t * 0.45)); break;
          case 'rolln': n.quaternion.premultiply(qa.setFromAxisAngle(AX_Z, -t * 0.6)); break;
          case 'bob': n.position.y += Math.sin(t * 1.5 + part.phase) * u * 0.55; break;
          case 'pulse': n.scale.multiplyScalar(1 + Math.sin(t * 2.6 + part.phase) * 0.1); break;
          case 'swing': n.quaternion.premultiply(qa.setFromAxisAngle(AX_Z, Math.sin(t * 1.3 + part.phase) * 0.55)); break;
          case 'slide': n.position.y += Math.sin(t * 0.9 + part.phase) * u * 3.4; break;
          case 'orbit': {
            const a = t * 0.38 + part.phase;
            qa.setFromAxisAngle(AX_Y, a);
            n.position.applyQuaternion(qa);
            n.quaternion.premultiply(qa);
            n.position.y += Math.sin(t * 1.1 + part.phase) * u * 0.5;
            v1.set(0, 0, 0);
            break;
          }
          default: break;
        }
      }
    }
  }

  return { ensure, update, entry: (n) => entries.get(n), has: (n) => entries.has(n), get names() { return [...entries.keys()]; } };
}
