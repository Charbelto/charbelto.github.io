import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Pip - the interactive "agent" character (modelled in Blender: assets/blender/build_agent.py → public/models/agent.glb).
 * It runs the same loop as every agent I build: PERCEIVE (it watches the cursor) → DECIDE (it turns to look,
 * blinks, banks into the movement) → ACT (click it to make it wave and hop).
 */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

export async function loadAgent(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const model = gltf.scene;
  const n = (name) => model.getObjectByName(name);
  const head = n('head'); const eyeL = n('eye_L'); const eyeR = n('eye_R');
  const armL = n('arm_L'); const armR = n('arm_R'); const antenna = n('antenna'); const jet = n('jet');

  model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material) o.material.envMapIntensity = 1.2; } });

  const rig = new THREE.Group();
  rig.add(model);
  model.position.y = -1.45; // centre the character vertically around the origin
  const SCALE = 1.35;
  rig.scale.setScalar(0.0001);
  rig.visible = false;

  const base = {
    eyeLy: eyeL.position.y, eyeRy: eyeR.position.y, eyeLx: eyeL.position.x, eyeRx: eyeR.position.x,
    eyeLsy: eyeL.scale.y, eyeRsy: eyeR.scale.y,
  };
  let blink = 0; let nextBlink = 2.2; let waveT = 0; let hopT = 0;
  let yaw = 0; let pitch = 0;
  const jetMat = jet.children[0]?.material?.isMaterial ? jet.children[0].material : null;

  function wave() { waveT = 1.7; hopT = 1; }

  /** amount 0..1 pops the character in/out; pointer is the smoothed NDC cursor */
  function update({ time, dt, amount, pointer, still }) {
    const a = clamp(amount, 0, 1);
    rig.visible = a > 0.01;
    if (!rig.visible) return;
    rig.scale.setScalar(Math.max(0.0001, easeOutBack(a) * SCALE));
    if (still) { head.rotation.set(0, 0, 0); armL.rotation.z = -0.12; armR.rotation.z = 0.12; return; }

    // perceive → decide: ease the head toward the cursor (limited range, like a neck)
    const ty = clamp(pointer.x * 0.7, -0.55, 0.55); const tp = clamp(-pointer.y * 0.45, -0.35, 0.3);
    const k = 1 - Math.exp(-dt * 7);
    yaw = lerp(yaw, ty, k); pitch = lerp(pitch, tp, k);
    head.rotation.y = yaw; head.rotation.x = pitch;
    head.rotation.z = Math.sin(time * 1.4) * 0.03;
    // pupils: eyes slide a touch toward the cursor
    eyeL.position.x = base.eyeLx + pointer.x * 0.05; eyeR.position.x = base.eyeRx + pointer.x * 0.05;
    eyeL.position.y = base.eyeLy + pointer.y * 0.03; eyeR.position.y = base.eyeRy + pointer.y * 0.03;

    // blink
    nextBlink -= dt;
    if (nextBlink <= 0) { blink = 0.14; nextBlink = 2.4 + Math.random() * 3; }
    blink = Math.max(0, blink - dt);
    const lid = blink > 0 ? 0.08 : 1;
    eyeL.scale.y = lerp(eyeL.scale.y, base.eyeLsy * lid, 0.6); eyeR.scale.y = lerp(eyeR.scale.y, base.eyeRsy * lid, 0.6);

    // act: wave + hop on click
    waveT = Math.max(0, waveT - dt); hopT = Math.max(0, hopT - dt * 1.4);
    const waving = waveT > 0;
    const waveAmt = clamp(waveT / 0.35, 0, 1) * clamp((1.7 - waveT) / 0.2, 0, 1); // ease in/out of the raised pose
    armR.rotation.z = lerp(0.12 + Math.sin(time * 1.3) * 0.06, 2.55 + Math.sin(time * 15) * 0.32, waving ? Math.min(1, waveAmt + 0.0001) : 0);
    armL.rotation.z = -0.12 - Math.sin(time * 1.3 + 1) * 0.06 - (waving ? 0.18 : 0);
    const hop = Math.sin((1 - hopT) * Math.PI) * 0.55 * (hopT > 0 ? 1 : 0);

    // hover + bank into the cursor
    rig.position.y = Math.sin(time * 1.6) * 0.1 + hop;
    rig.rotation.z = lerp(rig.rotation.z, -pointer.x * 0.07, k);
    rig.rotation.y = lerp(rig.rotation.y, pointer.x * 0.25, k);
    antenna.rotation.z = Math.sin(time * 3.2) * 0.14; antenna.rotation.x = Math.cos(time * 2.4) * 0.1;
    if (jet) jet.scale.y = 1 + Math.sin(time * 9) * 0.08;
    if (jetMat) jetMat.emissiveIntensity = 1 + Math.sin(time * 9) * 0.3;
  }

  return { rig, update, wave };
}
