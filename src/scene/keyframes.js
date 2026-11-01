/**
 * Camera + colour + formation keyframes. Each `[data-kf="name"]` element in the page owns one keyframe;
 * the director interpolates between them as the page scrolls — including the FULL-SCREEN background colour,
 * so the whole page floods from one colour world into the next.
 *
 *  cx,cy,cz  orbit centre        d  orbit distance      az/el  orbit angles     fov  lens
 *  sx        lateral framing: fraction of half-width the subject sits right of centre
 *  pd        extra camera distance on portrait screens
 *  form      swarm formation index (see swarm.js)   spread  vertical spread of the GREAT layers
 *  agent     0..1 pops the Pip character in      sun       chrome sun amount      rock/spin  idle sway / rotation of the swarm      yaw  base rotation
 *  pr        pointer repulsion radius        bg / ac   page background colour and accent colour (hex)
 */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

const BASE = {
  cx: 0, cy: 0, cz: 0, d: 16, az: 0.3, el: 0.12, fov: 34, sx: 0, pd: 1,
  form: 0, spread: 1, sun: 0, agent: 0, rock: 0.12, spin: 0.03, yaw: 0, pr: 2.6,
};
const kf = ({ bg, ac, ...o }) => {
  const [br, bgc, bb] = hex(bg); const [ar, ag, ab] = hex(ac);
  return { ...BASE, ...o, bgr: br, bgg: bgc, bgb: bb, acr: ar, acg: ag, acb: ab };
};

const LIME = '#D4FF1F'; const BLUE = '#2433FF'; const CORAL = '#FF5A3C'; const SKY = '#8FDCFF';
const YEL = '#FFD21F'; const MINT = '#3DF2B0'; const PINK = '#FF6FB5'; const VIOLET = '#5B2BFF';
const CREAM = '#F5F1E8'; const PEACH = '#FFC9A8'; const MINTL = '#A6F7D6'; const LILAC = '#CDBBFF';
const LEMON = '#FFF07A'; const PAPER = '#EEF0FF';
const SKY2 = '#9CC9FF';

