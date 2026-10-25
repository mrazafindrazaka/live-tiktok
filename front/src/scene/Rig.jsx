import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { game } from '../game.js';

const WIDE = { pos: [0, 7.4, 10.4], look: [0, 1.0, -2.4] };
const NIGHT = new Color('#04050c');
const INTRO = { pos: [0, 2.3, 8.6], look: [0, 2.7, 0.9] }; // plan bas de face, comme une présentation de jeu de combat
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

// Où doit être la caméra selon ce qui se passe : plan large, zoom sur le cochonnet, ou suivi du vainqueur.
function goal() {
  const g = game;
  if (g.state === 'ko') {
    const k = g.koInfo;
    const w = g.rig[k.winner];
    if (k.entered) return { ...INTRO, rate: 2.4 };
    if (k.launched && !k.landed) {
      const y = Math.min(w.flyY * 0.12, 9);
      return { pos: [0, 2.6 + y, 6.4], look: [w.x, w.flyY + 1, w.z], rate: 9 };
    }
    return { pos: [0, 2.3, 6.3], look: [0, 1.1, 0.8], rate: 3 };
  }
  if (g.state === 'intro') return { ...INTRO, rate: 2.4 };
  if (g.state === 'flight' || g.state === 'settle') {
    // Zoom sur l'endroit où la boule va atterrir (le cochonnet, ou la boule visée pour un carreau).
    const land = g.cur?.plan?.landing ?? [0, -5];
    const type = g.cur?.plan?.type;
    const zoom = type === 'carreau' ? 1 : type === 'effet' || type === 'tir' ? 0.8 : 0.5;
    const close = { pos: [0.9, 2.0, land[1] + 3.4], look: [land[0] * 0.5, 0.2, land[1] + 0.2] };
    return { pos: mix(WIDE.pos, close.pos, zoom), look: mix(WIDE.look, close.look, zoom), rate: 2.6 };
  }
  return { ...WIDE, rate: 2.2 };
}

// Fait avancer le jeu, place la caméra, et pilote le ciel / flash via des variables CSS.
export default function Rig() {
  useFrame(({ camera, scene }, dt) => {
    if (import.meta.env.DEV) window.__scene = scene; // pour inspecter la scène depuis la console
    game.update(dt);

    const g = goal();
    const k = 1 - Math.exp(-g.rate * Math.min(dt, 0.05));
    for (let i = 0; i < 3; i++) {
      game.camPos[i] += (g.pos[i] - game.camPos[i]) * k;
      game.camLook[i] += (g.look[i] - game.camLook[i]) * k;
    }
    const s = game.shake;
    camera.position.set(
      game.camPos[0] + (Math.random() - 0.5) * s,
      game.camPos[1] + (Math.random() - 0.5) * s,
      game.camPos[2] + (Math.random() - 0.5) * s,
    );
    camera.lookAt(game.camLook[0], game.camLook[1], game.camLook[2]);

    if (scene.fog) scene.fog.color.setRGB(...game.env.fog).lerp(NIGHT, game.space);
    const rgb = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
    const root = document.documentElement.style;
    root.setProperty('--sky1', rgb(game.env.skyTop));
    root.setProperty('--sky2', rgb(game.env.skyBot));
    root.setProperty('--space', game.space.toFixed(3));
    root.setProperty('--flash', game.flash.toFixed(3));
  }, -1);

  return null;
}
