/**
 * Camera + scene-state keyframes. Each `[data-kf="name"]` element in the page owns one keyframe;
 * the director interpolates between them as the page scrolls.
 *
 *  c        orbit centre (world)            d    orbit distance      az/el  orbit angles
 *  fov      lens                            sx   lateral framing: fraction of half-width the subject sits right of centre
 *  flat     0 gimbal → 1 coplanar stack     explode  ring separation along the (vertical) axis
 *  vert     0 axis toward viewer → 1 axis vertical
 *  shards   shard-belt radius scale         core glow     focus  ring emphasised (-1 none)
 *  dim      0..1 darkening the page applies behind dense reading content
 */
export const GALLERY_Y = -70;
export const GALLERY_R = 13;
export const galleryAngle = (j) => (j - 2.5) * 0.6;
export const galleryPos = (j) => {
  const a = galleryAngle(j);
  return [Math.sin(a) * GALLERY_R, GALLERY_Y, Math.cos(a) * GALLERY_R - GALLERY_R];
};

const BASE = {
  cx: 0, cy: 0, cz: 0, d: 15, az: 0.4, el: 0.15, fov: 34, sx: 0, pd: 1, // pd: extra distance on portrait screens
  flat: 0, explode: 0, vert: 0, shards: 1, core: 1, focus: -1, dim: 0, yaw: 0,
};
const kf = (o) => ({ ...BASE, ...o });

const work = (j, sx) => {
  const [x, y, z] = galleryPos(j);
  return kf({ cx: x, cy: y + 0.1, cz: z, d: 8.6, az: galleryAngle(j) + 0.35, el: 0.14, fov: 36, sx: sx * 0.72, core: 0.6, shards: 1.2 });
};

export const KF = {
  hero: kf({ d: 11, az: 0.62, el: 0.14, fov: 34, sx: 0.9, pd: 1.64, core: 0.95, yaw: -0.15 }),
  profile: kf({ d: 12.5, az: -0.6, el: 0.2, fov: 34, sx: 0.58, core: 0.9, yaw: 0.2 }),
  dive: kf({ d: 6.6, az: 0.0, el: 0.03, fov: 62, sx: 0, core: 1.35 }),

  cap1: kf({ d: 13.5, az: 0.95, el: 0.3, fov: 36, sx: -0.62, focus: 0, core: 1.0 }),
  cap2: kf({ d: 14, az: -0.75, el: 0.12, fov: 36, sx: 0.62, focus: 1, shards: 0.5, core: 1.1 }),
  cap3: kf({ d: 12.2, az: 1.35, el: 0.22, fov: 36, sx: -0.6, focus: 2, core: 1.15 }),
  cap4: kf({ d: 12.5, az: -0.9, el: 0.36, fov: 36, sx: 0.6, focus: 3, core: 1.2 }),
  cap5: kf({ d: 10.5, az: 0.35, el: 0.12, fov: 38, sx: -0.6, focus: 4, core: 1.6 }),

  great1: kf({ d: 19, az: 0.62, el: 0.2, fov: 34, sx: 0.5, flat: 1, explode: 1, vert: 1, core: 1.2, focus: -1 }),
  great2: kf({ cy: 3.2, d: 7.2, az: -0.55, el: 0.26, fov: 38, sx: -0.5, flat: 1, explode: 1, vert: 1, core: 1.3, focus: 3 }),
  great3: kf({ cy: 1.6, d: 13.5, az: 0.25, el: 0.55, fov: 34, sx: 0.5, flat: 1, explode: 0.55, vert: 1, core: 1.7, focus: 1 }),

  w1: work(0, 0.5),
  w2: work(1, -0.5),
  w3: work(2, 0.5),
  w4: work(3, -0.5),
  w5: work(4, 0.5),
  w6: work(5, -0.5),

  // Experience: the machine stays on the left and orbits; newest role = innermost ring (focus), oldest = outer
  xp0: kf({ d: 17, az: 0.9, el: 0.16, fov: 34, sx: -0.55, core: 0.9, dim: 0.12, yaw: 0.3 }),
  xp1: kf({ d: 10.5, az: 0.35, el: 0.1, fov: 36, sx: -0.55, focus: 4, core: 1.5, dim: 0.12 }),
  xp2: kf({ d: 11, az: -0.5, el: 0.28, fov: 36, sx: -0.55, focus: 3, core: 1.2, dim: 0.12 }),
  xp3: kf({ d: 12, az: 0.75, el: 0.3, fov: 36, sx: -0.55, focus: 2, core: 1.1, dim: 0.12 }),
  xp4: kf({ d: 13, az: -1.0, el: 0.12, fov: 36, sx: -0.55, focus: 1, core: 1.0, dim: 0.12 }),
  xp5: kf({ d: 14.5, az: 0.55, el: -0.12, fov: 36, sx: -0.55, focus: 0, core: 0.9, dim: 0.12 }),
  xp6: kf({ d: 16, az: -0.35, el: 0.2, fov: 34, sx: -0.55, focus: 0, core: 0.85, dim: 0.14 }),
  xp7: kf({ d: 18, az: 0.2, el: 0.08, fov: 34, sx: -0.55, focus: -1, core: 0.8, dim: 0.16 }),
  arc: kf({ d: 15, az: 1.35, el: 0.2, fov: 34, sx: -0.55, core: 0.85, dim: 0.16, yaw: 0.2 }),
  edu: kf({ d: 18, az: 2.0, el: 0.26, fov: 34, sx: -0.6, core: 0.8, dim: 0.22 }),
  contact: kf({ d: 11.5, az: 0.12, el: 0.06, fov: 32, sx: 0.0, core: 1.5, shards: 0.8, dim: 0.28 }),
};
