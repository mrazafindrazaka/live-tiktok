// Petite danse d'entrée de chaque personnage. Chaque fonction reçoit le temps écoulé (s) et renvoie des écarts de pose :
// armR / armL = [avant-arrière, écart latéral], elbowR / elbowL, hop (saut), spin (tours), flip (salto), crouch, lean, twist,
// head = [x, y], kickR (jambe droite), glow (halo 0..1).
const TAU = Math.PI * 2;
export const DANCE_TIME = 2.6;

const clamp01 = (k) => Math.min(1, Math.max(0, k));
const sm = (k) => clamp01(k) * clamp01(k) * (3 - 2 * clamp01(k));
const arc = (k) => Math.sin(Math.PI * clamp01(k)); // 0 -> 1 -> 0

export const DANCES = {
  // Bras croisés, un tour lent : la cape tourne autour de lui.
  batman: (t) => ({ spin: sm(t / DANCE_TIME) * TAU, armR: [1.0, -0.15], armL: [1.0, 0.15], elbowR: 2.3, elbowL: 2.3, lean: 0.08, crouch: 0.08 }),

  // Pose de héros poings sur les hanches, torse bombé, puis poing levé.
  superman: (t) => ({
    armR: t > 1.6 ? [3.0, 0.1] : [0.1, 0.75], armL: [0.1, -0.75], elbowR: t > 1.6 ? 0.1 : 1.1, elbowL: 1.1, lean: -0.12 + arc((t - 1.6) / 0.5) * 0.1,
    hop: t > 1.6 ? arc((t - 1.6) / 0.5) * 0.3 : 0,
  }),

  // Salto avant, puis pose accroupie en lançant sa toile.
  spiderman: (t) => ({
    flip: -sm((t - 0.3) / 0.9) * TAU, hop: arc((t - 0.3) / 0.9) * 0.9,
    ...(t > 1.3 ? { crouch: 0.5, armR: [1.55, 0], armL: [0.2, 0.6], elbowR: 0.2, lean: 0.3 } : { armR: [2.5, 0.3], armL: [2.5, -0.3] }),
  }),

  // Il flotte, paume en avant, le halo de l'armure qui pulse.
  ironman: (t) => ({ hop: 0.3 + Math.sin(t * 6) * 0.08, armR: [1.6, 0], elbowR: 0.1, armL: [-0.5, 0.45], lean: -0.1, glow: 0.55 + Math.sin(t * 8) * 0.25 }),

  // Il se frappe le torse à tour de rôle.
  hulk: (t) => {
    const p = Math.sin(t * 9);
    return { armR: [0.9 + Math.max(0, p) * 0.5, 0.2], elbowR: 2.1, armL: [0.9 + Math.max(0, -p) * 0.5, -0.2], elbowL: 2.1, crouch: 0.25 + Math.abs(p) * 0.06, hop: Math.abs(p) * 0.07, lean: 0.12 };
  },

  // Il vibre à toute vitesse, les bras qui pompent.
  flash: (t) => ({ spin: Math.sin(t * 38) * 0.25, hop: Math.abs(Math.sin(t * 10)) * 0.12, armR: [0.6 + Math.sin(t * 16), 0.1], armL: [0.6 - Math.sin(t * 16), -0.1], elbowR: 1.5, elbowL: 1.5, crouch: 0.2, lean: 0.2 }),

  // Bracelets croisés, puis un tour bras levés.
  wonderwoman: (t) => (t < 1.2
    ? { armR: [1.2, -0.6], armL: [1.2, 0.6], elbowR: 1.8, elbowL: 1.8, lean: -0.05 }
    : { spin: sm((t - 1.2) / 1.2) * TAU, armR: [3.0, 0.4], armL: [3.0, -0.4], elbowR: 0.1, elbowL: 0.1 }),

  // Bond de vol, un poing levé, puis les mains sur les hanches.
  supergirl: (t) => ({
    hop: arc((t - 0.3) / 1.2) * 0.9, lean: -0.3 * arc((t - 0.3) / 1.2),
    ...(t > 1.6 ? { armR: [0.1, 0.75], armL: [0.1, -0.75], elbowR: 1.1, elbowL: 1.1 } : { armR: [3.0, 0.1], armL: [0.4, 0.5] }),
  }),

  // Un coup de pied en tournant sur elle-même.
  batgirl: (t) => ({ spin: sm(t / 2.0) * TAU, kickR: 1.5 * arc((t - 0.5) / 0.8), lean: -0.15 * arc((t - 0.5) / 0.8), armL: [0.8, 0.9], armR: [-0.6, -0.5], elbowR: 0.3 }),

  // Elle s'étire comme un chat : accroupie, les griffes en avant, la tête qui balance.
  catwoman: (t) => ({ crouch: 0.55, twist: Math.sin(t * 3) * 0.35, armR: [1.5, 0.3], armL: [1.5, -0.3], elbowR: 1.5 + Math.sin(t * 6) * 0.3, elbowL: 1.5 - Math.sin(t * 6) * 0.3, head: [0, Math.sin(t * 3) * 0.3], lean: 0.25 }),
};
