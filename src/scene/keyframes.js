/**
 * Camera + colour + object keyframes. Each `[data-kf="name"]` element in the page owns one keyframe; the director
 * interpolates between them as the page scrolls: camera, background/ink/accent colour (the whole page re-themes), the
 * swarm formation, and WHICH AUTHORED OBJECT is on stage (`prop`).
 *
 *  cx,cy,cz  orbit centre        d  orbit distance     az/el  orbit angles     fov  lens
 *  sx        lateral framing: fraction of half-width the subject sits right of centre
 *  pd        extra camera distance on portrait screens
 *  prop      name of a Blender-authored model in public/models/props (assembled by scroll), or null
 *  swarm     0..1 amount of toy swarm      nf  1 = toys shrink when they would pass in front of the object
 *  form      swarm formation index (swarm.js)   spread  vertical spread of the GREAT layers (legacy)
 *  agent     0..1 pops the Pip character in     sun  chrome sun amount     pr  pointer repulsion radius
 *  bg / ac   page background colour and accent colour (hex)
 */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

const BASE = {
  cx: 0, cy: 0, cz: 0, d: 16, az: 0.3, el: 0.12, fov: 34, sx: 0, pd: 1,
  form: 0, spread: 1, sun: 0, agent: 0, rock: 0.12, spin: 0.03, yaw: 0, pr: 2.6, swarm: 1, nf: 0,
};
const kf = ({ bg, ac, ...o }) => {
  const [br, bgc, bb] = hex(bg); const [ar, ag, ab] = hex(ac);
  return { ...BASE, ...o, bgr: br, bgg: bgc, bgb: bb, acr: ar, acg: ag, acb: ab };
};
/** a chapter whose subject is an authored object */
// (sx is pulled in a little so the object never touches the screen edge)
const obj = (prop, bg, ac, o = {}) => kf({ bg, ac, prop, form: 20, swarm: 0.26, nf: 1, d: 15, az: 0.45, el: 0.26, fov: 34, rock: 0.05, spin: 0.01, pr: 2.2, ...o, sx: (o.sx || 0) * 0.84 });

const LIME = '#D4FF1F'; const BLUE = '#2433FF'; const CORAL = '#FF5A3C'; const SKY = '#8FDCFF';
const YEL = '#FFD21F'; const MINT = '#3DF2B0'; const PINK = '#FF6FB5'; const VIOLET = '#5B2BFF';
const CREAM = '#F5F1E8'; const MINTL = '#A6F7D6'; const LILAC = '#CDBBFF'; const LEMON = '#FFF07A';
const ICE = '#C9F0FF'; const PEACH = '#FFD2B8'; const PAPER = '#E4E8FF';

export const KF = {
  hero: kf({ bg: LIME, ac: BLUE, form: 0, sun: 1, d: 11, az: 0.62, el: 0.14, sx: 0.9, pd: 1.64, rock: 0.15, spin: 0.045, yaw: -0.15 }),
  profile: obj('laptop', LILAC, '#FF3B2F', { d: 14.5, az: -0.4, el: 0.34, sx: 0.55 }),
  meet: kf({ bg: '#7C8CFF', ac: LIME, form: 2, agent: 1, d: 12, az: 0, el: 0.06, fov: 36, sx: 0.5, spin: 0.03, rock: 0.1, pr: 3 }),
  dive: kf({ bg: BLUE, ac: LIME, form: 3, cz: -6, d: 12, az: 0, el: 0, fov: 72, sx: 0, spin: 0, rock: 0 }),

  cap1: obj('orchestra', CORAL, '#FFF1B8', { d: 15.5, az: 0.8, el: 0.38, sx: -0.55 }),
  cap2: obj('library', SKY, BLUE, { d: 15.5, az: -0.5, el: 0.2, sx: 0.55 }),
  cap3: obj('toolbox', YEL, '#FF3B2F', { d: 15, az: 0.55, el: 0.22, sx: -0.55 }),
  cap4: obj('scorecard', MINT, BLUE, { d: 15, az: -0.4, el: 0.12, sx: 0.55 }),
  cap5: obj('shield', PINK, BLUE, { d: 15, az: 0.4, el: 0.1, sx: -0.55 }),

  play: kf({ bg: '#1FD6FF', ac: '#FF1F8E', form: 9, d: 13, az: 0, el: 0.05, fov: 46, sx: 0, spin: 0.05, rock: 0.2, pr: 4.4 }),

  great1: obj('call', VIOLET, LIME, { d: 15.5, az: 0.35, el: 0.18, sx: 0.5 }),
  great2: obj('call', VIOLET, LIME, { cx: -1.5, cy: 0.2, d: 9.5, az: -0.45, el: 0.14, sx: -0.5 }),
  great3: obj('call', BLUE, LIME, { cx: 0.8, cy: -1.5, d: 10, az: 0.25, el: 0.3, sx: 0.5 }),

  w1: obj('loopguard', CREAM, BLUE, { d: 15, az: 0.2, el: 0.12, sx: 0.55 }),
  w2: obj('derm', '#BFE3FF', '#FF3B2F', { d: 15, az: -0.35, el: 0.34, sx: -0.55 }),
  w3: obj('oulad', MINTL, BLUE, { d: 15.5, az: 0.4, el: 0.24, sx: 0.55 }),
  w4: obj('shop', LILAC, '#FF3B2F', { d: 15.5, az: -0.45, el: 0.26, sx: -0.55 }),
  w5: obj('tower', SKY, BLUE, { d: 16.5, az: 0.35, el: 0.16, sx: 0.55 }),
  w6: obj('market', LEMON, BLUE, { d: 16, az: -0.3, el: 0.46, sx: -0.55 }),

  xp0: obj('briefcase', LILAC, BLUE, { d: 15, az: 0.5, el: 0.2, sx: -0.55 }),
  xp1: obj('nyc', SKY, BLUE, { d: 16.5, az: 0.35, el: 0.2, sx: -0.55 }),
  xp2: obj('brain', MINTL, BLUE, { d: 15.5, az: -0.4, el: 0.28, sx: -0.55 }),
  xp3: obj('ship', PEACH, BLUE, { d: 17, az: 0.4, el: 0.28, sx: -0.55 }),
  xp4: obj('heart', ICE, BLUE, { d: 15.5, az: -0.3, el: 0.12, sx: -0.55 }),
  xp5: obj('can', LEMON, BLUE, { d: 15, az: 0.4, el: 0.18, sx: -0.55 }),
  xp6: obj('ocr', LILAC, BLUE, { d: 15, az: -0.3, el: 0.1, sx: -0.55 }),
  xp7: obj('gears', ICE, '#FF3B2F', { d: 15, az: 0.3, el: 0.1, sx: -0.55 }),
  arc: obj('archive', PAPER, BLUE, { d: 16.5, az: 0.5, el: 0.2, sx: -0.5 }),
  edu: obj('edu', MINTL, BLUE, { d: 16.5, az: -0.45, el: 0.26, sx: -0.5 }),

  contact: obj('mail', LIME, BLUE, { d: 16, az: 0.25, el: 0.12, sx: 0.5, swarm: 0.45 }),
};