export const KF = {
  hero: kf({ bg: LIME, ac: BLUE, form: 0, sun: 1, d: 17, az: 0.3, el: 0.1, sx: 0.85, pd: 1.55, rock: 0.15, spin: 0.045 }),
  profile: kf({ bg: LILAC, ac: '#FF3B2F', form: 1, d: 17, az: -0.4, el: 0.3, sx: 0.6, spin: 0.05 }),
  meet: kf({ bg: '#7C8CFF', ac: '#D4FF1F', form: 2, agent: 1, d: 12, az: 0, el: 0.06, fov: 36, sx: 0.5, spin: 0.03, rock: 0.1, pr: 3 }),
  dive: kf({ bg: BLUE, ac: LIME, form: 3, cz: -6, d: 12, az: 0, el: 0, fov: 72, sx: 0, spin: 0, rock: 0 }),

  cap1: kf({ bg: CORAL, ac: '#FFF1B8', form: 4, d: 20, az: 0.9, el: 0.3, sx: -0.55 }),
  cap2: kf({ bg: SKY, ac: BLUE, form: 5, d: 16, az: -0.6, el: 0.15, sx: 0.55 }),
  cap3: kf({ bg: YEL, ac: '#FF3B2F', form: 6, d: 17, az: 0.9, el: 0.1, sx: -0.55, spin: 0.02 }),
  cap4: kf({ bg: MINT, ac: BLUE, form: 7, d: 17, az: -0.25, el: 0.05, sx: 0.55, spin: 0, rock: 0.2 }),
  cap5: kf({ bg: PINK, ac: BLUE, form: 8, d: 16, az: 0.5, el: 0.15, sx: -0.55 }),

  play: kf({ bg: '#1FD6FF', ac: '#FF1F8E', form: 9, d: 13, az: 0, el: 0.05, fov: 46, sx: 0, spin: 0.05, rock: 0.2, pr: 4.4 }),

  great1: kf({ bg: VIOLET, ac: LIME, form: 10, d: 20, az: 0.5, el: 0.2, sx: 0.5, spin: 0.04 }),
  great2: kf({ bg: VIOLET, ac: LIME, form: 10, cy: 1.5, d: 12, az: -0.5, el: 0.22, sx: -0.5, spread: 1.25, spin: 0.03 }),
  great3: kf({ bg: BLUE, ac: LIME, form: 10, d: 19, az: 0.2, el: 0.5, sx: 0.5, spread: 0.55, spin: 0.05 }),

  w1: kf({ bg: CREAM, ac: BLUE, form: 11, d: 15, az: 0.2, el: 0.08, sx: 0.5, spin: 0, rock: 0.4 }),
  w2: kf({ bg: PEACH, ac: BLUE, form: 12, d: 15, az: -0.2, el: 0.2, sx: -0.5, spin: 0, rock: 0.45 }),
  w3: kf({ bg: MINTL, ac: BLUE, form: 13, d: 14.5, az: 0.15, el: 0.12, sx: 0.5, spin: 0, rock: 0.3 }),
  w4: kf({ bg: LILAC, ac: '#FF3B2F', form: 14, d: 17, az: -0.2, el: 0.62, sx: -0.5, spin: 0.05, rock: 0.2 }),
  w5: kf({ bg: SKY, ac: BLUE, form: 15, d: 16, az: 0.25, el: 0.05, sx: 0.5, spin: 0.04, rock: 0.2 }),
  w6: kf({ bg: LEMON, ac: BLUE, form: 16, d: 16, az: -0.2, el: 0.15, sx: -0.5, spin: 0.05, rock: 0.2 }),

  // Experience: one calm paper-white world; the helix is orbited role by role
  xp0: kf({ bg: LILAC, ac: BLUE, form: 17, d: 27, az: 0.9, el: 0.15, sx: -0.55, spin: 0.02 }),
  xp1: kf({ bg: SKY, ac: BLUE, form: 17, cy: 3, d: 19, az: 0.3, el: 0.1, sx: -0.55, spin: 0.02 }),
  xp2: kf({ bg: MINTL, ac: BLUE, form: 17, cy: 1.8, d: 20, az: -0.5, el: 0.2, sx: -0.55, spin: 0.02 }),
  xp3: kf({ bg: LILAC, ac: BLUE, form: 17, cy: 0.5, d: 20, az: 0.8, el: 0.25, sx: -0.55, spin: 0.02 }),
  xp4: kf({ bg: SKY, ac: BLUE, form: 17, cy: -0.8, d: 20, az: -1.0, el: 0.1, sx: -0.55, spin: 0.02 }),
  xp5: kf({ bg: MINTL, ac: BLUE, form: 17, cy: -2, d: 20, az: 0.6, el: -0.1, sx: -0.55, spin: 0.02 }),
  xp6: kf({ bg: LILAC, ac: BLUE, form: 17, cy: -3, d: 20, az: -0.4, el: 0.2, sx: -0.55, spin: 0.02 }),
  xp7: kf({ bg: SKY, ac: BLUE, form: 17, cy: -3.5, d: 23, az: 0.2, el: 0.08, sx: -0.55, spin: 0.02 }),
  arc: kf({ bg: SKY2, ac: BLUE, form: 18, d: 19, az: 1.2, el: 0.2, sx: -0.58, spin: 0.03 }),
  edu: kf({ bg: MINTL, ac: BLUE, form: 18, d: 19, az: 2.0, el: 0.25, sx: -0.58, spin: 0.03 }),

  contact: kf({ bg: LIME, ac: BLUE, form: 19, d: 17, az: 0.15, el: 0.08, sx: 0.55, spin: 0.08, rock: 0.1 }),
};
