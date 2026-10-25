// Les mondes (décors) : couleurs du ciel, brouillard, sol et lumière de chacun.
// Quand un personnage gagne, le décor devient son monde (voir scene/Stage.jsx pour les éléments 3D).
//   sky = [haut, bas] · fog · ground (herbe/sol autour du terrain) · tint (teinte du gravier) · hemi = [ciel, sol, intensité] · sun = [couleur, intensité]
export const STAGES = {
  gotham: { label: 'GOTHAM CITY', sky: ['#070b1d', '#27345c'], fog: '#222c4a', ground: '#34363f', tint: '#b9b3ba', hemi: ['#8a9ad0', '#2a2d3a', 0.85], sun: ['#a9b8ff', 0.8] },
  gothamPurple: { label: 'GOTHAM · NUIT VIOLETTE', sky: ['#150a2a', '#4a2c78'], fog: '#3a2362', ground: '#33283f', tint: '#c2b0d0', hemi: ['#b49ae6', '#2a1f3a', 0.9], sun: ['#d3b0ff', 0.85] },
  metropolis: { label: 'METROPOLIS', sky: ['#4aa3ff', '#e6f4ff'], fog: '#cfe6ff', ground: '#9fb3c6', tint: '#ffffff', hemi: ['#ffffff', '#8a9aaa', 1.05], sun: ['#fff3d6', 1.5] },
  ice: { label: 'FORTERESSE DE GLACE', sky: ['#1c3c73', '#bfe9ff'], fog: '#bfe3f7', ground: '#e6f4fb', tint: '#e9f6ff', hemi: ['#e0f4ff', '#9bbbd0', 1.1], sun: ['#dff2ff', 1.3] },
  nyc: { label: 'NEW YORK', sky: ['#ff7a45', '#ffd29a'], fog: '#f6b98b', ground: '#6c6a70', tint: '#e9d2bf', hemi: ['#ffe2c2', '#6a5a55', 0.95], sun: ['#ffb070', 1.5] },
  tech: { label: 'STARK TOWER', sky: ['#021521', '#0f4a5f'], fog: '#0a3a4a', ground: '#1d2a33', tint: '#9fc4d0', hemi: ['#7ee7ff', '#1a2a33', 0.9], sun: ['#9fefff', 1.0] },
  canyon: { label: 'CANYON', sky: ['#e9803c', '#ffd49a'], fog: '#f0b27a', ground: '#b9733f', tint: '#e0b48a', hemi: ['#ffe0b8', '#7a4a28', 1.0], sun: ['#ffbf80', 1.6] },
  speed: { label: 'SPEED FORCE', sky: ['#3a0f6b', '#ffb347'], fog: '#a65a68', ground: '#2e2340', tint: '#d2b0c0', hemi: ['#ffd9a0', '#40285a', 0.95], sun: ['#ffc86b', 1.4] },
  greek: { label: 'THEMYSCIRA', sky: ['#2f8fe6', '#d9f1ff'], fog: '#d0ecff', ground: '#e8dfc8', tint: '#fff5df', hemi: ['#ffffff', '#b8b090', 1.05], sun: ['#fff0c8', 1.5] },
  neon: { label: 'CITÉ NÉON', sky: ['#12041f', '#5a1553'], fog: '#3a0f45', ground: '#25202f', tint: '#c9aed0', hemi: ['#ff8be0', '#2a1a3a', 0.9], sun: ['#7fe9ff', 1.0] },
};

const hex = (c) => [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];

// Version numérique d'un monde : sert à fondre doucement d'un décor à l'autre.
export function envOf(id) {
  const s = STAGES[id];
  return {
    skyTop: hex(s.sky[0]), skyBot: hex(s.sky[1]), fog: hex(s.fog), ground: hex(s.ground), tint: hex(s.tint),
    hemiSky: hex(s.hemi[0]), hemiGround: hex(s.hemi[1]), hemiI: [s.hemi[2]], sun: hex(s.sun[0]), sunI: [s.sun[1]],
  };
}
